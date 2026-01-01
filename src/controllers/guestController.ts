import "server-only";
import { sanitizeText } from "@/utils/sanitize";
import {
    isRecord,
    parseBoolean,
    parseTeapai,
    assertTokenFormat,
} from "@/utils/validation";
import {
    getInvitationByToken,
    submitGuestRsvp,
    updateGuestRsvp,
} from "@/services/invitationsService";

export async function guestGetInvitation(urlToken: string) {
    assertTokenFormat(urlToken);
    const invitation = await getInvitationByToken(urlToken);
    if (!invitation) {
        throw Object.assign(new Error("Not found"), { status: 404 });
    }
    return invitation;
}

export async function guestSubmitRsvp(params: {
    urlToken: string;
    body: unknown;
    submittedIp: string;
    userAgent: string;
}) {
    assertTokenFormat(params.urlToken);

    if (!isRecord(params.body)) {
        throw Object.assign(new Error("Invalid JSON body"), { status: 400 });
    }

    const isAttendingRaw = params.body.isAttending;
    const isAttending = parseBoolean(isAttendingRaw);
    if (isAttending === null) {
        throw Object.assign(
            new Error("isAttending must be yes/no or boolean"),
            { status: 400 }
        );
    }

    const displayNameRaw = params.body.displayName;
    const wishesRaw = params.body.wishes;
    const teapaiRaw = params.body.teapai;

    const displayName =
        typeof displayNameRaw === "string"
            ? sanitizeText(displayNameRaw, 120)
            : null;
    const wishes =
        typeof wishesRaw === "string" ? sanitizeText(wishesRaw, 1000) : null;

    const existing = await getInvitationByToken(params.urlToken);
    if (!existing) {
        throw Object.assign(new Error("Not found"), { status: 404 });
    }

    let teapai: "pagi" | "malam" | null = null;
    if (existing.is_family) {
        teapai = parseTeapai(teapaiRaw);
        if (!teapai) {
            throw Object.assign(
                new Error("teapai must be one of: pagi | malam"),
                { status: 400 }
            );
        }
    }

    // Check if this is an update (already responded) or new submission
    const isUpdate = existing.responded_at !== null;

    if (isUpdate) {
        const result = await updateGuestRsvp({
            urlToken: params.urlToken,
            displayName,
            isAttending,
            wishes,
            teapai,
            submittedIp: params.submittedIp,
            userAgent: params.userAgent,
        });

        if (!result.ok) {
            throw Object.assign(new Error("Not found"), { status: 404 });
        }

        return { ok: true, updated: true };
    } else {
        const result = await submitGuestRsvp({
            urlToken: params.urlToken,
            displayName,
            isAttending,
            wishes,
            teapai,
            submittedIp: params.submittedIp,
            userAgent: params.userAgent,
        });

        if (!result.ok) {
            if (result.reason === "already_responded") {
                throw Object.assign(new Error("Already responded"), {
                    status: 409,
                });
            }
            throw Object.assign(new Error("Not found"), { status: 404 });
        }

        return { ok: true, responded_at: result.respondedAt };
    }
}
