import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/middlewares/auth";
import {
    superadminCreateInvitation,
    superadminGetInvitations,
} from "@/controllers/superadminController";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        requireSuperAdmin(req);
        const data = await superadminGetInvitations();
        return NextResponse.json({ data }, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        const message = err?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}

export async function POST(req: NextRequest) {
    try {
        requireSuperAdmin(req);
        const body = await req.json();
        const result = await superadminCreateInvitation(body);
        // Do not expose DB id. Token is returned only because it is part of URL generation.
        return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        const message = err?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}
