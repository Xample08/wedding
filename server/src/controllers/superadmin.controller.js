const { generateUrlToken } = require("../utils/token");
const {
    createInvitation,
    softDeleteByToken,
} = require("../services/invitation.service");
const {
    asOptionalInt,
    asOptionalBoolean,
    asTrimmedString,
} = require("../utils/http");

function buildInviteUrl(urlToken) {
    const base = process.env.INVITE_URL_BASE;
    if (!base) return null;
    const trimmed = base.replace(/\/$/, "");
    return `${trimmed}/${urlToken}`;
}

function validateTokenParam(token) {
    if (typeof token !== "string" || !/^[a-f0-9]{32}$/.test(token)) {
        const err = new Error("Invalid url_token");
        err.status = 400;
        throw err;
    }
    return token;
}

async function createInvitationHandler(req, res) {
    const name = asTrimmedString(req.body?.name);
    const numberOfGuests = asOptionalInt(req.body?.number_of_guests);
    const isFamily = asOptionalBoolean(req.body?.is_family);
    const type = asTrimmedString(req.body?.type);

    if (!name) {
        return res.status(400).json({ error: "name is required" });
    }

    if (numberOfGuests === null || numberOfGuests <= 0) {
        return res
            .status(400)
            .json({ error: "number_of_guests must be a positive integer" });
    }

    if (isFamily === null) {
        return res.status(400).json({ error: "is_family must be a boolean" });
    }

    if (!type) {
        return res
            .status(400)
            .json({ error: "type is required (resepsi|holy_matrimony|both)" });
    }

    // Retry token generation on the extremely unlikely collision (unique key)
    let lastError = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const urlToken = generateUrlToken();
        try {
            await createInvitation({
                urlToken,
                name,
                numberOfGuests,
                isFamily,
                type,
            });

            const invitationUrl = buildInviteUrl(urlToken);
            return res.status(201).json({
                url_token: urlToken,
                invitation_url: invitationUrl,
            });
        } catch (err) {
            // MySQL duplicate key error: ER_DUP_ENTRY
            if (err && err.code === "ER_DUP_ENTRY") {
                lastError = err;
                continue;
            }
            throw err;
        }
    }

    return res.status(500).json({
        error: "Failed to generate unique token",
        details:
            process.env.NODE_ENV !== "production"
                ? String(lastError)
                : undefined,
    });
}

async function softDeleteHandler(req, res) {
    const token = validateTokenParam(req.params.token);
    const affected = await softDeleteByToken(token);

    if (!affected) {
        return res.status(404).json({ error: "Invitation not found" });
    }

    return res.json({ ok: true });
}

module.exports = {
    createInvitationHandler,
    softDeleteHandler,
};
