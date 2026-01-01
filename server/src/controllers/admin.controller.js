const {
    adminUpdateByToken,
    adminSummary,
    adminList,
} = require("../services/invitation.service");
const {
    asOptionalInt,
    asOptionalBoolean,
    asTrimmedString,
} = require("../utils/http");

function validateTokenParam(token) {
    if (typeof token !== "string" || !/^[a-f0-9]{32}$/.test(token)) {
        const err = new Error("Invalid url_token");
        err.status = 400;
        throw err;
    }
    return token;
}

function parseFilters(req) {
    const isAttending = asOptionalBoolean(req.query.is_attending);
    const isFamily = asOptionalBoolean(req.query.is_family);
    const type = asTrimmedString(req.query.type);

    // If query param present but invalid, reject
    if (req.query.is_attending !== undefined && isAttending === null) {
        const err = new Error("Invalid is_attending filter");
        err.status = 400;
        throw err;
    }
    if (req.query.is_family !== undefined && isFamily === null) {
        const err = new Error("Invalid is_family filter");
        err.status = 400;
        throw err;
    }

    return { isAttending, isFamily, type };
}

async function updateInvitation(req, res) {
    const token = validateTokenParam(req.params.token);

    const actualAttendance =
        req.body?.actual_attendance === undefined
            ? undefined
            : asOptionalInt(req.body?.actual_attendance);

    const gaveGift =
        req.body?.gave_gift === undefined
            ? undefined
            : asOptionalBoolean(req.body?.gave_gift);

    const adminNote =
        req.body?.admin_note === undefined
            ? undefined
            : asTrimmedString(req.body?.admin_note);

    if (actualAttendance !== undefined && actualAttendance === null) {
        return res
            .status(400)
            .json({ error: "actual_attendance must be an integer" });
    }

    if (gaveGift !== undefined && gaveGift === null) {
        return res.status(400).json({ error: "gave_gift must be a boolean" });
    }

    const affected = await adminUpdateByToken({
        urlToken: token,
        actualAttendance,
        gaveGift,
        adminNote,
    });

    if (!affected) {
        return res.status(404).json({ error: "Invitation not found" });
    }

    return res.json({ ok: true });
}

async function getSummary(req, res) {
    const filters = parseFilters(req);
    const summary = await adminSummary(filters);
    return res.json({ summary });
}

async function listInvitations(req, res) {
    const filters = parseFilters(req);
    const invitations = await adminList(filters);
    return res.json({ invitations });
}

module.exports = {
    updateInvitation,
    getSummary,
    listInvitations,
};
