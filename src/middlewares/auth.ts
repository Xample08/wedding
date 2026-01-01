import "server-only";
import { NextRequest } from "next/server";
import { getAuthCookieName, verifySessionToken } from "@/utils/session";

function extractApiKey(req: NextRequest): string | null {
    const auth = req.headers.get("authorization");
    if (auth) {
        const match = auth.match(/^Bearer\s+(.+)$/i);
        if (match?.[1]) return match[1].trim();
    }
    const key = req.headers.get("x-api-key");
    return key?.trim() || null;
}

function hasRoleFromSession(
    req: NextRequest,
    role: "admin" | "super_admin"
): boolean {
    const cookieName = getAuthCookieName();
    const cookie = req.cookies.get(cookieName)?.value;
    if (!cookie) return false;

    const session = verifySessionToken(cookie);
    if (!session) return false;

    if (role === "admin") {
        return session.role === "admin" || session.role === "super_admin";
    }
    return session.role === "super_admin";
}

export function requireSuperAdmin(req: NextRequest): void {
    const expected = process.env.SUPERADMIN_API_KEY;
    const got = extractApiKey(req);

    if (expected && got && got === expected) return;
    if (hasRoleFromSession(req, "super_admin")) return;

    throw Object.assign(new Error("Unauthorized"), { status: 401 });
}

export function requireAdmin(req: NextRequest): void {
    const expected = process.env.ADMIN_API_KEY;
    const got = extractApiKey(req);

    if (expected && got && got === expected) return;
    if (hasRoleFromSession(req, "admin")) return;

    throw Object.assign(new Error("Unauthorized"), { status: 401 });
}

export function getClientIp(req: NextRequest): string {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) {
        const first = xff.split(",")[0]?.trim();
        if (first) return first;
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();
    return "";
}
