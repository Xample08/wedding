"use client";

import { useState } from "react";
import { AdminNavbar } from "../../../components/AdminNavbar";

type TestData = {
    token: string;
    name: string;
    displayName: string;
    actualAttendance: number;
    gaveGift: boolean;
};

export default function TestPrinterPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [testData, setTestData] = useState<TestData | null>(null);

    const handleTestPrint = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch("/api/admin/print/test?isPrint=true");
            const data = await res.json();

            if (res.ok) {
                setSuccess(true);
                setTestData(data.data);
                setTimeout(() => setSuccess(false), 5000);
            } else {
                setError(data.error || "Print test failed");
            }
        } catch (err) {
            setError("Network error. Please check printer connection.");
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/print/test?isPrint=false");
            const data = await res.json();

            if (res.ok) {
                setTestData(data.data);
            } else {
                setError(data.error || "Failed to load preview");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                                <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                Test Printer
                            </h1>
                        </div>
                        <p className="mt-2 text-slate-600 ml-[52px]">
                            Test Zebra GT820 USB printer connection and label output
                        </p>
                    </div>

                    <AdminNavbar />
                </div>

                {/* Main Content */}
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Info Card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <svg
                                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-1">
                                    About Test Print
                                </h3>
                                <p className="text-sm text-blue-800">
                                    This will send a test label to your
                                    configured printer. Make sure your printer
                                    is powered on, connected, and properly
                                    configured in your environment settings.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Test Data Preview Card */}
                    {testData && (
                        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                            <div className="bg-slate-900 px-6 py-4">
                                <h2 className="text-lg font-bold text-white">
                                    Test Label Data
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            Token
                                        </label>
                                        <p className="text-lg font-mono font-bold text-slate-900 mt-1">
                                            {testData.token}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            Guest Name
                                        </label>
                                        <p className="text-lg font-semibold text-slate-900 mt-1">
                                            {testData.displayName ||
                                                testData.name}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            Attendance
                                        </label>
                                        <p className="text-lg font-semibold text-slate-900 mt-1">
                                            {testData.actualAttendance} guests
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                            Gift Status
                                        </label>
                                        <p className="text-lg font-semibold text-slate-900 mt-1">
                                            {testData.gaveGift ? (
                                                <span className="text-green-600">
                                                    ✓ Yes
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">
                                                    ✗ No
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-300 rounded-xl p-6 animate-pulse">
                            <div className="flex items-center gap-3">
                                <svg
                                    className="w-6 h-6 text-green-600 flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <div>
                                    <h3 className="font-bold text-green-900">
                                        Print Job Sent Successfully!
                                    </h3>
                                    <p className="text-sm text-green-800 mt-1">
                                        Test label has been sent to the printer.
                                        Check your printer output.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-300 rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <svg
                                    className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <div>
                                    <h3 className="font-bold text-red-900">
                                        Print Failed
                                    </h3>
                                    <p className="text-sm text-red-800 mt-1">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handlePreview}
                            disabled={loading}
                            className="flex-1 px-6 py-4 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg
                                        className="w-5 h-5 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Loading...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
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
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                    Preview Data
                                </span>
                            )}
                        </button>

                        <button
                            onClick={handleTestPrint}
                            disabled={loading}
                            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg
                                        className="w-5 h-5 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Printing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
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
                                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                        />
                                    </svg>
                                    🖨️ Send Test Print
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Configuration Info */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                        <h3 className="font-semibold text-slate-900 mb-3">
                            Printer Configuration
                        </h3>
                        <div className="space-y-2 text-sm text-slate-600">
                            <p>
                                <strong>Model:</strong> Zebra GT820
                            </p>
                            <p>
                                <strong>Connection:</strong> TCP/IP Network
                                (Port 9100)
                            </p>
                            <p>
                                <strong>Config File:</strong> Check{" "}
                                <code className="px-2 py-0.5 bg-slate-200 rounded text-xs font-mono">
                                    .env.local
                                </code>{" "}
                                for PRINTER_IP and PRINTER_PORT
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
