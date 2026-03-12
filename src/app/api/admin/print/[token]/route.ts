import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/middlewares/auth";
import { getTeapaiByToken } from "@/services/teapaiService";
import { sendToPrinter } from "@/utils/printer";

/**
 * POST: Send label to Zebra GT820 printer
 * Prints a label with guest information, token, and barcode
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ token: string }> },
) {
    try {
        requireAdmin(req);
        const { token } = await params;

        // Fetch guest data
        const guestData = await getTeapaiByToken(token);
        if (!guestData) {
            return NextResponse.json(
                { error: "Guest invitation not found" },
                { status: 404 },
            );
        }

        // Send to printer
        await sendToPrinter({
            token: guestData.url_token,
            name: guestData.name,
            displayName: guestData.display_name || guestData.name,
            side: guestData.teapai || "pagi",
            rsvp: guestData.expected_attendance || 0,
            actualAttendance: guestData.actual_attendance || 0,
            tableNumber: guestData.table || "",
        });

        return NextResponse.json({
            success: true,
            message: "Label sent to printer",
        });
    } catch (err: any) {
        console.error("Print error:", err);
        return NextResponse.json(
            { error: err.message || "Print failed" },
            { status: err.status || 500 },
        );
    }
}
