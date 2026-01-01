import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthCookieName, verifySessionToken } from "@/utils/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get(getAuthCookieName())?.value;
    const session = token ? verifySessionToken(token) : null;

    if (session) {
        redirect(session.role === "super_admin" ? "/superadmin" : "/");
    }

    return (
        <Suspense
            fallback={
                <div className="min-h-screen w-full bg-white text-zinc-900" />
            }
        >
            <LoginForm />
        </Suspense>
    );
}
