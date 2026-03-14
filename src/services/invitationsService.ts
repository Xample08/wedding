import "server-only";
import { pool } from "@/db/connection";
import type { InvitationType, Teapai } from "@/utils/validation";
import type { ResultSetHeader } from "mysql2";
import { retryDbOperation } from "@/utils/dbRetry";

export type InvitationPublic = {
    url_token: string;
    name: string;
    display_name: string | null;
    number_of_guests: number;
    expected_attendance: number | null;
    is_attending: boolean | null;
    is_family: boolean;
    type: InvitationType;
    teapai: Teapai | null;
    wishes: string | null;
    responded_at: string | null;
    show_wishes: boolean | null;
};

export type InvitationAdminView = InvitationPublic & {
    actual_attendance: number | null;
    gave_gift: boolean | null;
    admin_note: string | null;
};

export type InvitationSuperadminRow = {
    url_token: string;
    name: string;
    display_name: string | null;
    number_of_guests: number;
    is_family: boolean;
    type: InvitationType;
    is_attending: boolean | null;
    responded_at: string | null;
    created_at: string | null;
};

function rowToPublic(row: any): InvitationPublic {
    return {
        url_token: String(row.url_token),
        name: String(row.name),
        display_name:
            row.display_name == null ? null : String(row.display_name),
        number_of_guests: Number(row.number_of_guests),
        expected_attendance:
            row.expected_attendance == null
                ? null
                : Number(row.expected_attendance),
        is_attending:
            row.is_attending == null ? null : Boolean(Number(row.is_attending)),
        is_family: Boolean(Number(row.is_family)),
        type: row.type as InvitationType,
        teapai: row.teapai == null ? null : (row.teapai as Teapai),
        wishes: row.wishes == null ? null : String(row.wishes),
        responded_at:
            row.responded_at == null ? null : String(row.responded_at),
        show_wishes:
            row.show_wishes == null ? null : Boolean(Number(row.show_wishes)),
    };
}

function rowToAdmin(row: any): InvitationAdminView {
    return {
        ...rowToPublic(row),
        actual_attendance:
            row.actual_attendance == null
                ? null
                : Number(row.actual_attendance),
        gave_gift:
            row.gave_gift == null ? null : Boolean(Number(row.gave_gift)),
        admin_note: row.admin_note == null ? null : String(row.admin_note),
    };
}

function rowToSuperadmin(row: any): InvitationSuperadminRow {
    return {
        url_token: String(row.url_token),
        name: String(row.name),
        display_name:
            row.display_name == null ? null : String(row.display_name),
        number_of_guests: Number(row.number_of_guests),
        is_family: Boolean(Number(row.is_family)),
        type: row.type as InvitationType,
        is_attending:
            row.is_attending == null ? null : Boolean(Number(row.is_attending)),
        responded_at:
            row.responded_at == null ? null : String(row.responded_at),
        created_at: row.created_at == null ? null : String(row.created_at),
    };
}

export async function createInvitation(input: {
    urlToken: string;
    name: string;
    numberOfGuests: number;
    isFamily: boolean;
    type: InvitationType;
}): Promise<void> {
    await retryDbOperation(() =>
        pool.execute(
            `INSERT INTO invitations (
                url_token,
                name,
                number_of_guests,
                is_family,
                type,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                input.urlToken,
                input.name,
                input.numberOfGuests,
                input.isFamily ? 1 : 0,
                input.type,
            ],
        ),
    );
}

export async function superadminListInvitations(): Promise<
    InvitationSuperadminRow[]
> {
    const [rows] = await retryDbOperation(() =>
        pool.execute(
            `SELECT url_token, name, display_name, number_of_guests, is_family, type, is_attending, responded_at, created_at
             FROM invitations
             WHERE deleted_at IS NULL
             ORDER BY created_at DESC`,
        ),
    );

    return (rows as any[]).map(rowToSuperadmin);
}

export async function softDeleteInvitation(urlToken: string): Promise<boolean> {
    const [result] = await retryDbOperation(() =>
        pool.execute<ResultSetHeader>(
            `UPDATE invitations
             SET deleted_at = NOW(), updated_at = NOW()
             WHERE url_token = ? AND deleted_at IS NULL`,
            [urlToken],
        ),
    );
    return result.affectedRows > 0;
}

export async function getInvitationByToken(
    urlToken: string,
): Promise<InvitationPublic | null> {
    const [rows] = await retryDbOperation(() =>
        pool.execute(
            `SELECT url_token, name, display_name, number_of_guests, expected_attendance, is_attending, is_family, type, teapai, wishes, responded_at, show_wishes
             FROM invitations
             WHERE url_token = ? AND deleted_at IS NULL
             LIMIT 1`,
            [urlToken],
        ),
    );
    const row = (rows as any[])[0];
    if (!row) return null;
    return rowToPublic(row);
}

export async function submitGuestRsvp(input: {
    urlToken: string;
    displayName: string | null;
    expectedAttendance: number;
    isAttending: boolean;
    wishes: string | null;
    teapai: Teapai | null;
    submittedIp: string;
    userAgent: string;
}): Promise<
    | { ok: true; respondedAt: string }
    | { ok: false; reason: "not_found" | "already_responded" }
> {
    const [result] = await retryDbOperation(() =>
        pool.execute<ResultSetHeader>(
            `UPDATE invitations
             SET display_name = ?,
                 expected_attendance = ?,
                 is_attending = ?,
                 wishes = ?,
                 teapai = ?,
                 responded_at = NOW(),
                 submitted_ip = ?,
                 user_agent = ?,
                 updated_at = NOW()
             WHERE url_token = ?
               AND deleted_at IS NULL
               AND responded_at IS NULL`,
            [
                input.displayName,
                input.expectedAttendance,
                input.isAttending ? 1 : 0,
                input.wishes,
                input.teapai,
                input.submittedIp,
                input.userAgent,
                input.urlToken,
            ],
        ),
    );

    if (result.affectedRows > 0) {
        const [rows] = await retryDbOperation(() =>
            pool.execute(
                `SELECT responded_at FROM invitations WHERE url_token = ? LIMIT 1`,
                [input.urlToken],
            ),
        );
        const respondedAt = (rows as any[])[0]?.responded_at;
        return { ok: true, respondedAt: String(respondedAt ?? "") };
    }

    const [rows] = await retryDbOperation(() =>
        pool.execute(
            `SELECT responded_at
             FROM invitations
             WHERE url_token = ? AND deleted_at IS NULL
             LIMIT 1`,
            [input.urlToken],
        ),
    );
    const row = (rows as any[])[0];
    if (!row) return { ok: false, reason: "not_found" };
    if (row.responded_at != null)
        return { ok: false, reason: "already_responded" };
    return { ok: false, reason: "not_found" };
}

export async function updateGuestRsvp(input: {
    urlToken: string;
    displayName: string | null;
    expectedAttendance: number;
    isAttending: boolean;
    wishes: string | null;
    teapai: Teapai | null;
    submittedIp: string;
    userAgent: string;
}): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
    // First get the current invitation to check if wishes changed
    const [currentRows] = await retryDbOperation(() =>
        pool.execute(
            `SELECT wishes FROM invitations WHERE url_token = ? AND deleted_at IS NULL LIMIT 1`,
            [input.urlToken],
        ),
    );
    const currentRow = (currentRows as any[])[0];
    if (!currentRow) return { ok: false, reason: "not_found" };

    const wishesChanged = currentRow.wishes !== input.wishes;

    const [result] = await retryDbOperation(() =>
        pool.execute<ResultSetHeader>(
            `UPDATE invitations
             SET display_name = ?,
                 expected_attendance = ?,
                 is_attending = ?,
                 wishes = ?,
                 teapai = ?,
                 submitted_ip = ?,
                 user_agent = ?,
                 show_wishes = IF(? = 1, 0, show_wishes),
                 updated_at = NOW()
             WHERE url_token = ?
               AND deleted_at IS NULL
               AND responded_at IS NOT NULL`,
            [
                input.displayName,
                input.expectedAttendance,
                input.isAttending ? 1 : 0,
                input.wishes,
                input.teapai,
                input.submittedIp,
                input.userAgent,
                wishesChanged ? 1 : 0,
                input.urlToken,
            ],
        ),
    );

    if (result.affectedRows > 0) {
        return { ok: true };
    }

    return { ok: false, reason: "not_found" };
}

export async function adminUpdateInvitation(input: {
    urlToken: string;
    actualAttendance: number | null;
    gaveGift: boolean | null;
    adminNote: string | null;
}): Promise<boolean> {
    const sets: string[] = [];
    const params: any[] = [];

    if (input.actualAttendance !== null) {
        sets.push("actual_attendance = ?");
        params.push(input.actualAttendance);
    }
    if (input.gaveGift !== null) {
        sets.push("gave_gift = ?");
        params.push(input.gaveGift ? 1 : 0);
    }
    if (input.adminNote !== null) {
        sets.push("admin_note = ?");
        params.push(input.adminNote);
    }

    if (sets.length === 0) return false;

    sets.push("updated_at = NOW()");

    const [result] = await retryDbOperation(() =>
        pool.execute<ResultSetHeader>(
            `UPDATE invitations SET ${sets.join(", ")}
             WHERE url_token = ? AND deleted_at IS NULL`,
            [...params, input.urlToken],
        ),
    );

    return result.affectedRows > 0;
}

export async function adminListInvitations(filters: {
    isAttending?: boolean;
    isFamily?: boolean;
    type?: InvitationType;
}): Promise<InvitationAdminView[]> {
    const where: string[] = ["deleted_at IS NULL"]; // soft delete
    const params: any[] = [];

    if (filters.isAttending !== undefined) {
        where.push("is_attending = ?");
        params.push(filters.isAttending ? 1 : 0);
    }
    if (filters.isFamily !== undefined) {
        where.push("is_family = ?");
        params.push(filters.isFamily ? 1 : 0);
    }
    if (filters.type !== undefined) {
        where.push("type = ?");
        params.push(filters.type);
    }

    const [rows] = await retryDbOperation(() =>
        pool.execute(
            `SELECT url_token, name, display_name, number_of_guests, is_attending, is_family, type, teapai, wishes, responded_at, show_wishes,
                    actual_attendance, gave_gift, admin_note
             FROM invitations
             WHERE ${where.join(" AND ")}
             ORDER BY created_at DESC`,
            params,
        ),
    );

    return (rows as any[]).map(rowToAdmin);
}

export async function searchInvitationsByName(
    query: string,
): Promise<
    Array<{ url_token: string; name: string; display_name: string | null }>
> {
    let rows: any[];
    if (query.trim().length === 0) {
        // Return all guests for the initial "show all" dropdown
        const [result] = await retryDbOperation(() =>
            pool.execute(
                `SELECT url_token, name, display_name
                 FROM teapai
                 WHERE deleted_at IS NULL
                   AND attended_by IS NULL
                 ORDER BY name ASC`,
            ),
        );
        rows = result as any[];
    } else {
        const pattern = `%${query}%`;
        const [result] = await retryDbOperation(() =>
            pool.execute(
                `SELECT url_token, name, display_name
                 FROM teapai
                 WHERE deleted_at IS NULL
                                     AND attended_by IS NULL
                   AND (name LIKE ? OR display_name LIKE ?)
                 ORDER BY name ASC
                 LIMIT 10`,
                [pattern, pattern],
            ),
        );
        rows = result as any[];
    }
    return rows.map((row) => ({
        url_token: String(row.url_token),
        name: String(row.name),
        display_name:
            row.display_name == null ? null : String(row.display_name),
    }));
}

export async function adminSummary(filters: {
    isAttending?: boolean;
    isFamily?: boolean;
    type?: InvitationType;
}): Promise<{
    total_invitations: number;
    responded_count: number;
    attending_count: number;
    not_attending_count: number;
    pending_count: number;
    expected_guests: number;
    actual_attendance_total: number;
    souvenir_count: number;
}> {
    const where: string[] = ["deleted_at IS NULL"]; // soft delete
    const params: any[] = [];

    if (filters.isAttending !== undefined) {
        where.push("is_attending = ?");
        params.push(filters.isAttending ? 1 : 0);
    }
    if (filters.isFamily !== undefined) {
        where.push("is_family = ?");
        params.push(filters.isFamily ? 1 : 0);
    }
    if (filters.type !== undefined) {
        where.push("type = ?");
        params.push(filters.type);
    }

    const [rows] = await retryDbOperation(() =>
        pool.execute(
            `SELECT
                COUNT(*) AS total_invitations,
                SUM(CASE WHEN responded_at IS NOT NULL THEN 1 ELSE 0 END) AS responded_count,
                SUM(CASE WHEN is_attending = 1 THEN 1 ELSE 0 END) AS attending_count,
                SUM(CASE WHEN responded_at IS NOT NULL AND is_attending = 0 THEN 1 ELSE 0 END) AS not_attending_count,
                SUM(CASE WHEN responded_at IS NULL THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN is_attending = 1 THEN number_of_guests ELSE 0 END) AS expected_guests,
                SUM(COALESCE(actual_attendance, 0)) AS actual_attendance_total,
                SUM(CASE WHEN (is_attending = 1 OR gave_gift = 1) THEN 1 ELSE 0 END) AS souvenir_count
             FROM invitations
             WHERE ${where.join(" AND ")}`,
            params,
        ),
    );

    const row = (rows as any[])[0] || {};

    return {
        total_invitations: Number(row.total_invitations ?? 0),
        responded_count: Number(row.responded_count ?? 0),
        attending_count: Number(row.attending_count ?? 0),
        not_attending_count: Number(row.not_attending_count ?? 0),
        pending_count: Number(row.pending_count ?? 0),
        expected_guests: Number(row.expected_guests ?? 0),
        actual_attendance_total: Number(row.actual_attendance_total ?? 0),
        souvenir_count: Number(row.souvenir_count ?? 0),
    };
}

export type WishPublic = {
    display_name: string;
    wishes: string;
    responded_at: string;
};

export async function getPublicWishes(): Promise<WishPublic[]> {
    const [rows] = await retryDbOperation(() =>
        pool.execute(
            `SELECT COALESCE(display_name, name) AS display_name, wishes, responded_at
             FROM invitations
             WHERE show_wishes = 1
               AND wishes IS NOT NULL
               AND wishes != ''
               AND deleted_at IS NULL
             ORDER BY responded_at DESC`,
        ),
    );

    return (rows as any[]).map((row) => ({
        display_name: String(row.display_name),
        wishes: String(row.wishes),
        responded_at: String(row.responded_at),
    }));
}
