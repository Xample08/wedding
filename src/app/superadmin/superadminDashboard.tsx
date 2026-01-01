"use client";

import { useEffect, useMemo, useState } from "react";

type InvitationRow = {
    url_token: string;
    invitation_url: string;
    name: string;
    display_name: string | null;
    number_of_guests: number;
    is_family: boolean;
    type: "resepsi" | "holy_matrimony" | "both";
    is_attending: boolean | null;
    responded_at: string | null;
    created_at: string | null;
};

type CreateInput = {
    name: string;
    number_of_guests: number;
    is_family: boolean;
    type: "resepsi" | "holy_matrimony" | "both";
};

export function SuperadminDashboard() {
    const [rows, setRows] = useState<InvitationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createdUrl, setCreatedUrl] = useState<string | null>(null);

    const [form, setForm] = useState<CreateInput>({
        name: "",
        number_of_guests: 1,
        is_family: false,
        type: "resepsi",
    });

    const respondedLabel = useMemo(
        () => (value: boolean | null) => {
            if (value === null) return "Pending";
            return value ? "Yes" : "No";
        },
        []
    );

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/superadmin/invitations", {
                method: "GET",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data?.error || "Failed to load invitations");
                return;
            }
            setRows(Array.isArray(data?.data) ? data.data : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const createInvitation = async () => {
        setCreateError(null);
        setCreatedUrl(null);
        setCreateSubmitting(true);
        try {
            const res = await fetch("/api/superadmin/invitations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    number_of_guests: form.number_of_guests,
                    is_family: form.is_family,
                    type: form.type,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setCreateError(data?.error || "Failed to create invitation");
                return;
            }
            setCreatedUrl(data?.invitation_url || null);
            setForm((f) => ({ ...f, name: "" }));
            await load();
        } finally {
            setCreateSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-white text-zinc-900">
            <div className="mx-auto max-w-6xl px-6 py-10">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-2xl font-semibold">
                        Superadmin Dashboard
                    </h1>
                    <button
                        type="button"
                        onClick={() => {
                            setCreateError(null);
                            setCreatedUrl(null);
                            setCreateOpen((v) => !v);
                        }}
                        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
                    >
                        {createOpen ? "Close" : "Create new invitation"}
                    </button>
                </div>

                {createOpen ? (
                    <div className="mt-6 rounded-3xl bg-zinc-50 p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block">
                                <span className="block text-sm text-zinc-700">
                                    Name
                                </span>
                                <input
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            name: e.target.value,
                                        }))
                                    }
                                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 outline-none"
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm text-zinc-700">
                                    Number of guests
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.number_of_guests}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            number_of_guests: Number(
                                                e.target.value
                                            ),
                                        }))
                                    }
                                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 outline-none"
                                />
                            </label>

                            <label className="block">
                                <span className="block text-sm text-zinc-700">
                                    Type
                                </span>
                                <select
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            type: e.target
                                                .value as CreateInput["type"],
                                        }))
                                    }
                                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 outline-none"
                                >
                                    <option value="resepsi">resepsi</option>
                                    <option value="holy_matrimony">
                                        holy_matrimony
                                    </option>
                                    <option value="both">both</option>
                                </select>
                            </label>

                            <label className="flex items-center gap-2 pt-7">
                                <input
                                    type="checkbox"
                                    checked={form.is_family}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            is_family: e.target.checked,
                                        }))
                                    }
                                />
                                <span className="text-sm text-zinc-700">
                                    Is family
                                </span>
                            </label>
                        </div>

                        {createError ? (
                            <p className="mt-3 text-sm text-red-600">
                                {createError}
                            </p>
                        ) : null}

                        {createdUrl ? (
                            <div className="mt-3 rounded-xl bg-white p-3 text-sm">
                                <div className="text-zinc-600">
                                    Invitation URL
                                </div>
                                <div className="break-all font-mono text-[12px]">
                                    {createdUrl}
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={createInvitation}
                                disabled={!form.name.trim() || createSubmitting}
                                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                            >
                                {createSubmitting ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className="mt-8 overflow-hidden rounded-3xl border border-zinc-200">
                    <div className="flex items-center justify-between bg-zinc-50 px-4 py-3">
                        <div className="text-sm font-medium">Invitations</div>
                        <button
                            type="button"
                            onClick={load}
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm"
                        >
                            Refresh
                        </button>
                    </div>

                    {error ? (
                        <div className="p-4 text-sm text-red-600">{error}</div>
                    ) : null}

                    {loading ? (
                        <div className="p-4 text-sm text-zinc-600">
                            Loading...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-white">
                                    <tr className="border-b border-zinc-200">
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Guests</th>
                                        <th className="px-4 py-3">Family</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">RSVP</th>
                                        <th className="px-4 py-3">Token</th>
                                        <th className="px-4 py-3">URL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr
                                            key={r.url_token}
                                            className="border-b border-zinc-100"
                                        >
                                            <td className="px-4 py-3">
                                                {r.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.number_of_guests}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.is_family ? "Yes" : "No"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.type}
                                            </td>
                                            <td className="px-4 py-3">
                                                {respondedLabel(r.is_attending)}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[12px]">
                                                {r.url_token}
                                            </td>
                                            <td className="px-4 py-3">
                                                <a
                                                    href={r.invitation_url}
                                                    className="break-all text-[12px] underline"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {r.invitation_url}
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {rows.length === 0 ? (
                                <div className="p-4 text-sm text-zinc-600">
                                    No invitations found.
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
