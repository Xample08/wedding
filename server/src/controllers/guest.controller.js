const {
    guestViewByToken,
    guestSubmitRsvp,
} = require("../services/invitation.service");
const { asTrimmedString, asOptionalBoolean, pickIp } = require("../utils/http");

function validateTokenParam(token) {
    if (typeof token !== "string" || !/^[a-f0-9]{32}$/.test(token)) {
        const err = new Error("Invalid url_token");
        err.status = 400;
        throw err;
    }
    return token;
}

async function getInvitationByToken(req, res) {
    const token = validateTokenParam(req.params.token);
    const inv = await guestViewByToken(token);
    if (!inv) return res.status(404).json({ error: "Invitation not found" });

    return res.json({
        invitation: {
            url_token: inv.url_token,
            name: inv.name,
            display_name: inv.display_name,
            number_of_guests: inv.number_of_guests,
            is_attending: inv.is_attending,
            is_family: inv.is_family,
            show_wishes: inv.show_wishes,
            type: inv.type,
            teapai: inv.teapai,
            wishes: inv.wishes,
            responded_at: inv.responded_at,
            has_responded: Boolean(inv.responded_at),
        },
    });
}

async function submitRsvp(req, res) {
    const token = validateTokenParam(req.params.token);

    const displayName = asTrimmedString(req.body?.display_name);
    const wishes = asTrimmedString(req.body?.wishes);
    const teapai = asTrimmedString(req.body?.teapai);
    const isAttending = asOptionalBoolean(req.body?.is_attending);

    if (isAttending === null) {
        return res
            .status(400)
            .json({ error: "is_attending must be a boolean (or yes/no)" });
    }

    const submittedIp = pickIp(req);
    const userAgent =
        typeof req.headers["user-agent"] === "string"
            ? req.headers["user-agent"]
            : null;

    await guestSubmitRsvp({
        urlToken: token,
        displayName,
        isAttending,
        wishes,
        teapai,
        submittedIp,
        userAgent,
    });

    return res.json({ ok: true });
}

module.exports = {
    getInvitationByToken,
    submitRsvp,
};
