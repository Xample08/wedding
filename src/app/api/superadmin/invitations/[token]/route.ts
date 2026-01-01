import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/middlewares/auth";
import { superadminSoftDeleteInvitation } from "@/controllers/superadminController";

export const runtime = "nodejs";

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        requireSuperAdmin(req);
        const { token } = await context.params;
        await superadminSoftDeleteInvitation(token);
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        const message = err?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}
