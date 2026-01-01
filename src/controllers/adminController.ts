import "server-only";
import { sanitizeText } from "@/utils/sanitize";
import {
    isRecord,
    parseBoolean,
    parseInteger,
    parseInvitationType,
    assertTokenFormat,
} from "@/utils/validation";
import {
    adminListInvitations,
    adminSummary,
    adminUpdateInvitation,
} from "@/services/invitationsService";

export async function adminPatchInvitation(urlToken: string, body: unknown) {
    assertTokenFormat(urlToken);

    if (!isRecord(body)) {
        throw Object.assign(new Error("Invalid JSON body"), { status: 400 });
    }

    const actualRaw = body.actual_attendance;
    const gaveGiftRaw = body.gave_gift;
    const adminNoteRaw = body.admin_note;

    let actualAttendance: number | null = null;
    if (actualRaw !== undefined) {
        const n = parseInteger(actualRaw);
        if (n === null || n < 0) {
            throw Object.assign(
                new Error("actual_attendance must be an integer >= 0"),
                { status: 400 }
            );
        }
        actualAttendance = n;
    }

    let gaveGift: boolean | null = null;
    if (gaveGiftRaw !== undefined) {
        const b = parseBoolean(gaveGiftRaw);
        if (b === null) {
            throw Object.assign(new Error("gave_gift must be boolean"), {
                status: 400,
            });
        }
        gaveGift = b;
    }

    let adminNote: string | null = null;
    if (adminNoteRaw !== undefined) {
        if (typeof adminNoteRaw !== "string") {
            throw Object.assign(new Error("admin_note must be a string"), {
                status: 400,
            });
        }
        adminNote = sanitizeText(adminNoteRaw, 1000);
    }

    const ok = await adminUpdateInvitation({
        urlToken,
        actualAttendance,
        gaveGift,
        adminNote,
    });

    if (!ok) {
        throw Object.assign(new Error("Not found or no fields to update"), {
            status: 404,
        });
    }

    return { ok: true };
}

export async function adminGetInvitations(searchParams: URLSearchParams) {
    const isAttendingRaw = searchParams.get("is_attending");
    const isFamilyRaw = searchParams.get("is_family");
    const typeRaw = searchParams.get("type");

    const filters: any = {};

    if (isAttendingRaw !== null) {
        const b = parseBoolean(isAttendingRaw);
        if (b === null) {
            throw Object.assign(
                new Error("is_attending must be yes/no or boolean"),
                { status: 400 }
            );
        }
        filters.isAttending = b;
    }

    if (isFamilyRaw !== null) {
        const b = parseBoolean(isFamilyRaw);
        if (b === null) {
            throw Object.assign(
                new Error("is_family must be yes/no or boolean"),
                { status: 400 }
            );
        }
        filters.isFamily = b;
    }

    if (typeRaw !== null) {
        const t = parseInvitationType(typeRaw);
        if (!t) {
            throw Object.assign(
                new Error(
                    "type must be one of: resepsi | holy_matrimony | both"
                ),
                { status: 400 }
            );
        }
        filters.type = t;
    }

    return adminListInvitations(filters);
}

export async function adminGetSummary(searchParams: URLSearchParams) {
    const isAttendingRaw = searchParams.get("is_attending");
    const isFamilyRaw = searchParams.get("is_family");
    const typeRaw = searchParams.get("type");

    const filters: any = {};

    if (isAttendingRaw !== null) {
        const b = parseBoolean(isAttendingRaw);
        if (b === null) {
            throw Object.assign(
                new Error("is_attending must be yes/no or boolean"),
                { status: 400 }
            );
        }
        filters.isAttending = b;
    }

    if (isFamilyRaw !== null) {
        const b = parseBoolean(isFamilyRaw);
        if (b === null) {
            throw Object.assign(
                new Error("is_family must be yes/no or boolean"),
                { status: 400 }
            );
        }
        filters.isFamily = b;
    }

    if (typeRaw !== null) {
        const t = parseInvitationType(typeRaw);
        if (!t) {
            throw Object.assign(
                new Error(
                    "type must be one of: resepsi | holy_matrimony | both"
                ),
                { status: 400 }
            );
        }
        filters.type = t;
    }

    return adminSummary(filters);
}
