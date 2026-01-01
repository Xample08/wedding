import "server-only";
import crypto from "node:crypto";

export type AuthRole = "super_admin" | "admin";

type SessionPayload = {
    username: string;
    role: AuthRole;
    iat: number;
    exp: number;
};

function base64UrlEncode(input: Buffer | string): string {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
    return buf
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Buffer {
    const pad = input.length % 4;
    const padded = input + (pad ? "=".repeat(4 - pad) : "");
    const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(b64, "base64");
}

function getSecret(): string {
    const secret = process.env.AUTH_COOKIE_SECRET;
    if (!secret) throw new Error("AUTH_COOKIE_SECRET is not configured");
    return secret;
}

export function getAuthCookieName(): string {
    return (process.env.AUTH_COOKIE_NAME || "wedding_auth").trim();
}

function sign(data: string): string {
    const h = crypto.createHmac("sha256", getSecret());
    h.update(data);
    return base64UrlEncode(h.digest());
}

export function createSessionToken(params: {
    username: string;
    role: AuthRole;
    ttlSeconds?: number;
}): string {
    const now = Math.floor(Date.now() / 1000);
    const ttl = params.ttlSeconds ?? 60 * 60 * 24; // 24h

    const payload: SessionPayload = {
        username: params.username,
        role: params.role,
        iat: now,
        exp: now + ttl,
    };

    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const sig = sign(payloadB64);
    return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, sig] = parts;
    if (!payloadB64 || !sig) return null;

    const expected = sign(payloadB64);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    let payload: SessionPayload;
    try {
        payload = JSON.parse(base64UrlDecode(payloadB64).toString("utf8"));
    } catch {
        return null;
    }

    if (
        !payload?.username ||
        !payload?.role ||
        !payload?.iat ||
        !payload?.exp
    ) {
        return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    if (payload.role !== "admin" && payload.role !== "super_admin") {
        return null;
    }

    return payload;
}
