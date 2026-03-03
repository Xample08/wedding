import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/middlewares/auth";
import { getTeapaiReports } from "@/services/teapaiService";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        requireSuperAdmin(req);
        const data = await getTeapaiReports();
        return NextResponse.json({ data }, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        return NextResponse.json(
            { error: err?.message || "Internal Server Error" },
            { status }
        );
    }
}
