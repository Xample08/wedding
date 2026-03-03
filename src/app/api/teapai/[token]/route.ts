import { NextRequest, NextResponse } from "next/server";
import {
    guestGetTeapai,
    guestUpdateTeapai,
    adminUpdateTeapai,
    adminDeleteTeapai,
} from "@/controllers/teapaiController";
import { requireSuperAdmin } from "@/middlewares/auth";

export const runtime = "nodejs";

// Guest: Get invitation details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> },
) {
    try {
        const { token } = await params;
        const data = await guestGetTeapai(token);

        // Return only what's necessary for the guest form
        return NextResponse.json(
            {
                name: data.name,
                display_name: data.display_name,
                number_of_guests: data.number_of_guests,
                expected_attendance: data.expected_attendance,
                is_attending: data.is_attending,
                teapai: data.teapai,
                responded_at: data.responded_at,
                type: data.type,
            },
            { status: 200 },
        );
    } catch (err: any) {
        const status = err?.status ?? 500;
        return NextResponse.json(
            { error: err?.message || "Internal Server Error" },
            { status },
        );
    }
}

// Guest: Update response
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> },
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
        return NextResponse.json(
            { error: err?.message || "Internal Server Error" },
            { status },
        );
    }
}

// Admin: Update invitation (only if not responded)
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> },
) {
    try {
        requireSuperAdmin(req);
        const { token } = await params;
        const body = await req.json();
        const result = await adminUpdateTeapai(token, body);
        return NextResponse.json(result, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        return NextResponse.json(
            { error: err?.message || "Internal Server Error" },
            { status },
        );
    }
}

// Admin: Delete invitation
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> },
) {
    try {
        requireSuperAdmin(req);
        const { token } = await params;
        const result = await adminDeleteTeapai(token);
        return NextResponse.json(result, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        return NextResponse.json(
            { error: err?.message || "Internal Server Error" },
            { status },
        );
    }
}
