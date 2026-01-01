import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/middlewares/auth";
import {
    guestGetInvitation,
    guestSubmitRsvp,
} from "@/controllers/guestController";

export const runtime = "nodejs";

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;
        const invitation = await guestGetInvitation(token);
        // Never expose DB id.
        return NextResponse.json(invitation, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        const message = err?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;
        const body = await req.json();

        const submittedIp = getClientIp(req);
        const userAgent = req.headers.get("user-agent") || "";

        const result = await guestSubmitRsvp({
            urlToken: token,
            body,
            submittedIp,
            userAgent,
        });

        return NextResponse.json(result, { status: 200 });
    } catch (err: any) {
        const status = err?.status ?? 500;
        const message = err?.message ?? "Internal Server Error";
        return NextResponse.json({ error: message }, { status });
    }
}
