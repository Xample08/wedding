const { query, pool } = require("../db/connection");

const TABLE = "invitations";

function normalizeType(type) {
    if (type === null || type === undefined) return null;
    if (typeof type !== "string") return null;
    const v = type.trim();
    if (!["resepsi", "holy_matrimony", "both"].includes(v)) return null;
    return v;
}

function normalizeTeapai(teapai) {
    if (teapai === null || teapai === undefined) return null;
    if (typeof teapai !== "string") return null;
    const v = teapai.trim();
    if (!["pagi", "malam"].includes(v)) return null;
    return v;
}

async function findByToken(urlToken) {
    const rows = await query(
        `SELECT url_token, name, display_name, number_of_guests, actual_attendance, is_attending, is_family, show_wishes, gave_gift, type, teapai, wishes, responded_at, admin_note, submitted_ip, user_agent, created_at, updated_at, deleted_at
         FROM ${TABLE}
         WHERE url_token = :urlToken
           AND deleted_at IS NULL
         LIMIT 1`,
        { urlToken }
    );

    return rows[0] || null;
}

async function guestViewByToken(urlToken) {
    const rows = await query(
        `SELECT url_token, name, display_name, number_of_guests, is_attending, is_family, show_wishes, type, teapai, wishes, responded_at
         FROM ${TABLE}
         WHERE url_token = :urlToken
           AND deleted_at IS NULL
         LIMIT 1`,
        { urlToken }
    );

    return rows[0] || null;
}

async function createInvitation({
    urlToken,
    name,
    numberOfGuests,
    isFamily,
    type,
}) {
    const normalizedType = normalizeType(type);
    if (!normalizedType) {
        const err = new Error(
            "Invalid type. Must be one of: resepsi, holy_matrimony, both"
        );
        err.status = 400;
        throw err;
    }

    await query(
        `INSERT INTO ${TABLE} (url_token, name, number_of_guests, is_family, type, created_at, updated_at)
         VALUES (:urlToken, :name, :numberOfGuests, :isFamily, :type, NOW(), NOW())`,
        {
            urlToken,
            name,
            numberOfGuests,
            isFamily: isFamily ? 1 : 0,
            type: normalizedType,
        }
    );

    return { urlToken };
}

async function softDeleteByToken(urlToken) {
    const result = await query(
        `UPDATE ${TABLE}
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE url_token = :urlToken
           AND deleted_at IS NULL`,
        { urlToken }
    );

    return result.affectedRows || 0;
}

async function guestSubmitRsvp({
    urlToken,
    displayName,
    isAttending,
    wishes,
    teapai,
    submittedIp,
    userAgent,
}) {
    const current = await query(
        `SELECT url_token, responded_at, is_family
         FROM ${TABLE}
         WHERE url_token = :urlToken
           AND deleted_at IS NULL
         LIMIT 1`,
        { urlToken }
    );

    const row = current[0];
    if (!row) {
        const err = new Error("Invitation not found");
        err.status = 404;
        throw err;
    }

    if (row.responded_at) {
        const err = new Error("RSVP already submitted");
        err.status = 409;
        throw err;
    }

    const requiresTeapai = Boolean(row.is_family);
    const normalizedTeapai = normalizeTeapai(teapai);
    if (requiresTeapai && !normalizedTeapai) {
        const err = new Error("teapai is required for family (pagi|malam)");
        err.status = 400;
        throw err;
    }

    const normalizedIsAttending = isAttending ? 1 : 0;

    await query(
        `UPDATE ${TABLE}
         SET display_name = :displayName,
             is_attending = :isAttending,
             wishes = :wishes,
             teapai = :teapai,
             responded_at = NOW(),
             submitted_ip = :submittedIp,
             user_agent = :userAgent,
             updated_at = NOW()
         WHERE url_token = :urlToken
           AND deleted_at IS NULL
           AND responded_at IS NULL`,
        {
            urlToken,
            displayName,
            isAttending: normalizedIsAttending,
            wishes,
            teapai: normalizedTeapai,
            submittedIp,
            userAgent,
        }
    );

    return { urlToken };
}

async function adminUpdateByToken({
    urlToken,
    actualAttendance,
    gaveGift,
    adminNote,
}) {
    const fields = [];
    const params = { urlToken };

    if (actualAttendance !== undefined) {
        fields.push("actual_attendance = :actualAttendance");
        params.actualAttendance = actualAttendance;
    }

    if (gaveGift !== undefined) {
        fields.push("gave_gift = :gaveGift");
        params.gaveGift = gaveGift ? 1 : 0;
    }

    if (adminNote !== undefined) {
        fields.push("admin_note = :adminNote");
        params.adminNote = adminNote;
    }

    if (!fields.length) {
        const err = new Error("No fields to update");
        err.status = 400;
        throw err;
    }

    fields.push("updated_at = NOW()");

    const sql = `UPDATE ${TABLE}
                SET ${fields.join(", ")}
                WHERE url_token = :urlToken
                  AND deleted_at IS NULL`;

    const result = await pool.execute(sql, params);
    const meta = result[0];
    return meta.affectedRows || 0;
}

function buildFilters({ isAttending, isFamily, type }) {
    const where = ["deleted_at IS NULL"];
    const params = {};

    if (isAttending !== null && isAttending !== undefined) {
        where.push("is_attending = :isAttending");
        params.isAttending = isAttending ? 1 : 0;
    }

    if (isFamily !== null && isFamily !== undefined) {
        where.push("is_family = :isFamily");
        params.isFamily = isFamily ? 1 : 0;
    }

    if (type !== null && type !== undefined) {
        const normalizedType = normalizeType(type);
        if (!normalizedType) {
            const err = new Error(
                "Invalid type filter. Must be one of: resepsi, holy_matrimony, both"
            );
            err.status = 400;
            throw err;
        }
        where.push("type = :type");
        params.type = normalizedType;
    }

    return { whereSql: where.join(" AND "), params };
}

async function adminList({ isAttending, isFamily, type }) {
    const { whereSql, params } = buildFilters({ isAttending, isFamily, type });

    const rows = await query(
        `SELECT url_token, name, display_name, number_of_guests, actual_attendance, is_attending, is_family, type, teapai, gave_gift, responded_at, admin_note, updated_at
         FROM ${TABLE}
         WHERE ${whereSql}
         ORDER BY created_at DESC`,
        params
    );

    return rows;
}

async function adminSummary({ isAttending, isFamily, type }) {
    const { whereSql, params } = buildFilters({ isAttending, isFamily, type });

    const rows = await query(
        `SELECT
            COUNT(*) AS total_invitations,
            SUM(CASE WHEN responded_at IS NOT NULL THEN 1 ELSE 0 END) AS total_responded,
            SUM(CASE WHEN is_attending = 1 THEN 1 ELSE 0 END) AS attending_count,
            SUM(CASE WHEN is_attending = 0 THEN 1 ELSE 0 END) AS not_attending_count,
            SUM(CASE WHEN is_attending = 1 THEN number_of_guests ELSE 0 END) AS expected_guests,
            SUM(CASE WHEN actual_attendance IS NOT NULL THEN actual_attendance ELSE 0 END) AS actual_attendance_total,
            SUM(CASE WHEN is_attending = 1 OR gave_gift = 1 THEN 1 ELSE 0 END) AS souvenir_count
         FROM ${TABLE}
         WHERE ${whereSql}`,
        params
    );

    return rows[0] || null;
}

module.exports = {
    findByToken,
    guestViewByToken,
    createInvitation,
    softDeleteByToken,
    guestSubmitRsvp,
    adminUpdateByToken,
    adminList,
    adminSummary,
};
