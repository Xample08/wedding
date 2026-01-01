import { NextRequest, NextResponse } from "next/server";
import { loginWithPassword } from "@/controllers/authController";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { cookieName, token, role } = await loginWithPassword(body);

        const res = NextResponse.json({ ok: true, role }, { status: 200 });

        res.cookies.set({
            name: cookieName,
            value: token,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        return res;
    } catch (err: any) {
        const status = err?.status ?? 500;
        const message = err?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}
