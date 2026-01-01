import "server-only";

export function safeDecodeURIComponent(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export function stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, "");
}

export function sanitizeText(input: string, maxLen: number): string {
    const decoded = safeDecodeURIComponent(input);
    const noHtml = stripHtml(decoded);
    // Remove control chars, normalize whitespace
    const cleaned = noHtml
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return cleaned.slice(0, maxLen);
}
