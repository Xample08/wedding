import "server-only";
import { pool } from "@/db/connection";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export interface TeapaiRecord extends RowDataPacket {
    id: number;
    url_token: string;
    name: string;
    display_name: string | null;
    number_of_guests: number;
    type: 'FAMILY' | 'PUBLIC';
    invitation_side: 'GROOM' | 'BRIDE';
    expected_attendance: number | null;
    actual_attendance: number | null;
    attended_by: string | null;
    is_attending: number | null; // 0 or 1
    responded_at: Date | null;
    teapai: "pagi" | "malam" | null;
    gave_gift: number;
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
    type: 'FAMILY' | 'PUBLIC';
    invitation_side: 'GROOM' | 'BRIDE';
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
        ]
    );
}

export async function getTeapaiByToken(token: string): Promise<TeapaiRecord | null> {
    const [rows] = await pool.execute<TeapaiRecord[]>(
        "SELECT * FROM teapai WHERE url_token = ? AND deleted_at IS NULL LIMIT 1",
        [token]
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
    }
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
        ]
    );
    return result.affectedRows > 0;
}

export async function listTeapaiInvitations(): Promise<TeapaiRecord[]> {
    const [rows] = await pool.execute<TeapaiRecord[]>(
        "SELECT * FROM teapai WHERE deleted_at IS NULL ORDER BY created_at DESC"
    );
    return rows;
}
