import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/middlewares/auth";
import { adminCreateTeapai, adminListTeapai } from "@/controllers/teapaiController";

export const runtime = "nodejs";

// Admin: Get all teapai invitations
export async function GET(req: NextRequest) {
    try {
        requireSuperAdmin(req);
        const data = await adminListTeapai();
        return NextResponse.json({ data }, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status });
    }
}

// Admin: Create new teapai invitation
export async function POST(req: NextRequest) {
    try {
        requireSuperAdmin(req);
        const body = await req.json();
        const result = await adminCreateTeapai(body);
        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status });
    }
}
