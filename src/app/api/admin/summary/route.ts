import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/middlewares/auth";
import { adminGetSummary } from "@/controllers/adminController";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        requireAdmin(req);
        const url = new URL(req.url);
        const summary = await adminGetSummary(url.searchParams);
        return NextResponse.json({ data: summary }, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        const message = err?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}
