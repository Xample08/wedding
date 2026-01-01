import { NextResponse } from "next/server";
import { getAuthCookieName } from "@/utils/session";

export const runtime = "nodejs";

export async function POST() {
    const res = NextResponse.json({ ok: true }, { status: 200 });

    res.cookies.set({
        name: getAuthCookieName(),
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });

    return res;
}
