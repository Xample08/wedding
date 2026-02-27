"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";

type TeapaiData = {
    name: string;
    display_name: string | null;
    number_of_guests: number;
    expected_attendance: number | null;
    is_attending: number | null;
    teapai: "pagi" | "malam" | null;
    responded_at: string | null;
};

export default function TeapaiGuestPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [data, setData] = useState<TeapaiData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

    // ... (rest of the state remains the same)
    const [isAttending, setIsAttending] = useState<boolean | null>(null);
    const [displayName, setDisplayName] = useState("");
    const [expectedAttendance, setExpectedAttendance] = useState(1);
    const [session, setSession] = useState<"pagi" | "malam">("pagi");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/teapai/${token}`);
            const json = await res.json();
            if (res.ok) {
                setData(json);
                if (json.is_attending !== null) {
                    setIsAttending(json.is_attending === 1);
                    setDisplayName(json.display_name || json.name);
                    setExpectedAttendance(json.expected_attendance || 0);
                    setSession(json.teapai || "pagi");
                    if (json.responded_at) {
                        setSubmitted(true);
                        const url = await QRCode.toDataURL(token, { width: 300, margin: 2 });
                        setQrCodeUrl(url);
                    }
                } else {
                    setDisplayName(json.name);
                }
            } else {
                setError(json.error || "Invitation not found");
            }
        } catch (err) {
            setError("Failed to load invitation");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/teapai/${token}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    display_name: displayName,
                    expected_attendance: isAttending ? expectedAttendance : 0,
                    is_attending: isAttending ? 1 : 0,
                    teapai: session
                }),
            });
            if (res.ok) {
                setSubmitted(true);
                const url = await QRCode.toDataURL(token, { width: 300, margin: 2 });
                setQrCodeUrl(url);
                await fetchData();
            } else {
                const json = await res.json();
                alert(json.error || "Submission failed");
            }
        } catch (err) {
            alert("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfaf1]">
            <div className="w-12 h-12 border-4 border-[#b4352a] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error || !data) return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfaf1] p-6 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Oops!</h1>
                <p className="text-slate-600 mb-6">{error || "Invitation not found. Please check your link."}</p>
                <div className="w-16 h-1 bg-red-100 mx-auto rounded-full"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center font-serif overflow-hidden">
            {/* Mobile-centric Frame */}
            <main className="relative h-[100dvh] w-full max-w-[435px] bg-[#fdfaf1] shadow-2xl overflow-hidden font-serif">
                {/* Background Images with smooth transition */}
                <div className="absolute inset-0 z-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={submitted ? 'tree' : 'plain'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={submitted ? "/teapai/background_tree.jpeg" : "/teapai/background_plain.jpeg"}
                                alt="Teapai Background"
                                fill
                                className="object-cover"
                                priority
                            />
                            {/* Subtle overlay for better readability */}
                            <div className="absolute inset-0 bg-white/10"></div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Content Container (Scrollable) */}
                <div className="relative z-10 h-full w-full overflow-y-auto no-scrollbar pt-12 pb-20 px-6">
                    <AnimatePresence mode="wait">
                        {!submitted ? (
                            <motion.div
                                key="form-container"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-transparent py-8 px-4 overflow-hidden"
                            >
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-bold text-[#b4352a] mb-2">Tea Ceremony</h1>
                                    <p className="text-slate-500 italic">Teapai Invitation</p>
                                    <div className="mt-4 text-xl font-medium text-slate-800">
                                        Dear {data.name},
                                    </div>
                                </div>

                            {/* Step 1: Attendance Check */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-center text-lg font-medium text-slate-700 mb-4">
                                        Will you attend the Tea Ceremony?
                                    </label>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setIsAttending(true)}
                                            className={`flex-1 py-4 rounded-xl border-2 transition-all font-bold ${
                                                isAttending === true
                                                    ? "bg-[#b4352a] border-[#b4352a] text-white shadow-lg shadow-red-200"
                                                    : "bg-white border-red-100 text-[#b4352a] hover:bg-red-50"
                                            }`}
                                        >
                                            Yes, I'll be there
                                        </button>
                                        <button
                                            onClick={() => setIsAttending(false)}
                                            className={`flex-1 py-4 rounded-xl border-2 transition-all font-bold ${
                                                isAttending === false
                                                    ? "bg-slate-700 border-slate-700 text-white shadow-lg shadow-slate-200"
                                                    : "bg-white/20 border-slate-300 text-slate-600 hover:bg-white/30"
                                            }`}
                                        >
                                            Cannot attend
                                        </button>
                                    </div>
                                </div>

                                {/* Step 2: Expanded Form */}
                                <AnimatePresence>
                                    {isAttending === true && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="space-y-4 overflow-hidden pt-4 px-1 border-t border-red-50"
                                        >
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-1">Display Name</label>
                                                <input
                                                    type="text"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white/10 backdrop-blur-sm focus:ring-2 focus:ring-[#b4352a] outline-none text-black placeholder:text-black/50"
                                                    placeholder="Who is attending?"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                                    Expected Attendance (Max: {data.number_of_guests})
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={data.number_of_guests}
                                                    value={expectedAttendance}
                                                    onChange={(e) => setExpectedAttendance(Math.min(data.number_of_guests, parseInt(e.target.value) || 1))}
                                                    className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white/10 backdrop-blur-sm focus:ring-2 focus:ring-[#b4352a] outline-none text-black"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-2 px-1">Preferred Session</label>
                                                <div className="flex gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSession("pagi")}
                                                        className={`flex-1 py-3 px-4 rounded-xl border transition-all text-sm font-semibold flex items-center justify-center gap-2 ${
                                                            session === "pagi"
                                                                ? "bg-[#b4352a] border-[#b4352a] text-white shadow-md shadow-red-100"
                                                                : "bg-white/10 border-red-200 text-[#b4352a] backdrop-blur-sm hover:bg-white/20"
                                                        }`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728L5.122 5.122" />
                                                        </svg>
                                                        Morning
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSession("malam")}
                                                        className={`flex-1 py-3 px-4 rounded-xl border transition-all text-sm font-semibold flex items-center justify-center gap-2 ${
                                                            session === "malam"
                                                                ? "bg-[#b4352a] border-[#b4352a] text-white shadow-md shadow-red-100"
                                                                : "bg-white/10 border-red-200 text-[#b4352a] backdrop-blur-sm hover:bg-white/20"
                                                        }`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                                        </svg>
                                                        Evening
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Submit Button */}
                                {(isAttending !== null) && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || (isAttending && !displayName.trim())}
                                        className="w-full py-4 mt-4 bg-gradient-to-r from-[#b4352a] to-[#8a2a22] text-white rounded-xl font-bold shadow-xl shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                                    >
                                        {submitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                Sending...
                                            </span>
                                        ) : "Confirm Response"}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success-container"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-transparent p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h2>
                            <p className="text-slate-500 mb-8">
                                {isAttending 
                                    ? "We look forward to seeing you at the ceremony."
                                    : "We've received your response. We'll miss you!"}
                            </p>

                            {isAttending && qrCodeUrl && (
                                <div className="bg-white/10 p-6 rounded-2xl mb-8">
                                    <div className="flex justify-center mb-4">
                                        <Image 
                                            src={qrCodeUrl}
                                            alt="QR Code"
                                            width={200}
                                            height={200}
                                            className="mx-auto"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">
                                        Entry Ticket: {token.substring(0, 8)}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={() => setSubmitted(false)}
                                className="text-[#b4352a] font-medium hover:underline text-sm"
                            >
                                Need to change your response?
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
