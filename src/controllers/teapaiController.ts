import "server-only";
import { generateUrlToken } from "@/utils/token";
import { sanitizeText } from "@/utils/sanitize";
import { isRecord, parseInteger } from "@/utils/validation";
import * as teapaiService from "@/services/teapaiService";

export async function adminCreateTeapai(body: unknown) {
    if (!isRecord(body)) {
        throw Object.assign(new Error("Invalid JSON body"), { status: 400 });
    }

    const nameRaw = body.name;
    const maxGuestsRaw = body.number_of_guests;
    const adminNoteRaw = body.admin_note;

    if (typeof nameRaw !== "string" || !nameRaw.trim()) {
        throw Object.assign(new Error("name is required"), { status: 400 });
    }

    const name = sanitizeText(nameRaw, 150);
    const numberOfGuests = parseInteger(maxGuestsRaw);

    if (numberOfGuests === null || numberOfGuests <= 0) {
        throw Object.assign(new Error("number_of_guests must be > 0"), { status: 400 });
    }

    let urlToken = generateUrlToken();
    try {
        await teapaiService.createTeapaiInvitation({
            urlToken,
            name,
            numberOfGuests,
            adminNote: typeof adminNoteRaw === "string" ? sanitizeText(adminNoteRaw, 255) : undefined,
            createdBy: "superadmin"
        });
    } catch (err: any) {
        if (err?.code === "ER_DUP_ENTRY") {
            // Retry once with new token
            urlToken = generateUrlToken();
            await teapaiService.createTeapaiInvitation({
                urlToken,
                name,
                numberOfGuests,
                adminNote: typeof adminNoteRaw === "string" ? sanitizeText(adminNoteRaw, 255) : undefined,
                createdBy: "superadmin"
            });
        } else {
            throw err;
        }
    }

    return { url_token: urlToken };
}

export async function guestGetTeapai(token: string) {
    const record = await teapaiService.getTeapaiByToken(token);
    if (!record) {
        throw Object.assign(new Error("Invitation not found"), { status: 404 });
    }
    return record;
}

export async function guestUpdateTeapai(token: string, body: unknown, ip?: string, ua?: string) {
    if (!isRecord(body)) {
        throw Object.assign(new Error("Invalid JSON body"), { status: 400 });
    }

    const {
        display_name,
        expected_attendance,
        is_attending,
        teapai
    } = body;

    if (typeof display_name !== "string" || !display_name.trim()) {
        throw Object.assign(new Error("Display name is required"), { status: 400 });
    }

    const isAttendingNum = is_attending ? 1 : 0;
    const expectedNum = parseInteger(expected_attendance) ?? 0;

    if (isAttendingNum === 1 && (expectedNum <= 0)) {
        throw Object.assign(new Error("Expected attendance must be at least 1"), { status: 400 });
    }

    if (teapai !== "pagi" && teapai !== "malam") {
        throw Object.assign(new Error("Session must be pagi or malam"), { status: 400 });
    }

    const ok = await teapaiService.updateTeapaiResponse(token, {
        display_name: sanitizeText(display_name, 150),
        expected_attendance: expectedNum,
        is_attending: isAttendingNum,
        teapai: teapai as "pagi" | "malam",
        submitted_ip: ip,
        user_agent: ua
    });

    if (!ok) {
        throw Object.assign(new Error("Failed to update response"), { status: 500 });
    }

    return { success: true };
}

export async function adminListTeapai() {
    return await teapaiService.listTeapaiInvitations();
}
