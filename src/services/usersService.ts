import "server-only";
import { pool } from "@/db/connection";
import type { AuthRole } from "@/utils/session";
import { retryDbOperation } from "@/utils/dbRetry";

export type ActiveUser = {
    username: string;
    password_hash: string;
    role: AuthRole;
    is_active: boolean;
};

export async function findUserByUsername(
    username: string
): Promise<ActiveUser | null> {
    const [rows] = await retryDbOperation(() =>
        pool.execute(
            `SELECT username, password_hash, role, is_active
             FROM users
             WHERE username = ?
             LIMIT 1`,
            [username]
        )
    );

    const row = (rows as any[])[0];
    if (!row) return null;

    const role = String(row.role) as AuthRole;
    if (role !== "admin" && role !== "super_admin") return null;

    return {
        username: String(row.username),
        password_hash: String(row.password_hash),
        role,
        is_active: Boolean(Number(row.is_active)),
    };
}

export async function updateLastLoginAt(username: string): Promise<void> {
    await retryDbOperation(() =>
        pool.execute(
            `UPDATE users SET last_login_at = NOW() WHERE username = ? LIMIT 1`,
            [username]
        )
    );
}
