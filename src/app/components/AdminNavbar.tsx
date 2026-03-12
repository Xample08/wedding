"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
    href: string;
    label: string;
    badge?: string;
};

const navLinks: NavLink[] = [
    { href: "/superadmin", label: "Wedding Invitations" },
    { href: "/superadmin/teapai", label: "Engagement Master" },
    { href: "/superadmin/report/teapai", label: "Engagement Analytics" },
    { href: "/superadmin/scan", label: "QR Scanner" },
    {
        href: "/superadmin/print/test",
        label: "🖨️ Test Printer",
        badge: "Test",
    },
];

type AdminNavbarProps = {
    className?: string;
};

export function AdminNavbar({ className = "" }: AdminNavbarProps) {
    const pathname = usePathname();

    return (
        <nav
            className={`flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex-wrap ${className}`}
        >
            {navLinks.map((link) => {
                const isActive =
                    pathname === link.href ||
                    (link.href.includes("/scan") &&
                        pathname === "/superadmin/scan") ||
                    (link.href.includes("/print/test") &&
                        pathname === "/superadmin/print/test");

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            isActive
                                ? "bg-slate-900 text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                        {link.label}
                        {link.badge && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                                {link.badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
