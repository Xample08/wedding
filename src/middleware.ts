import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const INVITE_ROUTE_ENABLED = false;

export function middleware(req: NextRequest) {
    if (!INVITE_ROUTE_ENABLED && req.nextUrl.pathname.startsWith("/invite")) {
        return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/invite", "/invite/:path*"],
};
