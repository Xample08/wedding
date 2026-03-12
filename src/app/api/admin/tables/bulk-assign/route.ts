import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/middlewares/auth";
import { pool } from "@/db/connection";
import { ResultSetHeader } from "mysql2";

/**
 * POST: Bulk assign table to multiple guests
 */
export async function POST(req: NextRequest) {
    try {
        requireAdmin(req);

        const body = await req.json();
        const { table, tokens } = body;

        if (!table || typeof table !== "string") {
            return NextResponse.json(
                { error: "Table name is required" },
                { status: 400 },
            );
        }

        if (!Array.isArray(tokens) || tokens.length === 0) {
            return NextResponse.json(
                { error: "At least one guest token is required" },
                { status: 400 },
            );
        }

        // Build placeholders for the SQL query
        const placeholders = tokens.map(() => "?").join(",");

        // Update all selected guests with the table assignment
        const [result] = await pool.execute<ResultSetHeader>(
            `UPDATE teapai 
             SET \`table\` = ? 
             WHERE url_token IN (${placeholders}) 
             AND deleted_at IS NULL`,
            [table, ...tokens],
        );

        return NextResponse.json({
            success: true,
            updated: result.affectedRows,
            message: `Successfully assigned ${result.affectedRows} guest(s) to table ${table}`,
        });
    } catch (err: any) {
        console.error("Bulk table assign error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to assign tables" },
            { status: err.status || 500 },
        );
    }
}
