import "server-only";
import crypto from "node:crypto";

export function generateUrlToken(): string {
    // 16 bytes -> 32 hex characters
    return crypto.randomBytes(16).toString("hex");
}

export function buildInvitationUrl(urlToken: string): string {
    const base = (process.env.INVITE_BASE_URL || "").trim();
    if (!base) {
        // Fall back to just returning the token if base URL isn't configured.
        return urlToken;
    }

    const prefix = (process.env.INVITE_PATH_PREFIX || "/invite").trim();
    const normalizedBase = base.replace(/\/$/, "");
    const normalizedPrefix = prefix.startsWith("/") ? prefix : `/${prefix}`;

    return `${normalizedBase}${normalizedPrefix}/${urlToken}`;
}

export function buildTeapaiUrl(urlToken: string): string {
    const base = (process.env.INVITE_BASE_URL || "").trim();
    if (!base) {
        return `/teapai/${urlToken}`;
    }

    const normalizedBase = base.replace(/\/$/, "");
    return `${normalizedBase}/teapai/${urlToken}`;
}
