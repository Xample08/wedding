import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/middlewares/auth";
import { sendToPrinter } from "@/utils/printer";

/**
 * GET: Test printer endpoint
 * Sends a test label to the Zebra GT820 printer when isPrint=true
 * Usage: GET /api/admin/print/test?isPrint=true
 */
export async function GET(req: NextRequest) {
    try {
        requireAdmin(req);

        const searchParams = req.nextUrl.searchParams;
        const isPrint = searchParams.get("isPrint")?.toLowerCase() === "true";

        // Test data
        const testData = {
            token: "TEST-" + Date.now(),
            name: "Test Guest",
            displayName: "Test Guest",
            actualAttendance: 2,
            gaveGift: true,
        };

        if (isPrint) {
            // Actually send to printer
            console.log("🧪 TEST MODE: Sending test label to printer...");
            await sendToPrinter(testData);

            return NextResponse.json({
                success: true,
                message: "Test label sent to printer",
                data: testData,
                printed: true,
            });
        } else {
            // Just return test data without printing
            return NextResponse.json({
                success: true,
                message:
                    "Test mode - no printing. Add ?isPrint=true to send to printer",
                data: testData,
                printed: false,
            });
        }
    } catch (err: any) {
        console.error("Test print error:", err);
        return NextResponse.json(
            { error: err.message || "Test print failed" },
            { status: err.status || 500 },
        );
    }
}
