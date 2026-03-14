import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/middlewares/auth";
import { searchInvitationsByName } from "@/services/invitationsService";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        requireAdmin(req);
        const url = new URL(req.url);
        const q = url.searchParams.get("q")?.trim() ?? "";
        const results = await searchInvitationsByName(q);
        return NextResponse.json({ data: results });
    } catch (err: any) {
        const status = err?.status ?? 500;
        const message = err?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}
