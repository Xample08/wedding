"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type TeapaiInvitation = {
    url_token: string;
    name: string;
    number_of_guests: number;
    admin_note: string | null;
    created_at: string;
    is_attending: number | null;
    expected_attendance: number | null;
};

export default function TeapaiAdminPage() {
    const pathname = usePathname();
    const [rows, setRows] = useState<TeapaiInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [maxGuests, setMaxGuests] = useState(1);
    const [adminNote, setAdminNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [createdToken, setCreatedToken] = useState<string | null>(null);

    const fetchInvitations = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/teapai");
            const data = await res.json();
            if (res.ok) {
                setRows(data.data || []);
            } else {
                setError(data.error || "Failed to fetch invitations");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setCreatedToken(null);

        try {
            const res = await fetch("/api/teapai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    number_of_guests: maxGuests,
                    admin_note: adminNote
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setName("");
                setMaxGuests(1);
                setAdminNote("");
                setCreatedToken(data.url_token);
                await fetchInvitations();
            } else {
                setError(data.error || "Failed to create invitation");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 sm:px-12 lg:px-16">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Superadmin Dashboard
                        </h1>
                        <p className="mt-2 text-slate-600">
                            Teapai ceremony master data
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
                    </nav>
                </div>

                {/* Create Form */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-slate-200">
                    <h2 className="text-xl font-semibold mb-4 text-slate-800">Create New Teapai Invitation</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Guest/Family Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder:text-gray-400"
                                placeholder="Christopher Octave"
                                required
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Max Guests Allowed</label>
                            <input
                                type="number"
                                min={1}
                                value={maxGuests}
                                onChange={(e) => setMaxGuests(parseInt(e.target.value))}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black"
                                required
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Admin Note (Internal)</label>
                            <input
                                type="text"
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-black placeholder:text-gray-400"
                                placeholder="Optional notes"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
                            >
                                {submitting ? "Creating..." : "Create Invitation"}
                            </button>
                        </div>
                    </form>

                    {createdToken && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-green-800 font-medium">Invitation created successfully!</p>
                            <div className="flex items-center gap-2 mt-2">
                                <code className="bg-white p-2 rounded border border-green-300 flex-1 break-all text-black">
                                    {window.location.origin}/teapai/{createdToken}
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/teapai/${createdToken}`)}
                                    className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* List Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Max Guests</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Expected</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Token</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-slate-500">Loading invitations...</td>
                                    </tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-slate-500">No invitations found.</td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr key={row.url_token} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{row.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{row.number_of_guests}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                {row.is_attending === 1 ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Attending</span>
                                                ) : row.is_attending === 0 ? (
                                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Declined</span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{row.expected_attendance || "-"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-400">{row.url_token.substring(0, 8)}...</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/teapai/${row.url_token}`)}
                                                    className="hover:underline mr-4"
                                                >
                                                    Copy Link
                                                </button>
                                                <Link href={`/teapai/${row.url_token}`} target="_blank" className="hover:underline">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
