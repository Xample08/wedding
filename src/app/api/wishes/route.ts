import { NextResponse } from "next/server";
import { getPublicWishes } from "@/services/invitationsService";

export const runtime = "nodejs";
export const revalidate = 60; // cache for 60 seconds

export async function GET() {
    try {
        const data = await getPublicWishes();
        return NextResponse.json({ data }, { status: 200 });
    } catch (err: any) {
        const message = err?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
