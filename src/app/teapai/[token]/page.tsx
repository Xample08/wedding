"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";

type TeapaiData = {
    name: string;
    display_name: string | null;
    number_of_guests: number;
    type: 'FAMILY' | 'PUBLIC';
    expected_attendance: number | null;
    is_attending: number | null;
    teapai: "pagi" | "malam" | null;
    responded_at: string | null;
};

type Language = 'ID' | 'EN';

const CONTENT = {
    FAMILY: {
        EN: {
            title: "Engagement of \n Obe & Felicia",
            sub_title: "Engagement Invitation",
            welcome_message: "Dear {name}",
            question_message: "Will you attend?",
            field_1: "Name",
            field_2: "No of Guest",
            confirm: "Confirm Response",
            attending_yes: "Yes, I'll be there",
            attending_no: "Cannot attend",
            thank_you: "Thank You!",
            success_msg_yes: "We look forward to seeing you at the ceremony.",
            success_msg_no: "We've received your response. We'll miss you!",
            change_response: "Need to change your response?",
            entry_ticket: "Entry Ticket"
        },
        ID: {
            title: "Engagement of \n Obe & Felicia",
            sub_title: "Undangan Pertunangan",
            welcome_message: "Kepada {name}",
            question_message: "Apakah Anda akan hadir?",
            field_1: "Nama",
            field_2: "Jumlah Tamu",
            confirm: "Konfirmasi Kehadiran",
            attending_yes: "Ya, saya akan hadir",
            attending_no: "Tidak bisa hadir",
            thank_you: "Terima Kasih!",
            success_msg_yes: "Kami menantikan kehadiran Anda di acara tersebut.",
            success_msg_no: "Kami telah menerima respons Anda. Kami akan merindukan Anda!",
            change_response: "Perlu mengubah respons Anda?",
            entry_ticket: "Tiket Masuk"
        }
    },
    PUBLIC: {
        EN: {
            title: "Ucapan Syukur \n Obe & Felicia",
            sub_title: "Invitation",
            welcome_message: "To \n {name}",
            question_message: "Confirm Attendance",
            field_1: "Name",
            field_2: "Number of Guests Attending",
            confirm: "Confirm",
            attending_yes: "I will attend",
            attending_no: "I cannot attend",
            thank_you: "Thank You!",
            success_msg_yes: "Thank you for your confirmation.",
            success_msg_no: "Thank you for letting us know.",
            change_response: "Need to change your response?",
            entry_ticket: "Entry Ticket"
        },
        ID: {
            title: "Ucapan Syukur \n Obe & Felicia",
            sub_title: "Undangan",
            welcome_message: "Kepada \n {name}",
            question_message: "Konfirmasi kehadiran",
            field_1: "Nama",
            field_2: "Jumlah Tamu Hadir",
            confirm: "Konfirmasi",
            attending_yes: "Saya akan hadir",
            attending_no: "Saya tidak hadir",
            thank_you: "Terima Kasih!",
            success_msg_yes: "Terima kasih atas konfirmasi Anda.",
            success_msg_no: "Terima kasih telah memberi tahu kami.",
            change_response: "Perlu mengubah respons Anda?",
            entry_ticket: "Tiket Masuk"
        }
    }
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
    const [lang, setLang] = useState<Language>('ID');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/teapai/${token}`);
            const json = await res.json();
            if (res.ok) {
                setData(json);
                // Set default language based on type
                if (json.is_attending === null) {
                    setLang(json.type === 'FAMILY' ? 'EN' : 'ID');
                }
                if (json.is_attending !== null) {
                    setIsAttending(json.is_attending === 1);
                    setDisplayName(json.display_name || json.name);
                    setExpectedAttendance(json.expected_attendance || 0);
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
                    teapai: null
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

    const type = data.type || 'FAMILY';
    const content = CONTENT[type][lang];

    return (
        <div className="fixed inset-0 w-full h-full bg-slate-900 flex items-center justify-center font-serif overflow-hidden overscroll-none touch-pan-y">
            <main className="relative h-full w-full max-w-[435px] bg-[#fdfaf1] shadow-2xl overflow-hidden font-serif">
                {/* Language Switcher */}
                <div className="absolute top-4 left-4 z-50">
                    <div className="bg-white/40 backdrop-blur-md border border-white/20 p-1 rounded-full flex gap-1 shadow-lg scale-90">
                        <button 
                            onClick={() => setLang('ID')}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
                                lang === 'ID' 
                                    ? "bg-[#b4352a] text-white shadow-md" 
                                    : "text-slate-600 hover:bg-white/20"
                            }`}
                        >
                            ID
                        </button>
                        <button 
                            onClick={() => setLang('EN')}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
                                lang === 'EN' 
                                    ? "bg-[#b4352a] text-white shadow-md" 
                                    : "text-slate-600 hover:bg-white/20"
                            }`}
                        >
                            EN
                        </button>
                    </div>
                </div>
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

                {/* Content Container (Scrollable but clean) */}
                <div className="relative z-10 h-full w-full overflow-y-auto pt-8 pb-12 px-6 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    <AnimatePresence mode="wait">
                        {!submitted ? (
                            <motion.div
                                key="form-container"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-transparent py-8 px-4 overflow-hidden"
                            >
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl font-bold text-[#b4352a] mb-1 whitespace-pre-line leading-tight">{content.title}</h1>
                                    <p className="text-slate-500 italic text-xs tracking-wide mt-5">{content.sub_title}</p>
                                    <div className="mt-4 text-lg font-medium text-slate-800 leading-snug">
                                        {content.welcome_message.replace('{name}', data.name).split('\n').map((line, i, arr) => (
                                            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                                        ))}
                                    </div>
                                </div>

                            {/* Step 1: Attendance Check */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-center text-base font-medium text-slate-700 mb-3">
                                        {content.question_message}
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
                                            {content.attending_yes}
                                        </button>
                                        <button
                                            onClick={() => setIsAttending(false)}
                                            className={`flex-1 py-4 rounded-xl border-2 transition-all font-bold ${
                                                isAttending === false
                                                    ? "bg-slate-700 border-slate-700 text-white shadow-lg shadow-slate-200"
                                                    : "bg-white/20 border-slate-300 text-slate-600 hover:bg-white/30"
                                            }`}
                                        >
                                            {content.attending_no}
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
                                                <label className="block text-sm font-medium text-slate-600 mb-1">{content.field_1}</label>
                                                <input
                                                    type="text"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-red-200 bg-white/10 backdrop-blur-sm focus:ring-2 focus:ring-[#b4352a] outline-none text-black placeholder:text-black/50"
                                                    placeholder={content.field_1}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                                    {content.field_2} (Max: {data.number_of_guests})
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpectedAttendance(Math.max(1, expectedAttendance - 1))}
                                                        className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-[#b4352a] text-[#b4352a] font-bold text-2xl hover:bg-red-50 active:scale-95 transition-all"
                                                    >
                                                        -
                                                    </button>
                                                    <div className="flex-1 bg-white/40 backdrop-blur-sm border border-red-100 rounded-xl py-3 text-center text-xl font-bold text-slate-800">
                                                        {expectedAttendance}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpectedAttendance(Math.min(data.number_of_guests, expectedAttendance + 1))}
                                                        className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-[#b4352a] text-[#b4352a] font-bold text-2xl hover:bg-red-50 active:scale-95 transition-all"
                                                    >
                                                        +
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
                                                {lang === 'ID' ? 'Mengirim...' : 'Sending...'}
                                            </span>
                                        ) : content.confirm}
                                    </button>
                                )}
                             <div className="mt-12 text-center">
                                <p className="text-[10px] text-slate-400 font-sans tracking-widest uppercase opacity-60">
                                    Created by Christopher Octave Sinjaya
                                </p>
                             </div>
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

                             <h2 className="text-2xl font-bold text-slate-800 mb-2">{content.thank_you}</h2>
                            <p className="text-slate-500 mb-8">
                                {isAttending 
                                    ? content.success_msg_yes
                                    : content.success_msg_no}
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
                                        {content.entry_ticket}: {token.substring(0, 8)}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={() => setSubmitted(false)}
                                className="text-[#b4352a] font-medium hover:underline text-sm"
                            >
                                {content.change_response}
                            </button>
                             <div className="mt-12 text-center pb-4">
                                <p className="text-[10px] text-slate-400 font-sans tracking-widest uppercase opacity-60">
                                    Created by Christopher Octave Sinjaya
                                </p>
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
