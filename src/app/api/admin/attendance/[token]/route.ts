import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/middlewares/auth";
import { getTeapaiByToken, markAttendance } from "@/services/teapaiService";
import { getAuthCookieName, verifySessionToken } from "@/utils/session";
import { sendToPrinter } from "@/utils/printer";

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
        });

        if (!success) {
            return NextResponse.json(
                { error: "Failed to mark attendance" },
                { status: 500 },
            );
        }

        // Get updated data for printer
        const updatedData = await getTeapaiByToken(token);
        if (updatedData) {
            await sendToPrinter({
                token,
                name: updatedData.name,
                displayName: updatedData.display_name || updatedData.name,
                side: updatedData.teapai || "pagi",
                rsvp: updatedData.expected_attendance || 0,
                actualAttendance: updatedData.actual_attendance || 0,
                tableNumber: updatedData.table || "",
            });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Unauthorized" },
            { status: err.status || 500 },
        );
    }
}
