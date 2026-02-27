import { NextRequest, NextResponse } from "next/server";
import { guestGetTeapai, guestUpdateTeapai } from "@/controllers/teapaiController";

export const runtime = "nodejs";

// Guest: Get invitation details
export async function GET(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = await params;
        const data = await guestGetTeapai(token);
        
        // Return only what's necessary for the guest form
        return NextResponse.json({
            name: data.name,
            display_name: data.display_name,
            number_of_guests: data.number_of_guests,
            expected_attendance: data.expected_attendance,
            is_attending: data.is_attending,
            teapai: data.teapai,
            responded_at: data.responded_at
        }, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status });
    }
}

// Guest: Update response
export async function PATCH(
    req: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const { token } = await params;
        const body = await req.json();
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const ua = req.headers.get("user-agent") || "unknown";
        
        const result = await guestUpdateTeapai(token, body, ip, ua);
        return NextResponse.json(result, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status });
    }
}
