import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthCookieName, verifySessionToken } from "@/utils/session";
import ScannerPage from "./ScannerPage";

export default async function ScanPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get(getAuthCookieName())?.value;
    const session = token ? verifySessionToken(token) : null;

    // Only admin or super_admin can access
    if (
        !session ||
        (session.role !== "admin" && session.role !== "super_admin")
    ) {
        redirect("/");
    }

    return (
        <Suspense fallback={<div className="min-h-screen w-full bg-white" />}>
            <ScannerPage />
        </Suspense>
    );
}
