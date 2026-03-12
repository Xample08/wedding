import "server-only";
import { Label } from "node-zpl";
import { exec } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Zebra GT820 Printer Configuration
 * Configure the USB printer name in your .env.local file
 */
const PRINTER_CONFIG = {
    printerName: process.env.PRINTER_NAME || "ZDesigner GT820",
};

/**
 * Generate ZPL (Zebra Programming Language) using node-zpl Label builder
 *
 * @param data - Guest information to print on label
 * @returns ZPL command string
 */
function generateZPL(data: {
    token: string;
    name: string;
    displayName: string | null;
    actualAttendance: number;
    gaveGift: boolean;
}): string {
    const guestName = data.displayName || data.name;

    // Create label using node-zpl Label builder
    // GT820: 4" x 3" at 8 dpmm (203 DPI / 25.4 = ~8 dpmm)
    const label = new Label(101.6, 76.2, 8);

    label
        .drawText({
            text: "Wedding Guest",
            position: { x: 50, y: 80 },
            font: "0",
            charHeight: 50,
            charWidth: 50,
        })
        .drawText({
            text: guestName,
            position: { x: 50, y: 150 },
            font: "0",
            charHeight: 40,
            charWidth: 40,
        })
        .drawText({
            text: "Token:",
            position: { x: 50, y: 230 },
            font: "0",
            charHeight: 30,
            charWidth: 30,
        })
        .drawText({
            text: data.token,
            position: { x: 50, y: 280 },
            font: "0",
            charHeight: 40,
            charWidth: 40,
        })
        .drawText({
            text: `Attendance: ${data.actualAttendance}`,
            position: { x: 50, y: 360 },
            font: "0",
            charHeight: 25,
            charWidth: 25,
        })
        .drawText({
            text: `Gift: ${data.gaveGift ? "Yes" : "No"}`,
            position: { x: 50, y: 400 },
            font: "0",
            charHeight: 25,
            charWidth: 25,
        })
        .drawCode128({
            data: data.token,
            position: { x: 400, y: 490 },
            charHeight: 120,
            mode: "N",
        })
        .close();

    return label.toZPL();
}

/**
 * Send ZPL to USB printer using Windows printing
 *
 * @param zplCode - ZPL command string
 * @param printerName - Windows printer name
 */
function sendZPLToPrinter(zplCode: string, printerName: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Create temporary file with ZPL content
        const tempFile = join(tmpdir(), `zpl-${Date.now()}.zpl`);

        try {
            writeFileSync(tempFile, zplCode, "utf8");

            // Use PowerShell to send raw ZPL to printer
            const command = `powershell -Command "Get-Content '${tempFile}' -Raw | Out-Printer -Name '${printerName}'"`;

            exec(command, (error, stdout, stderr) => {
                // Clean up temp file
                try {
                    unlinkSync(tempFile);
                } catch (e) {
                    console.warn("Could not delete temp file:", tempFile);
                }

                if (error) {
                    console.error("❌ Print command error:", error.message);
                    console.error("stderr:", stderr);
                    reject(new Error(`Print failed: ${error.message}`));
                } else {
                    console.log("✅ Print job sent successfully");
                    if (stdout) console.log("stdout:", stdout);
                    resolve();
                }
            });
        } catch (err: any) {
            // Clean up temp file on error
            try {
                unlinkSync(tempFile);
            } catch (e) {
                // ignore
            }
            reject(new Error(`File operation failed: ${err.message}`));
        }
    });
}

/**
 * Send print job to Zebra GT820 printer via USB
 *
 * @param data - Guest information for printing
 * @throws Error if printer connection fails
 */
export async function sendToPrinter(data: {
    token: string;
    name: string;
    displayName: string | null;
    actualAttendance: number;
    gaveGift: boolean;
}): Promise<void> {
    const zplCode = generateZPL(data);

    console.log("🖨️  PRINTER: Sending to Zebra GT820 via USB...");
    console.log(`🔌 Printer Name: ${PRINTER_CONFIG.printerName}`);
    console.log("📄 Token:", data.token);
    console.log("👤 Guest:", data.displayName || data.name);

    try {
        await sendZPLToPrinter(zplCode, PRINTER_CONFIG.printerName);
    } catch (err: any) {
        console.error("❌ PRINTER ERROR:", err);
        throw new Error(`USB print failed: ${err.message || err}`);
    }
}
