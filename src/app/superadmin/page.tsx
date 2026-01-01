import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthCookieName, verifySessionToken } from "@/utils/session";
import { SuperadminDashboard } from "./superadminDashboard";

export default async function SuperadminPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get(getAuthCookieName())?.value;
    const session = token ? verifySessionToken(token) : null;
    if (!session || session.role !== "super_admin") {
        redirect("/login?next=/superadmin");
    }

    return (
        <Suspense fallback={<div className="min-h-screen w-full bg-white" />}>
            <SuperadminDashboard />
        </Suspense>
    );
}
