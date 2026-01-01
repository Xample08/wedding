import "server-only";
import bcrypt from "bcryptjs";
import { sanitizeText } from "@/utils/sanitize";
import { isRecord } from "@/utils/validation";
import { createSessionToken, getAuthCookieName } from "@/utils/session";
import { findUserByUsername, updateLastLoginAt } from "@/services/usersService";

export async function loginWithPassword(body: unknown): Promise<{
    cookieName: string;
    token: string;
    role: "super_admin" | "admin";
}> {
    if (!isRecord(body)) {
        throw Object.assign(new Error("Invalid JSON body"), { status: 400 });
    }

    const usernameRaw = body.username;
    const passwordRaw = body.password;

    if (typeof usernameRaw !== "string" || typeof passwordRaw !== "string") {
        throw Object.assign(new Error("username and password are required"), {
            status: 400,
        });
    }

    const username = sanitizeText(usernameRaw, 50);
    const password = String(passwordRaw);

    if (!username || password.length < 1) {
        throw Object.assign(new Error("username and password are required"), {
            status: 400,
        });
    }

    const user = await findUserByUsername(username);
    if (!user || !user.is_active) {
        throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
        throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    }

    await updateLastLoginAt(user.username);

    const token = createSessionToken({
        username: user.username,
        role: user.role,
        ttlSeconds: 60 * 60 * 24, // 24h
    });

    return {
        cookieName: getAuthCookieName(),
        token,
        role: user.role,
    };
}
