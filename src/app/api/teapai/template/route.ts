import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
    const headers = ["Name", "Max Guests", "Type", "Side", "Note"];
    const data = [
        ["Example Guest", 2, "FAMILY", "GROOM", "Optional note"],
        ["Another Guest", 1, "PUBLIC", "BRIDE", ""]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teapai Invitations");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
        headers: {
            "Content-Disposition": 'attachment; filename="teapai_template.xlsx"',
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    });
}
