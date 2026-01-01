import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/middlewares/auth";
import { adminGetInvitations } from "@/controllers/adminController";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        requireAdmin(req);
        const url = new URL(req.url);
        const invitations = await adminGetInvitations(url.searchParams);
        return NextResponse.json({ data: invitations }, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        const message = err?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}
