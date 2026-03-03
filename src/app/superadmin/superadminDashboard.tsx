"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type InvitationRow = {
    url_token: string;
    invitation_url: string;
    name: string;
    display_name: string | null;
    number_of_guests: number;
    expected_attendance: number | null;
    is_family: boolean;
    type: "resepsi" | "holy_matrimony" | "both";
    is_attending: boolean | null;
    wishes: string | null;
    show_wishes: boolean | null;
    responded_at: string | null;
    created_at: string | null;
    gave_gift: boolean | null;
    admin_note: string | null;
};

type CreateInput = {
    name: string;
    number_of_guests: number;
    is_family: boolean;
    type: "resepsi" | "holy_matrimony" | "both";
    admin_note: string;
};

type EditingRow = InvitationRow & { originalNumberOfGuests: number };

type ConfirmDelete = {
    token: string;
    name: string;
};

export function SuperadminDashboard() {
    const pathname = usePathname();
    const [rows, setRows] = useState<InvitationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search and sort
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<keyof InvitationRow>("created_at");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Create form
    const [createOpen, setCreateOpen] = useState(false);
    const [createSubmitting, setCreateSubmitting] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createdUrl, setCreatedUrl] = useState<string | null>(null);
    const [form, setForm] = useState<CreateInput>({
        name: "",
        number_of_guests: 1,
        is_family: false,
        type: "resepsi",
        admin_note: "",
    });

    // Edit form
    const [editingRow, setEditingRow] = useState<EditingRow | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Delete confirmation
    const [confirmDelete, setConfirmDelete] = useState<ConfirmDelete | null>(
        null
    );
    const [deleting, setDeleting] = useState(false);

    // Wishes modal
    const [wishesModal, setWishesModal] = useState<InvitationRow | null>(null);

    const respondedLabel = (value: boolean | null) => {
        if (value === null) return "Pending";
        return value ? "Yes" : "No";
    };

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

    const filteredAndSortedRows = useMemo(() => {
        let filtered = rows;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = rows.filter(
                (r) =>
                    r.name.toLowerCase().includes(term) ||
                    r.display_name?.toLowerCase().includes(term) ||
                    r.url_token.toLowerCase().includes(term)
            );
        }

        const sorted = [...filtered].sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            if (aVal === null) aVal = "";
            if (bVal === null) bVal = "";

            if (typeof aVal === "string" && typeof bVal === "string") {
                return sortOrder === "asc"
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            if (typeof aVal === "number" && typeof bVal === "number") {
                return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
            }

            if (typeof aVal === "boolean" && typeof bVal === "boolean") {
                return sortOrder === "asc"
                    ? Number(aVal) - Number(bVal)
                    : Number(bVal) - Number(aVal);
            }

            return 0;
        });

        return sorted;
    }, [rows, searchTerm, sortBy, sortOrder]);

    const handleSort = (column: keyof InvitationRow) => {
        if (sortBy === column) {
            setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

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
                    admin_note: form.admin_note || null,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setCreateError(data?.error || "Failed to create invitation");
                return;
            }
            setCreatedUrl(data?.invitation_url || null);
            setForm({
                name: "",
                number_of_guests: 1,
                is_family: false,
                type: "resepsi",
                admin_note: "",
            });
            await load();
        } finally {
            setCreateSubmitting(false);
        }
    };

    const startEdit = (row: InvitationRow) => {
        setEditingRow({
            ...row,
            originalNumberOfGuests: row.number_of_guests,
        });
        setEditError(null);
    };

    const saveEdit = async () => {
        if (!editingRow) return;
        setEditError(null);
        setEditSubmitting(true);

        try {
            const res = await fetch(
                `/api/superadmin/invitations/${editingRow.url_token}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: editingRow.name,
                        number_of_guests: editingRow.number_of_guests,
                        is_family: editingRow.is_family,
                        type: editingRow.type,
                        admin_note: editingRow.admin_note,
                    }),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setEditError(data?.error || "Failed to update invitation");
                return;
            }
            setEditingRow(null);
            await load();
        } finally {
            setEditSubmitting(false);
        }
    };

    const toggleShowWishes = async (
        token: string,
        currentValue: boolean | null
    ) => {
        try {
            const res = await fetch(
                `/api/superadmin/invitations/${token}/toggle-wishes`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ show_wishes: !currentValue }),
                }
            );
            if (res.ok) {
                await load();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleGaveGift = async (
        token: string,
        currentValue: boolean | null
    ) => {
        try {
            const res = await fetch(
                `/api/superadmin/invitations/${token}/toggle-gift`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ gave_gift: !currentValue }),
                }
            );
            if (res.ok) {
                await load();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(
                `/api/superadmin/invitations/${confirmDelete.token}`,
                { method: "DELETE" }
            );
            if (res.ok) {
                await load();
                setConfirmDelete(null);
            }
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Superadmin Dashboard
                        </h1>
                        <p className="mt-2 text-slate-600">
                            Manage wedding website administrative data
                        </p>
                    </div>

                    <nav className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
                        <Link
                            href="/superadmin"
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                pathname === "/superadmin"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            RSVP Invitations
                        </Link>
                        <Link
                            href="/superadmin/teapai"
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                pathname === "/superadmin/teapai"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            Teapai Master
                        </Link>
                        <Link
                            href="/superadmin/report/teapai"
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                pathname === "/superadmin/report/teapai"
                                    ? "bg-slate-900 text-white shadow-md"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            Wedding Analytics
                        </Link>
                    </nav>
                </div>

                {/* Create Button */}
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() => {
                            setCreateError(null);
                            setCreatedUrl(null);
                            setCreateOpen((v) => !v);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        {createOpen ? "Close Form" : "Create New Invitation"}
                    </button>
                </div>

                {/* Create Form */}
                {createOpen && (
                    <div className="mb-8 rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
                        <h2 className="text-xl font-semibold text-slate-900 mb-6">
                            New Invitation
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Guest Name *
                                </label>
                                <input
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            name: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-black placeholder:text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    placeholder="Enter guest name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Number of Guests *
                                </label>
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
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Invitation Type *
                                </label>
                                <select
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            type: e.target
                                                .value as CreateInput["type"],
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                >
                                    <option value="resepsi">Resepsi</option>
                                    <option value="holy_matrimony">
                                        Holy Matrimony
                                    </option>
                                    <option value="both">Both</option>
                                </select>
                            </div>

                            <div className="flex items-center pt-7">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.is_family}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                is_family: e.target.checked,
                                            }))
                                        }
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                                    />
                                    <span className="text-sm font-medium text-slate-700">
                                        Family Member
                                    </span>
                                </label>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Admin Note (Optional)
                                </label>
                                <textarea
                                    value={form.admin_note}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            admin_note: e.target.value,
                                        }))
                                    }
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-black placeholder:text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                    placeholder="Add internal notes about this invitation..."
                                />
                            </div>
                        </div>

                        {createError && (
                            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                                {createError}
                            </div>
                        )}

                        {createdUrl && (
                            <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4">
                                <p className="text-sm font-medium text-green-900 mb-2">
                                    Invitation Created Successfully!
                                </p>
                                <div className="break-all font-mono text-xs text-green-700 bg-white rounded px-3 py-2">
                                    {createdUrl}
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={createInvitation}
                                disabled={!form.name.trim() || createSubmitting}
                                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {createSubmitting
                                    ? "Creating..."
                                    : "Create Invitation"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="mb-6 rounded-2xl bg-white p-4 shadow-lg border border-slate-200">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="flex-1 w-full">
                            <div className="relative">
                                <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    placeholder="Search by name, token, or display name..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-black placeholder:text-black focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={load}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Refresh
                        </button>
                    </div>
                    <div className="mt-3 text-sm text-slate-600">
                        Showing {filteredAndSortedRows.length} of {rows.length}{" "}
                        invitations
                    </div>
                </div>

                {/* Table - Continued in next message due to length */}
                <div className="rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
                    {error && (
                        <div className="p-6 text-sm text-red-600 bg-red-50 border-b border-red-200">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
                            <p className="mt-4 text-slate-600">
                                Loading invitations...
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {[
                                            { key: "name", label: "Name" },
                                            {
                                                key: "number_of_guests",
                                                label: "Max Guests",
                                            },
                                            {
                                                key: "expected_attendance",
                                                label: "Expected",
                                            },
                                            {
                                                key: "is_family",
                                                label: "Family",
                                            },
                                            { key: "type", label: "Type" },
                                            {
                                                key: "is_attending",
                                                label: "RSVP",
                                            },
                                            {
                                                key: "responded_at",
                                                label: "Responded",
                                            },
                                        ].map((col) => (
                                            <th
                                                key={col.key}
                                                onClick={() =>
                                                    handleSort(
                                                        col.key as keyof InvitationRow
                                                    )
                                                }
                                                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {col.label}
                                                    {sortBy === col.key && (
                                                        <svg
                                                            className={`w-4 h-4 transform ${
                                                                sortOrder ===
                                                                "desc"
                                                                    ? "rotate-180"
                                                                    : ""
                                                            }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M5 15l7-7 7 7"
                                                            />
                                                        </svg>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {filteredAndSortedRows.map((row) => (
                                        <tr
                                            key={row.url_token}
                                            className="hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="px-4 py-4 text-sm">
                                                <div className="font-medium text-slate-900">
                                                    {row.name}
                                                </div>
                                                {row.display_name && (
                                                    <div className="text-xs text-slate-500">
                                                        {row.display_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-900">
                                                {row.number_of_guests}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-900">
                                                {row.expected_attendance ?? "-"}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        row.is_family
                                                            ? "bg-purple-100 text-purple-800"
                                                            : "bg-slate-100 text-slate-800"
                                                    }`}
                                                >
                                                    {row.is_family
                                                        ? "Yes"
                                                        : "No"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {row.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        row.is_attending ===
                                                        true
                                                            ? "bg-green-100 text-green-800"
                                                            : row.is_attending ===
                                                              false
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                                >
                                                    {respondedLabel(
                                                        row.is_attending
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600">
                                                {row.responded_at
                                                    ? new Date(
                                                          row.responded_at
                                                      ).toLocaleDateString()
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={
                                                            row.invitation_url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                                        title="View invitation"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                            />
                                                        </svg>
                                                    </a>

                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(row.invitation_url);
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                                                        title="Copy invitation URL"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            startEdit(row)
                                                        }
                                                        className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors"
                                                        title="Edit invitation"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            />
                                                        </svg>
                                                    </button>

                                                    {row.wishes && (
                                                        <button
                                                            onClick={() =>
                                                                setWishesModal(
                                                                    row
                                                                )
                                                            }
                                                            className="p-1.5 rounded-lg hover:bg-pink-50 text-pink-600 transition-colors"
                                                            title="View wishes"
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                                />
                                                            </svg>
                                                        </button>
                                                    )}

                                                    {row.wishes && (
                                                        <button
                                                            onClick={() =>
                                                                toggleShowWishes(
                                                                    row.url_token,
                                                                    row.show_wishes
                                                                )
                                                            }
                                                            className={`p-1.5 rounded-lg transition-colors ${
                                                                row.show_wishes
                                                                    ? "bg-green-50 text-green-600 hover:bg-green-100"
                                                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                            }`}
                                                            title={
                                                                row.show_wishes
                                                                    ? "Hide wishes from public"
                                                                    : "Show wishes publicly"
                                                            }
                                                        >
                                                            <svg
                                                                className="w-4 h-4"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                {row.show_wishes ? (
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                    />
                                                                ) : (
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                                                    />
                                                                )}
                                                            </svg>
                                                        </button>
                                                    )}

                                                    {/* Gift Toggle Switch */}
                                                    <label
                                                        className="relative inline-flex items-center cursor-pointer"
                                                        title={
                                                            row.gave_gift
                                                                ? "Guest gave gift"
                                                                : "No gift received"
                                                        }
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={row.gave_gift || false}
                                                            onChange={() =>
                                                                toggleGaveGift(
                                                                    row.url_token,
                                                                    row.gave_gift
                                                                )
                                                            }
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                                    </label>

                                                    <button
                                                        onClick={() =>
                                                            setConfirmDelete({
                                                                token: row.url_token,
                                                                name: row.name,
                                                            })
                                                        }
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                                        title="Delete invitation"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredAndSortedRows.length === 0 && !loading && (
                                <div className="p-12 text-center text-slate-500">
                                    <svg
                                        className="mx-auto h-12 w-12 text-slate-300"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                        />
                                    </svg>
                                    <p className="mt-4">No invitations found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingRow && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="text-2xl font-semibold text-slate-900 mb-6">
                            Edit Invitation
                        </h2>

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Guest Name
                                </label>
                                <input
                                    value={editingRow.name}
                                    onChange={(e) =>
                                        setEditingRow((r) =>
                                            r
                                                ? { ...r, name: e.target.value }
                                                : null
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Number of Guests
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={editingRow.number_of_guests}
                                    onChange={(e) =>
                                        setEditingRow((r) =>
                                            r
                                                ? {
                                                      ...r,
                                                      number_of_guests: Number(
                                                          e.target.value
                                                      ),
                                                  }
                                                : null
                                        )
                                    }
                                    disabled={editingRow.responded_at !== null}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />
                                {editingRow.responded_at && (
                                    <p className="mt-1 text-xs text-amber-600">
                                        Cannot edit guest count after RSVP
                                        response
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Invitation Type
                                </label>
                                <select
                                    value={editingRow.type}
                                    onChange={(e) =>
                                        setEditingRow((r) =>
                                            r
                                                ? {
                                                      ...r,
                                                      type: e.target
                                                          .value as any,
                                                  }
                                                : null
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                >
                                    <option value="resepsi">Resepsi</option>
                                    <option value="holy_matrimony">
                                        Holy Matrimony
                                    </option>
                                    <option value="both">Both</option>
                                </select>
                            </div>

                            <div className="flex items-center pt-7">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingRow.is_family}
                                        onChange={(e) =>
                                            setEditingRow((r) =>
                                                r
                                                    ? {
                                                          ...r,
                                                          is_family:
                                                              e.target.checked,
                                                      }
                                                    : null
                                            )
                                        }
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                                    />
                                    <span className="text-sm font-medium text-slate-700">
                                        Family Member
                                    </span>
                                </label>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Admin Note
                                </label>
                                <textarea
                                    value={editingRow.admin_note || ""}
                                    onChange={(e) =>
                                        setEditingRow((r) =>
                                            r
                                                ? {
                                                      ...r,
                                                      admin_note:
                                                          e.target.value,
                                                  }
                                                : null
                                        )
                                    }
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>

                        {editError && (
                            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                                {editError}
                            </div>
                        )}

                        <div className="mt-6 flex gap-3 justify-end">
                            <button
                                onClick={() => setEditingRow(null)}
                                className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEdit}
                                disabled={editSubmitting}
                                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-all"
                            >
                                {editSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Wishes Modal */}
            {wishesModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-slate-900">
                                Guest Wishes
                            </h2>
                            <button
                                onClick={() => setWishesModal(null)}
                                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-slate-600 mb-1">From:</p>
                            <p className="font-medium text-slate-900">
                                {wishesModal.display_name || wishesModal.name}
                            </p>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                            <p className="text-slate-700 whitespace-pre-wrap">
                                {wishesModal.wishes}
                            </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-600">
                                    Public visibility:
                                </span>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        wishesModal.show_wishes
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {wishesModal.show_wishes
                                        ? "Visible"
                                        : "Hidden"}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    toggleShowWishes(
                                        wishesModal.url_token,
                                        wishesModal.show_wishes
                                    );
                                    setWishesModal(null);
                                }}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-all"
                            >
                                Toggle Visibility
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Delete Invitation
                                </h2>
                                <p className="text-sm text-slate-600 mt-1">
                                    This action cannot be undone
                                </p>
                            </div>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 mb-6">
                            <p className="text-sm text-slate-700">
                                Are you sure you want to delete the invitation
                                for{" "}
                                <span className="font-semibold text-slate-900">
                                    {confirmDelete.name}
                                </span>
                                ?
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                disabled={deleting}
                                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-all"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
