import "server-only";
import { buildInvitationUrl, generateUrlToken } from "@/utils/token";
import { sanitizeText } from "@/utils/sanitize";
import {
    isRecord,
    parseBoolean,
    parseInteger,
    parseInvitationType,
} from "@/utils/validation";
import {
    createInvitation,
    superadminListInvitations,
    softDeleteInvitation,
} from "@/services/invitationsService";

export async function superadminCreateInvitation(
    body: unknown
): Promise<{ invitation_url: string; url_token: string }> {
    if (!isRecord(body)) {
        throw Object.assign(new Error("Invalid JSON body"), { status: 400 });
    }

    const nameRaw = body.name;
    const numberRaw = body.number_of_guests;
    const isFamilyRaw = body.is_family;
    const typeRaw = body.type;

    if (typeof nameRaw !== "string") {
        throw Object.assign(new Error("name is required"), { status: 400 });
    }

    const name = sanitizeText(nameRaw, 120);
    const numberOfGuests = parseInteger(numberRaw);
    const isFamily = parseBoolean(isFamilyRaw);
    const type = parseInvitationType(typeRaw);

    if (!name) {
        throw Object.assign(new Error("name is required"), { status: 400 });
    }
    if (numberOfGuests === null || numberOfGuests <= 0) {
        throw Object.assign(
            new Error("number_of_guests must be a positive integer"),
            { status: 400 }
        );
    }
    if (isFamily === null) {
        throw Object.assign(new Error("is_family must be boolean"), {
            status: 400,
        });
    }
    if (!type) {
        throw Object.assign(
            new Error("type must be one of: resepsi | holy_matrimony | both"),
            { status: 400 }
        );
    }

    let urlToken = generateUrlToken();
    let lastErr: unknown = null;

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await createInvitation({
                urlToken,
                name,
                numberOfGuests,
                isFamily,
                type,
            });
            lastErr = null;
            break;
        } catch (err: any) {
            lastErr = err;
            if (err?.code === "ER_DUP_ENTRY") {
                urlToken = generateUrlToken();
                continue;
            }
            throw err;
        }
    }

    if (lastErr) {
        throw Object.assign(new Error("Failed to generate unique token"), {
            status: 500,
        });
    }

    const invitationUrl = buildInvitationUrl(urlToken);
    return { invitation_url: invitationUrl, url_token: urlToken };
}

export async function superadminSoftDeleteInvitation(
    urlToken: string
): Promise<void> {
    const ok = await softDeleteInvitation(urlToken);
    if (!ok) {
        throw Object.assign(new Error("Not found"), { status: 404 });
    }
}

export async function superadminGetInvitations(): Promise<
    Array<{
        url_token: string;
        invitation_url: string;
        name: string;
        display_name: string | null;
        number_of_guests: number;
        is_family: boolean;
        type: "resepsi" | "holy_matrimony" | "both";
        is_attending: boolean | null;
        responded_at: string | null;
        created_at: string | null;
    }>
> {
    const rows = await superadminListInvitations();
    return rows.map((r) => ({
        ...r,
        invitation_url: buildInvitationUrl(r.url_token),
    }));
}
