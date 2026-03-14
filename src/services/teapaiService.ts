import "server-only";
import { pool } from "@/db/connection";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export interface TeapaiRecord extends RowDataPacket {
    id: number;
    url_token: string;
    name: string;
    display_name: string | null;
    number_of_guests: number;
    type: "FAMILY" | "PUBLIC";
    invitation_side: "GROOM" | "BRIDE";
    expected_attendance: number | null;
    actual_attendance: number | null;
    attended_by: string | null;
    is_attending: number | null; // 0 or 1
    responded_at: Date | null;
    teapai: "pagi" | "malam" | null;
    gave_gift: number;
    table: string | null;
    admin_note: string | null;
    created_by: string | null;
    submitted_ip: string | null;
    user_agent: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}

export async function createTeapaiInvitation(data: {
    urlToken: string;
    name: string;
    numberOfGuests: number;
    type: "FAMILY" | "PUBLIC";
    invitation_side: "GROOM" | "BRIDE";
    adminNote?: string;
    createdBy?: string;
}): Promise<void> {
    await pool.execute(
        `INSERT INTO teapai (url_token, name, number_of_guests, type, invitation_side, admin_note, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            data.urlToken,
            data.name,
            data.numberOfGuests,
            data.type,
            data.invitation_side,
            data.adminNote || null,
            data.createdBy || "admin",
        ],
    );
}

export async function getTeapaiByToken(
    token: string,
): Promise<TeapaiRecord | null> {
    const [rows] = await pool.execute<TeapaiRecord[]>(
        "SELECT * FROM teapai WHERE url_token = ? AND deleted_at IS NULL LIMIT 1",
        [token],
    );
    return rows[0] || null;
}

export async function updateTeapaiResponse(
    token: string,
    data: {
        display_name: string;
        expected_attendance: number;
        is_attending: number;
        teapai: "pagi" | "malam" | null;
        submitted_ip?: string;
        user_agent?: string;
    },
): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE teapai 
         SET display_name = ?, 
             expected_attendance = ?, 
             is_attending = ?, 
             teapai = ?, 
             responded_at = CURRENT_TIMESTAMP,
             submitted_ip = ?,
             user_agent = ?
         WHERE url_token = ? AND deleted_at IS NULL`,
        [
            data.display_name,
            data.expected_attendance,
            data.is_attending,
            data.teapai,
            data.submitted_ip || null,
            data.user_agent || null,
            token,
        ],
    );
    return result.affectedRows > 0;
}

export async function listTeapaiInvitations(): Promise<TeapaiRecord[]> {
    const [rows] = await pool.execute<TeapaiRecord[]>(
        "SELECT * FROM teapai WHERE deleted_at IS NULL ORDER BY created_at DESC",
    );
    return rows;
}

export async function updateTeapaiInvitation(
    token: string,
    data: {
        name: string;
        numberOfGuests: number;
        type: "FAMILY" | "PUBLIC";
        invitation_side: "GROOM" | "BRIDE";
        adminNote?: string;
    },
): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE teapai 
         SET name = ?, number_of_guests = ?, type = ?, invitation_side = ?, admin_note = ?
         WHERE url_token = ? AND deleted_at IS NULL AND is_attending IS NULL`,
        [
            data.name,
            data.numberOfGuests,
            data.type,
            data.invitation_side,
            data.adminNote || null,
            token,
        ],
    );
    return result.affectedRows > 0;
}

export async function deleteTeapaiInvitation(token: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
        "UPDATE teapai SET deleted_at = CURRENT_TIMESTAMP WHERE url_token = ? AND deleted_at IS NULL",
        [token],
    );
    return result.affectedRows > 0;
}

export async function markAttendance(
    token: string,
    data: {
        actual_attendance: number;
        gave_gift: number;
        attended_by: string;
        attended_at: string;
    },
): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE teapai 
         SET actual_attendance = ?, 
             gave_gift = ?, 
             attended_by = ?
         WHERE url_token = ? AND deleted_at IS NULL AND attended_by IS NULL`,
        [data.actual_attendance, data.gave_gift, data.attended_by, token],
    );
    return result.affectedRows > 0;
}

export async function getTeapaiReports() {
    const q = async (sql: string, params: any[] = []) => {
        const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
        return rows;
    };

    const [
        rsvpSummary,
        attendanceSummary,
        bySide,
        byType,
        giftSummary,
        giftBySide,
        crossTab,
        pendingList,
        timeline,
        byGuestCount,
        attendedBy,
        adminNotes,
    ] = await Promise.all([
        // 1. Overall RSVP Summary
        q(`SELECT
            COUNT(*) AS total_invitations,
            SUM(is_attending = 1) AS confirmed_attending,
            SUM(is_attending = 0) AS declined,
            SUM(is_attending IS NULL) AS no_response,
            ROUND(SUM(is_attending = 1) / COUNT(*) * 100, 1) AS response_rate_pct
           FROM teapai WHERE deleted_at IS NULL`),

        // 2. Expected vs Actual Attendance
        q(`SELECT
            SUM(expected_attendance) AS total_expected,
            SUM(actual_attendance) AS total_actual,
            SUM(expected_attendance) - SUM(actual_attendance) AS difference
           FROM teapai WHERE deleted_at IS NULL AND is_attending = 1`),

        // 3. By Invitation Side
        q(`SELECT
            invitation_side,
            COUNT(*) AS total_invitations,
            SUM(number_of_guests) AS total_guests,
            SUM(is_attending = 1) AS confirmed,
            SUM(actual_attendance) AS actual_attended
           FROM teapai WHERE deleted_at IS NULL
           GROUP BY invitation_side`),

        // 4. Family vs Public
        q(`SELECT
            type,
            COUNT(*) AS total_invitations,
            SUM(number_of_guests) AS total_guests,
            SUM(is_attending = 1) AS confirmed,
            SUM(is_attending = 0) AS declined,
            SUM(is_attending IS NULL) AS no_response
           FROM teapai WHERE deleted_at IS NULL
           GROUP BY type`),

        // 5. Gift Tracking Summary
        q(`SELECT
            SUM(gave_gift = 1) AS gave_gift,
            SUM(gave_gift = 0) AS no_gift,
            ROUND(SUM(gave_gift = 1) / COUNT(*) * 100, 1) AS gift_rate_pct
           FROM teapai WHERE deleted_at IS NULL AND is_attending = 1`),

        // 6. Gift by Side
        q(`SELECT
            invitation_side,
            SUM(gave_gift = 1) AS gave_gift,
            SUM(gave_gift = 0) AS no_gift
           FROM teapai WHERE deleted_at IS NULL AND is_attending = 1
           GROUP BY invitation_side`),

        // 7. Response Rate Cross-tab
        q(`SELECT
            invitation_side,
            type,
            COUNT(*) AS total,
            SUM(is_attending = 1) AS confirmed,
            SUM(is_attending = 0) AS declined,
            SUM(is_attending IS NULL) AS pending
           FROM teapai WHERE deleted_at IS NULL
           GROUP BY invitation_side, type
           ORDER BY invitation_side, type`),

        // 8. Pending / No Response List
        q(`SELECT
            name, display_name, invitation_side, type, number_of_guests, created_at
           FROM teapai
           WHERE deleted_at IS NULL AND is_attending IS NULL
           ORDER BY invitation_side, type, created_at`),

        // 9. Daily RSVP Timeline
        q(`SELECT
            DATE(responded_at) AS response_date,
            COUNT(*) AS responses,
            SUM(is_attending = 1) AS confirmed,
            SUM(is_attending = 0) AS declined
           FROM teapai
           WHERE deleted_at IS NULL AND responded_at IS NOT NULL
           GROUP BY DATE(responded_at)
           ORDER BY response_date`),

        // 10. Attendance Rate by Guest Count
        q(`SELECT
            number_of_guests AS guests_per_invite,
            COUNT(*) AS invitations,
            SUM(is_attending = 1) AS confirmed,
            ROUND(SUM(is_attending = 1) / COUNT(*) * 100, 1) AS confirm_rate_pct
           FROM teapai WHERE deleted_at IS NULL
           GROUP BY number_of_guests
           ORDER BY number_of_guests`),

        // 11. Attended By Summary
        q(`SELECT
            attended_by,
            COUNT(*) AS count
           FROM teapai
           WHERE deleted_at IS NULL AND attended_by IS NOT NULL AND attended_by != ''
           GROUP BY attended_by
           ORDER BY count DESC`),

        // 12. Admin Notes
        q(`SELECT
            name, display_name, invitation_side, type, admin_note
           FROM teapai
           WHERE deleted_at IS NULL AND admin_note IS NOT NULL AND admin_note != ''
           ORDER BY invitation_side`),
    ]);

    return {
        rsvpSummary: rsvpSummary[0] ?? {},
        attendanceSummary: attendanceSummary[0] ?? {},
        bySide,
        byType,
        giftSummary: giftSummary[0] ?? {},
        giftBySide,
        crossTab,
        pendingList,
        timeline,
        byGuestCount,
        attendedBy,
        adminNotes,
    };
}
