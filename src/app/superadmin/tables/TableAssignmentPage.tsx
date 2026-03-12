"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminNavbar } from "@/app/components/AdminNavbar";

type Guest = {
    url_token: string;
    name: string;
    display_name: string | null;
    table: string | null;
    is_attending: number | null;
    expected_attendance: number | null;
    teapai: "pagi" | "malam" | null;
};

export default function TableAssignmentPage() {
    const router = useRouter();
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [tableName, setTableName] = useState("");
    const [selectedGuests, setSelectedGuests] = useState<Set<string>>(
        new Set(),
    );
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadGuests();
    }, []);

    const loadGuests = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/teapai");
            const data = (await res.json()).data;
            if (res.ok && Array.isArray(data)) {
                setGuests(data);
            } else {
                setError("Failed to load guests");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    const filteredGuests = useMemo(() => {
        return guests.filter((guest) => {
            const name = (guest.display_name || guest.name).toLowerCase();
            const search = searchTerm.toLowerCase();
            return name.includes(search);
        });
    }, [guests, searchTerm]);

    const handleSelectAll = () => {
        if (selectedGuests.size === filteredGuests.length) {
            setSelectedGuests(new Set());
        } else {
            setSelectedGuests(new Set(filteredGuests.map((g) => g.url_token)));
        }
    };

    const handleSelectGuest = (token: string) => {
        const newSelected = new Set(selectedGuests);
        if (newSelected.has(token)) {
            newSelected.delete(token);
        } else {
            newSelected.add(token);
        }
        setSelectedGuests(newSelected);
    };

    const handleUpdate = async () => {
        if (!tableName.trim()) {
            setError("Please enter a table name");
            return;
        }

        if (selectedGuests.size === 0) {
            setError("Please select at least one guest");
            return;
        }

        setUpdating(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/admin/tables/bulk-assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    table: tableName.trim(),
                    tokens: Array.from(selectedGuests),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(
                    `Successfully assigned ${selectedGuests.size} guest(s) to table ${tableName}`,
                );
                setTableName("");
                setSelectedGuests(new Set());
                await loadGuests();
            } else {
                setError(data.error || "Failed to update tables");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <AdminNavbar />

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push("/superadmin")}
                        className="mb-4 text-slate-600 hover:text-slate-900 flex items-center gap-2 transition"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        Table Assignment
                    </h1>
                    <p className="text-slate-600">
                        Assign guests to tables for seating arrangement
                    </p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
                        {success}
                    </div>
                )}

                {/* Assignment Form */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">
                        Assign Table
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Table Name
                            </label>
                            <input
                                type="text"
                                value={tableName}
                                onChange={(e) => setTableName(e.target.value)}
                                placeholder="e.g., T-01, VIP-A, Family-1"
                                className="text-black w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <p className="text-sm text-slate-600">
                                {selectedGuests.size} guest(s) selected
                            </p>
                            <button
                                onClick={handleUpdate}
                                disabled={
                                    updating ||
                                    !tableName.trim() ||
                                    selectedGuests.size === 0
                                }
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
                            >
                                {updating
                                    ? "Updating..."
                                    : `Assign to ${tableName || "Table"}`}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Guest List */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-6 border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    placeholder="Search guests by name..."
                                    className="text-black w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={handleSelectAll}
                                className="px-4 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition whitespace-nowrap"
                            >
                                {selectedGuests.size === filteredGuests.length
                                    ? "Deselect All"
                                    : "Select All"}
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-4 text-slate-600">
                                    Loading guests...
                                </p>
                            </div>
                        ) : filteredGuests.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                {searchTerm
                                    ? "No guests found matching your search"
                                    : "No guests available"}
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-slate-100 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 w-12">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedGuests.size ===
                                                        filteredGuests.length &&
                                                    filteredGuests.length > 0
                                                }
                                                onChange={handleSelectAll}
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                                            Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                                            Current Table
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                                            Session
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredGuests.map((guest) => (
                                        <tr
                                            key={guest.url_token}
                                            className={`hover:bg-slate-50 transition ${
                                                selectedGuests.has(
                                                    guest.url_token,
                                                )
                                                    ? "bg-blue-50"
                                                    : ""
                                            }`}
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGuests.has(
                                                        guest.url_token,
                                                    )}
                                                    onChange={() =>
                                                        handleSelectGuest(
                                                            guest.url_token,
                                                        )
                                                    }
                                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900">
                                                    {guest.display_name ||
                                                        guest.name}
                                                </div>
                                                {guest.expected_attendance && (
                                                    <div className="text-sm text-slate-500">
                                                        {
                                                            guest.expected_attendance
                                                        }{" "}
                                                        guest(s)
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {guest.table ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                                        {guest.table}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">
                                                        Not assigned
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {guest.is_attending === null ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-600">
                                                        Pending
                                                    </span>
                                                ) : guest.is_attending === 1 ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                                        Attending
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                                                        Declined
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {guest.teapai ? (
                                                    <span className="text-sm text-slate-700 capitalize">
                                                        {guest.teapai}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-sm">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Summary */}
                <div className="mt-6 text-center text-sm text-slate-600">
                    Showing {filteredGuests.length} of {guests.length} guests
                </div>
            </main>
        </div>
    );
}
