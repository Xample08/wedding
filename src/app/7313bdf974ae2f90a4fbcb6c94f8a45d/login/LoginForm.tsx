"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextPath = useMemo(
        () => searchParams.get("next") || "/",
        [searchParams]
    );

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data?.error || "Login failed");
                return;
            }

            if (data?.role === "super_admin") {
                router.replace("/superadmin");
            } else {
                router.replace(nextPath);
            }
            router.refresh();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white text-zinc-900">
            <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
                <form
                    onSubmit={onSubmit}
                    className="w-full space-y-4 rounded-3xl bg-zinc-50 p-6"
                >
                    <h1 className="text-xl font-semibold">Login</h1>

                    <label className="block">
                        <span className="block text-sm text-zinc-700">
                            Username
                        </span>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 outline-none"
                        />
                    </label>

                    <label className="block">
                        <span className="block text-sm text-zinc-700">
                            Password
                        </span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 outline-none"
                        />
                    </label>

                    {error ? (
                        <p className="text-sm text-red-600">{error}</p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
