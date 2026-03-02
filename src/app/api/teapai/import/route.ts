import { NextRequest, NextResponse } from "next/server";
import { adminImportTeapai } from "@/controllers/teapaiController";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as Blob | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        const result = await adminImportTeapai(rows);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Import error:", error);
        return NextResponse.json({ error: error.message || "Failed to import file" }, { status: 500 });
    }
}
