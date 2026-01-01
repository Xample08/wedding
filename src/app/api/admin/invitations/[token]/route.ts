import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/middlewares/auth";
import { adminPatchInvitation } from "@/controllers/adminController";

export const runtime = "nodejs";

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        requireAdmin(req);
        const { token } = await context.params;
        const body = await req.json();
        const result = await adminPatchInvitation(token, body);
        return NextResponse.json(result, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        const message = err?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}
