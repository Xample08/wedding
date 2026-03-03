"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────

type RsvpSummary = {
    total_invitations: number;
    confirmed_attending: number;
    declined: number;
    no_response: number;
    response_rate_pct: number;
};

type AttendanceSummary = {
    total_expected: number | null;
    total_actual: number | null;
    difference: number | null;
};

type BySideRow = {
    invitation_side: "GROOM" | "BRIDE";
    total_invitations: number;
    total_guests: number;
    confirmed: number;
    actual_attended: number | null;
};

type ByTypeRow = {
    type: "FAMILY" | "PUBLIC";
    total_invitations: number;
    total_guests: number;
    confirmed: number;
    declined: number;
    no_response: number;
};

type GiftSummary = {
    gave_gift: number;
    no_gift: number;
    gift_rate_pct: number;
};

type GiftBySideRow = {
    invitation_side: "GROOM" | "BRIDE";
    gave_gift: number;
    no_gift: number;
};

type CrossTabRow = {
    invitation_side: "GROOM" | "BRIDE";
    type: "FAMILY" | "PUBLIC";
    total: number;
    confirmed: number;
    declined: number;
    pending: number;
};

type PendingRow = {
    name: string;
    display_name: string | null;
    invitation_side: "GROOM" | "BRIDE";
    type: "FAMILY" | "PUBLIC";
    number_of_guests: number;
    created_at: string;
};

type TimelineRow = {
    response_date: string;
    responses: number;
    confirmed: number;
    declined: number;
};

type GuestCountRow = {
    guests_per_invite: number;
    invitations: number;
    confirmed: number;
    confirm_rate_pct: number;
};

type AttendedByRow = {
    attended_by: string;
    count: number;
};

type AdminNoteRow = {
    name: string;
    display_name: string | null;
    invitation_side: "GROOM" | "BRIDE";
    type: "FAMILY" | "PUBLIC";
    admin_note: string;
};

type ReportData = {
    rsvpSummary: RsvpSummary;
    attendanceSummary: AttendanceSummary;
    bySide: BySideRow[];
    byType: ByTypeRow[];
    giftSummary: GiftSummary;
    giftBySide: GiftBySideRow[];
    crossTab: CrossTabRow[];
    pendingList: PendingRow[];
    timeline: TimelineRow[];
    byGuestCount: GuestCountRow[];
    attendedBy: AttendedByRow[];
    adminNotes: AdminNoteRow[];
};

// ─── Sub-components ────────────────────────────────────────────────────────

function SectionCard({
    title,
    subtitle,
    children,
    accent = "slate",
}: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    accent?: "slate" | "blue" | "emerald" | "rose" | "violet" | "amber" | "cyan";
}) {
    const accentMap: Record<string, string> = {
        slate: "from-slate-600 to-slate-800 border-slate-200",
        blue: "from-blue-600 to-blue-800 border-blue-200",
        emerald: "from-emerald-500 to-emerald-700 border-emerald-200",
        rose: "from-rose-500 to-rose-700 border-rose-200",
        violet: "from-violet-500 to-violet-700 border-violet-200",
        amber: "from-amber-500 to-amber-700 border-amber-200",
        cyan: "from-cyan-500 to-cyan-700 border-cyan-200",
    };

    return (
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
            <div className={`bg-gradient-to-r ${accentMap[accent]} px-6 py-4`}>
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function StatCard({
    label,
    value,
    sub,
    color = "slate",
}: {
    label: string;
    value: string | number;
    sub?: string;
    color?: "slate" | "green" | "red" | "yellow" | "blue" | "purple";
}) {
    const colorMap: Record<string, string> = {
        slate: "bg-slate-50 border-slate-200 text-slate-900",
        green: "bg-emerald-50 border-emerald-200 text-emerald-800",
        red: "bg-red-50 border-red-200 text-red-800",
        yellow: "bg-amber-50 border-amber-200 text-amber-800",
        blue: "bg-blue-50 border-blue-200 text-blue-800",
        purple: "bg-violet-50 border-violet-200 text-violet-800",
    };
    return (
        <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
            <div className="text-2xl font-extrabold">{value ?? "—"}</div>
            <div className="text-xs font-semibold mt-1 uppercase tracking-wide opacity-70">{label}</div>
            {sub && <div className="text-xs mt-1 opacity-60">{sub}</div>}
        </div>
    );
}

function CssBar({
    value,
    max,
    color = "#6366f1",
    label,
}: {
    value: number;
    max: number;
    color?: string;
    label?: string;
}) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            {label && <span className="text-xs text-slate-500 w-20 shrink-0 truncate">{label}</span>}
            <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                <div
                    className="h-4 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                />
            </div>
            <span className="text-xs font-semibold text-slate-700 w-10 text-right">{value}</span>
        </div>
    );
}

function Badge({ value, type }: { value: string; type?: "side" | "type" | "status" }) {
    const map: Record<string, string> = {
        GROOM: "bg-blue-100 text-blue-800",
        BRIDE: "bg-pink-100 text-pink-800",
        FAMILY: "bg-violet-100 text-violet-800",
        PUBLIC: "bg-slate-100 text-slate-700",
        Attending: "bg-green-100 text-green-800",
        Declined: "bg-red-100 text-red-800",
        Pending: "bg-amber-100 text-amber-800",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[value] ?? "bg-slate-100 text-slate-700"}`}>
            {value}
        </span>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function TeapaiReportPage() {
    const pathname = usePathname();
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pendingSearch, setPendingSearch] = useState("");
    const [notesSearch, setNotesSearch] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/teapai/reports");
                const json = await res.json();
                if (res.ok) setData(json.data);
                else setError(json.error || "Failed to load reports");
            } catch {
                setError("Network error");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filteredPending = useMemo(
        () =>
            (data?.pendingList ?? []).filter((r) => {
                const t = pendingSearch.toLowerCase();
                return (
                    !t ||
                    r.name.toLowerCase().includes(t) ||
                    (r.display_name ?? "").toLowerCase().includes(t) ||
                    r.invitation_side.toLowerCase().includes(t) ||
                    r.type.toLowerCase().includes(t)
                );
            }),
        [data?.pendingList, pendingSearch]
    );

    const filteredNotes = useMemo(
        () =>
            (data?.adminNotes ?? []).filter((r) => {
                const t = notesSearch.toLowerCase();
                return (
                    !t ||
                    r.name.toLowerCase().includes(t) ||
                    r.admin_note.toLowerCase().includes(t) ||
                    r.invitation_side.toLowerCase().includes(t)
                );
            }),
        [data?.adminNotes, notesSearch]
    );

    // Timeline max
    const timelineMax = useMemo(
        () => Math.max(...(data?.timeline ?? []).map((r) => r.responses), 1),
        [data?.timeline]
    );

    const navLinks = [
        { href: "/superadmin", label: "RSVP Invitations" },
        { href: "/superadmin/teapai", label: "Teapai Master" },
        { href: "/superadmin/report/teapai", label: "Wedding Analytics" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── Header ── */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                Wedding Analytics
                            </h1>
                        </div>
                        <p className="text-slate-500 ml-11 text-sm">Teapai guest analytics &amp; insights</p>
                    </div>

                    <nav className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex-wrap">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                    pathname === link.href
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* ── Loading / Error ── */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-rose-500 animate-spin" />
                        <p className="text-slate-500 text-sm">Loading analytics…</p>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-sm">{error}</div>
                )}

                {data && (
                    <div className="space-y-8">

                        {/* ══════════════════════════════════════════
                            REPORT 1 — Overall RSVP Summary
                        ══════════════════════════════════════════ */}
                        <SectionCard
                            title="1. Overall RSVP Summary"
                            subtitle="High-level snapshot of how many guests confirmed, declined, or haven't responded yet."
                            accent="blue"
                        >
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <StatCard
                                    label="Total Invitations"
                                    value={data.rsvpSummary.total_invitations ?? 0}
                                    color="slate"
                                />
                                <StatCard
                                    label="Confirmed Attending"
                                    value={data.rsvpSummary.confirmed_attending ?? 0}
                                    color="green"
                                />
                                <StatCard
                                    label="Declined"
                                    value={data.rsvpSummary.declined ?? 0}
                                    color="red"
                                />
                                <StatCard
                                    label="No Response"
                                    value={data.rsvpSummary.no_response ?? 0}
                                    color="yellow"
                                />
                                <StatCard
                                    label="Response Rate"
                                    value={`${data.rsvpSummary.response_rate_pct ?? 0}%`}
                                    color="blue"
                                    sub="of total invitations responded"
                                />
                            </div>
                        </SectionCard>

                        {/* ══════════════════════════════════════════
                            REPORT 2 — Expected vs Actual Attendance
                        ══════════════════════════════════════════ */}
                        <SectionCard
                            title="2. Expected vs Actual Attendance"
                            subtitle="Compares planned headcount against who actually showed up."
                            accent="emerald"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StatCard
                                    label="Total Expected"
                                    value={data.attendanceSummary.total_expected ?? "—"}
                                    color="blue"
                                    sub="Based on RSVP responses"
                                />
                                <StatCard
                                    label="Total Actual"
                                    value={data.attendanceSummary.total_actual ?? "—"}
                                    color="green"
                                    sub="Who actually attended"
                                />
                                <StatCard
                                    label="Difference"
                                    value={data.attendanceSummary.difference ?? "—"}
                                    color={
                                        (data.attendanceSummary.difference ?? 0) > 0
                                            ? "yellow"
                                            : (data.attendanceSummary.difference ?? 0) < 0
                                            ? "red"
                                            : "slate"
                                    }
                                    sub="Expected minus actual"
                                />
                            </div>
                        </SectionCard>

                        {/* ══════════════════════════════════════════
                            REPORT 3 — By Invitation Side
                        ══════════════════════════════════════════ */}
                        <SectionCard
                            title="3. Guest Count by Invitation Side"
                            subtitle="Breaks down RSVP and attendance numbers between the Groom's side and Bride's side."
                            accent="violet"
                        >
                            <div className="space-y-6">
                                {data.bySide.map((row) => {
                                    const total = row.total_invitations;
                                    return (
                                        <div key={row.invitation_side} className="space-y-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge value={row.invitation_side} type="side" />
                                                <span className="text-xs text-slate-500">{total} invitations · {row.total_guests} guests allowed</span>
                                            </div>
                                            <CssBar value={row.confirmed} max={total} color="#22c55e" label="Confirmed" />
                                            <CssBar value={total - row.confirmed} max={total} color="#f59e0b" label="Not confirmed" />
                                            {(row.actual_attended ?? 0) > 0 && (
                                                <CssBar value={row.actual_attended!} max={total} color="#6366f1" label="Actual" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </SectionCard>

                        {/* ══════════════════════════════════════════
                            REPORT 4 — Family vs Public Split
                        ══════════════════════════════════════════ */}
                        <SectionCard
                            title="4. Family vs Public Guest Split"
                            subtitle="Compares engagement between FAMILY and PUBLIC invitation categories."
                            accent="rose"
                        >
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            {["Type", "Invitations", "Total Guests", "Confirmed", "Declined", "No Response"].map((h) => (
                                                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.byType.map((row) => (
                                            <tr key={row.type} className="hover:bg-slate-50">
                                                <td className="px-4 py-3"><Badge value={row.type} /></td>
                                                <td className="px-4 py-3 font-medium text-slate-900">{row.total_invitations}</td>
                                                <td className="px-4 py-3 text-slate-600">{row.total_guests}</td>
                                                <td className="px-4 py-3 text-emerald-700 font-semibold">{row.confirmed}</td>
                                                <td className="px-4 py-3 text-red-600 font-semibold">{row.declined}</td>
                                                <td className="px-4 py-3 text-amber-600 font-semibold">{row.no_response}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>

                        {/* ══════════════════════════════════════════
                            REPORT 5 — Gift Tracking Summary
                        ══════════════════════════════════════════ */}
                        <SectionCard
                            title="5. Gift Tracking Summary"
                            subtitle="Of guests who attended, how many brought a gift."
                            accent="amber"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StatCard label="Gave Gift" value={data.giftSummary.gave_gift ?? 0} color="green" />
                                <StatCard label="No Gift" value={data.giftSummary.no_gift ?? 0} color="red" />
                                <StatCard label="Gift Rate" value={`${data.giftSummary.gift_rate_pct ?? 0}%`} color="yellow" sub="of attending guests" />
                            </div>
                        </SectionCard>

                        {/* ══════════════════════════════════════════
                            REPORT 6 — Gift by Side
                        ══════════════════════════════════════════ */}
                        <SectionCard
                            title="6. Gift by Invitation Side"
                            subtitle="Gift-giving breakdown between Groom's side and Bride's side."
                            accent="cyan"
                        >
                            <div className="space-y-6">
                                {data.giftBySide.map((row) => {
                                    const total = (row.gave_gift ?? 0) + (row.no_gift ?? 0);
                                    return (
                                        <div key={row.invitation_side} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge value={row.invitation_side} type="side" />
                                                <span className="text-xs text-slate-500">{total} attendees</span>
                                            </div>
                                            <CssBar value={row.gave_gift ?? 0} max={total} color="#10b981" label="Gave gift" />
                                            <CssBar value={row.no_gift ?? 0} max={total} color="#f87171" label="No gift" />
                                        </div>
                                    );
                                })}
                            </div>
                        </SectionCard>

                        {/* ══════════════════════════════════════════
                            REPORT 7 — Cross-tab
                        ══════════════════════════════════════════ */}
                        <SectionCard
                            title="7. Response Rate by Type & Side"
                            subtitle="Full cross-tabulation of response rates by both side and category."
                            accent="slate"
                        >
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            {["Side", "Type", "Total", "Confirmed", "Declined", "Pending"].map((h) => (
                                                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.crossTab.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-3"><Badge value={row.invitation_side} /></td>
                                                <td className="px-4 py-3"><Badge value={row.type} /></td>
                                                <td className="px-4 py-3 font-semibold text-slate-900">{row.total}</td>
                                                <td className="px-4 py-3 text-emerald-700 font-semibold">{row.confirmed}</td>
                                                <td className="px-4 py-3 text-red-600 font-semibold">{row.declined}</td>
                                                <td className="px-4 py-3 text-amber-600 font-semibold">{row.pending}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>

                        {/* ══════════════════════════════════════════
                            REPORT 8 — Pending / No Response List
                        ══════════════════════════════════════════ */}
                        <SectionCard
                            title="8. Pending / No Response List"
                            subtitle="A list of guests who haven't responded — useful for follow-up."
                            accent="rose"
                        >
                            <div className="mb-4">
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={pendingSearch}
                                        onChange={(e) => setPendingSearch(e.target.value)}
                                        placeholder="Search pending guests…"
                                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none text-black placeholder:text-slate-400"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{filteredPending.length} of {data.pendingList.length} guests</p>
                            </div>
                            <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="sticky top-0 bg-white border-b border-slate-200">
                                        <tr>
                                            {["Name", "Display Name", "Side", "Type", "Max Guests", "Created"].map((h) => (
                                                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredPending.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                                                    {data.pendingList.length === 0 ? "🎉 All guests have responded!" : "No matching guests."}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredPending.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2.5 font-medium text-slate-900">{row.name}</td>
                                                    <td className="px-4 py-2.5 text-slate-500">{row.display_name || "—"}</td>
                                                    <td className="px-4 py-2.5"><Badge value={row.invitation_side} /></td>
                                                    <td className="px-4 py-2.5"><Badge value={row.type} /></td>
                                                    <td className="px-4 py-2.5 text-slate-600">{row.number_of_guests}</td>
                                                    <td className="px-4 py-2.5 text-slate-400 text-xs">{new Date(row.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>

                        {/* ══════════════════════════════════════════
                            REPORT 9 — Daily RSVP Timeline
                        ══════════════════════════════════════════ */}
                        <SectionCard
                            title="9. Daily RSVP Response Timeline"
                            subtitle="Shows which days had the most responses — useful for spotting campaign peaks."
                            accent="cyan"
                        >
                            {data.timeline.length === 0 ? (
                                <p className="text-slate-400 text-sm py-8 text-center">No RSVP responses recorded yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {data.timeline.map((row) => (
                                        <div key={row.response_date} className="flex items-center gap-3">
                                            <span className="text-xs text-slate-500 w-24 shrink-0">
                                                {new Date(row.response_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                            </span>
                                            <div className="flex-1 flex gap-1 h-5">
                                                <div
                                                    className="h-5 rounded bg-emerald-400 transition-all duration-500"
                                                    style={{ width: `${Math.round((row.confirmed / timelineMax) * 100)}%` }}
                                                    title={`${row.confirmed} confirmed`}
                                                />
                                                <div
                                                    className="h-5 rounded bg-red-400 transition-all duration-500"
                                                    style={{ width: `${Math.round((row.declined / timelineMax) * 100)}%` }}
                                                    title={`${row.declined} declined`}
                                                />
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700 w-14 text-right">
                                                {row.responses} total
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
                                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <span className="w-3 h-3 rounded bg-emerald-400 inline-block" /> Confirmed
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <span className="w-3 h-3 rounded bg-red-400 inline-block" /> Declined
                                        </span>
                                    </div>
                                </div>
                            )}
                        </SectionCard>

                        {/* ══════════════════════════════════════════
                            REPORT 10 — Attendance Rate by Guest Count
                        ══════════════════════════════════════════ */}
                        <SectionCard
                            title="10. Attendance Rate by Guests per Invitation"
                            subtitle="Checks whether larger group invitations have a lower or higher confirmation rate."
                            accent="violet"
                        >
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            {["Guests / Invite", "# Invitations", "Confirmed", "Confirm Rate"].map((h) => (
                                                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.byGuestCount.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-4 py-2.5 font-semibold text-slate-900">{row.guests_per_invite} pax</td>
                                                <td className="px-4 py-2.5 text-slate-600">{row.invitations}</td>
                                                <td className="px-4 py-2.5 text-emerald-700 font-semibold">{row.confirmed}</td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                                                            <div className="h-2 rounded-full bg-violet-500" style={{ width: `${row.confirm_rate_pct ?? 0}%` }} />
                                                        </div>
                                                        <span className="text-xs font-semibold text-violet-700">{row.confirm_rate_pct ?? 0}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>

                        {/* ══════════════════════════════════════════
                            REPORT 11 — Attended By Summary
                        ══════════════════════════════════════════ */}
                        <SectionCard
                            title="11. Attended By Summary"
                            subtitle="Lists who accompanied guests, useful for seating and coordination records."
                            accent="amber"
                        >
                            {data.attendedBy.length === 0 ? (
                                <p className="text-slate-400 text-sm py-8 text-center">No companion data recorded yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {data.attendedBy.map((row, i) => (
                                        <CssBar
                                            key={i}
                                            value={row.count}
                                            max={Math.max(...data.attendedBy.map((r) => r.count), 1)}
                                            color="#f59e0b"
                                            label={row.attended_by}
                                        />
                                    ))}
                                </div>
                            )}
                        </SectionCard>

                        {/* ══════════════════════════════════════════
                            REPORT 12 — Admin Notes
                        ══════════════════════════════════════════ */}
                        <SectionCard
                            title="12. Admin Notes / Special Cases"
                            subtitle="Flags guests with special admin notes for the wedding coordinator's attention."
                            accent="rose"
                        >
                            <div className="mb-4">
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={notesSearch}
                                        onChange={(e) => setNotesSearch(e.target.value)}
                                        placeholder="Search notes…"
                                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none text-black placeholder:text-slate-400"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{filteredNotes.length} of {data.adminNotes.length} records</p>
                            </div>
                            <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="sticky top-0 bg-white border-b border-slate-200">
                                        <tr>
                                            {["Name", "Display Name", "Side", "Type", "Admin Note"].map((h) => (
                                                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredNotes.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                                                    {data.adminNotes.length === 0 ? "No admin notes recorded." : "No matching records."}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredNotes.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2.5 font-medium text-slate-900">{row.name}</td>
                                                    <td className="px-4 py-2.5 text-slate-500">{row.display_name || "—"}</td>
                                                    <td className="px-4 py-2.5"><Badge value={row.invitation_side} /></td>
                                                    <td className="px-4 py-2.5"><Badge value={row.type} /></td>
                                                    <td className="px-4 py-2.5 text-slate-700 text-xs italic">{row.admin_note}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>

                    </div>
                )}
            </div>
        </div>
    );
}
