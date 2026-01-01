import "server-only";

export type InvitationType = "resepsi" | "holy_matrimony" | "both";
export type Teapai = "pagi" | "malam";

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseBoolean(value: unknown): boolean | null {
    if (typeof value === "boolean") return value;
    if (typeof value !== "string") return null;
    const v = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(v)) return true;
    if (["false", "0", "no", "n"].includes(v)) return false;
    return null;
}

export function parseInteger(value: unknown): number | null {
    if (typeof value === "number" && Number.isInteger(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
        const n = Number(value);
        if (Number.isInteger(n)) return n;
    }
    return null;
}

export function parseInvitationType(value: unknown): InvitationType | null {
    if (typeof value !== "string") return null;
    const v = value.trim();
    if (v === "resepsi" || v === "holy_matrimony" || v === "both") return v;
    return null;
}

export function parseTeapai(value: unknown): Teapai | null {
    if (typeof value !== "string") return null;
    const v = value.trim();
    if (v === "pagi" || v === "malam") return v;
    return null;
}

export function assertTokenFormat(token: string): void {
    if (!/^[a-f0-9]{32}$/i.test(token)) {
        throw new Error("Invalid token format");
    }
}
