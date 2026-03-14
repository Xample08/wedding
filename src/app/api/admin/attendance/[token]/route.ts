import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/middlewares/auth";
import { getTeapaiByToken, markAttendance } from "@/services/teapaiService";
import { getAuthCookieName, verifySessionToken } from "@/utils/session";

// GET: Fetch teapai invitation details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> },
) {
    try {
        requireAdmin(req);
        const { token } = await params;
        const data = await getTeapaiByToken(token);
        if (!data) {
            return NextResponse.json(
                { error: "Invitation not found" },
                { status: 404 },
            );
        }
        if (data.attended_by) {
            return NextResponse.json(
                { error: "Invitation already attended" },
                { status: 409 },
            );
        }
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Unauthorized" },
            { status: err.status || 500 },
        );
    }
}

// PATCH: Mark attendance
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> },
) {
    try {
        requireAdmin(req);
        const { token } = await params;

        // Get username from session
        const cookieName = getAuthCookieName();
        const cookie = req.cookies.get(cookieName)?.value;
        if (!cookie) {
            return NextResponse.json(
                { error: "No session found" },
                { status: 401 },
            );
        }
        const session = verifySessionToken(cookie);
        if (!session) {
            return NextResponse.json(
                { error: "Invalid session" },
                { status: 401 },
            );
        }

        const body = await req.json();
        const { attendance, gave_gift } = body;

        if (
            typeof attendance !== "number" ||
            attendance < 0 ||
            typeof gave_gift !== "number" ||
            (gave_gift !== 0 && gave_gift !== 1)
        ) {
            return NextResponse.json(
                { error: "Invalid input" },
                { status: 400 },
            );
        }

        const success = await markAttendance(token, {
            actual_attendance: attendance,
            gave_gift,
            attended_by: session.username,
            attended_at: new Date().toISOString(),
        });

        if (!success) {
            return NextResponse.json(
                { error: "Invitation already attended or not found" },
                { status: 409 },
            );
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Unauthorized" },
            { status: err.status || 500 },
        );
    }
}
