"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type TeapaiData = {
    name: string;
    display_name: string | null;
    number_of_guests: number;
    type: "FAMILY" | "PUBLIC";
    expected_attendance: number | null;
    is_attending: number | null;
    teapai: "pagi" | "malam" | null;
};

export default function ScannerPage() {
    const router = useRouter();
    const [scanning, setScanning] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [data, setData] = useState<TeapaiData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attendance, setAttendance] = useState(1);
    const [gaveGift, setGaveGift] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Manual token input for testing
    const [manualToken, setManualToken] = useState("");

    useEffect(() => {
        if (scanning) {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [scanning]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                startScanning();
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            setError(
                "Camera access denied. Please allow camera access or use manual input.",
            );
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
        }
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
        }
    };

    const startScanning = () => {
        scanIntervalRef.current = setInterval(() => {
            scanQRCode();
        }, 500);
    };

    const scanQRCode = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
        );

        // Use jsQR library for QR code detection
        // @ts-ignore
        if (typeof window.jsQR !== "undefined") {
            // @ts-ignore
            const code = window.jsQR(
                imageData.data,
                imageData.width,
                imageData.height,
            );

            if (code && code.data) {
                handleScannedToken(code.data);
            }
        }
    };

    const handleScannedToken = async (scannedToken: string) => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
        }
        setScanning(false);
        stopCamera();
        await fetchInvitationData(scannedToken);
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualToken.trim()) return;
        setScanning(false);
        stopCamera();
        await fetchInvitationData(manualToken.trim());
    };

    const fetchInvitationData = async (scannedToken: string) => {
        setToken(scannedToken);
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/attendance/${scannedToken}`);
            const json = await res.json();
            if (res.ok) {
                setData(json);
                setAttendance(json.expected_attendance || 1);
            } else {
                setError(json.error || "Invitation not found");
            }
        } catch (err) {
            setError("Failed to load invitation");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAttendance = async () => {
        if (!token) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/attendance/${token}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attendance,
                    gave_gift: gaveGift ? 1 : 0,
                }),
            });
            if (res.ok) {
                // Sent print request
                await fetch(`/api/admin/print/${token}`, {
                    method: "POST",
                });
                // Success - reset and go back to scanning
                alert("Attendance marked successfully!");
                resetScanner();
            } else {
                const json = await res.json();
                setError(json.error || "Failed to mark attendance");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    const resetScanner = () => {
        setToken(null);
        setData(null);
        setAttendance(1);
        setGaveGift(false);
        setError(null);
        setManualToken("");
        setScanning(true);
    };

    // Toggle switch size calculations
    const toggleSize = 30; // Base size in pixels
    const toggleHeight = toggleSize;
    const toggleWidth = toggleSize * 2;
    const toggleCircle = toggleSize * 0.7;
    const togglePadding = toggleSize * 0.15;
    const toggleTranslateOn = toggleWidth - toggleCircle - togglePadding;
    const toggleTranslateOff = togglePadding;

    return (
        <div className="fixed inset-0 w-full h-full bg-[#fbf6e8] flex items-center justify-center font-serif overflow-hidden overscroll-none touch-pan-y">
            <main className="relative h-full w-full bg-[#fbf6e8] overflow-hidden font-serif">
                {/* Back Button - Floating */}
                <button
                    onClick={() => router.push("/superadmin")}
                    className="absolute top-4 left-4 z-[60] bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg transition font-sans text-sm font-semibold"
                >
                    ← Back
                </button>

                {/* Content Container */}
                <div className="relative z-10 h-full w-full flex flex-col items-center justify-center px-6">
                    {/* Header */}
                    {/* <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#b4352a] mb-2 drop-shadow-sm">
                            QR Scanner
                        </h1>
                        <p className="text-slate-600 text-sm">
                            Scan guest invitation QR code
                        </p>
                    </div> */}

                    {/* Scanner or Form */}
                    <div className="space-y-6">
                        {scanning && (
                            <div className="space-y-6">
                                {/* Camera View - Full Screen with Centered Square */}
                                <div className="fixed inset-0 bg-[#fbf6e8] z-40 flex items-center justify-center">
                                    <div
                                        className="relative bg-black overflow-hidden rounded-2xl"
                                        style={{
                                            width: "min(40vw, 40vh)",
                                            height: "min(40vw, 40vh)",
                                            border: "6px solid #b4352a",
                                        }}
                                    >
                                        <video
                                            ref={videoRef}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            playsInline
                                            muted
                                            autoPlay
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            className="hidden"
                                        />
                                        <div className="absolute bottom-4 left-0 right-0 text-center">
                                            <p className="text-white text-sm font-semibold bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
                                                Position QR code within frame
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Manual Input - Overlay */}
                                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4">
                                    <p className="text-xs text-slate-600 mb-2 text-center">
                                        Or enter token manually
                                    </p>
                                    <form
                                        onSubmit={handleManualSubmit}
                                        className="flex gap-2"
                                    >
                                        <input
                                            type="text"
                                            value={manualToken}
                                            onChange={(e) =>
                                                setManualToken(e.target.value)
                                            }
                                            placeholder="Token"
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b4352a] focus:border-transparent bg-white text-center font-mono text-sm text-black"
                                        />
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-[#b4352a] text-white rounded-lg hover:bg-[#8d2a21] transition font-semibold text-sm"
                                        >
                                            Go
                                        </button>
                                    </form>
                                </div>

                                {error && (
                                    <div className="fixed top-20 left-4 right-4 z-50 bg-red-100/90 backdrop-blur-sm border-2 border-red-300 text-red-800 px-4 py-3 rounded-xl shadow-lg text-center font-semibold">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        {loading && (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="w-16 h-16 border-4 border-[#b4352a] border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-600 font-semibold">
                                    Loading invitation...
                                </p>
                            </div>
                        )}

                        {!scanning && !loading && data && (
                            <div className="space-y-6">
                                {/* Guest Welcome */}
                                <div className="text-center py-4">
                                    <h2 className="text-3xl font-bold text-[#6d4c41]">
                                        Welcome,{" "}
                                        {data.display_name || data.name}
                                    </h2>
                                </div>

                                {error && (
                                    <div className="bg-red-100/90 backdrop-blur-sm border-2 border-red-300 text-red-800 px-4 py-3 rounded-xl shadow-lg text-center font-semibold">
                                        {error}
                                    </div>
                                )}

                                {/* Attendance Form */}
                                <div className="p-6 space-y-6">
                                    <div>
                                        <label className="block text-xl font-bold text-[#6d4c41] mb-2 text-center">
                                            Attendance
                                        </label>
                                        <div className="flex items-center justify-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAttendance(
                                                        Math.max(
                                                            0,
                                                            attendance - 1,
                                                        ),
                                                    )
                                                }
                                                className="w-12 h-12 flex items-center justify-center bg-white border-2 border-[#6d4c41] text-[#6d4c41] rounded-lg hover:bg-[#6d4c41] hover:text-white transition text-2xl font-bold"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                max={data?.number_of_guests}
                                                value={attendance}
                                                onChange={(e) =>
                                                    setAttendance(
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 0,
                                                    )
                                                }
                                                readOnly
                                                className="text-black w-32 px-4 py-4 border-2 border-[#6d4c41] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b4352a] focus:border-transparent text-3xl font-bold text-center bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAttendance(
                                                        Math.min(
                                                            data?.number_of_guests ||
                                                                attendance + 1,
                                                            attendance + 1,
                                                        ),
                                                    )
                                                }
                                                className="w-12 h-12 flex items-center justify-center bg-white border-2 border-[#6d4c41] text-[#6d4c41] rounded-lg hover:bg-[#6d4c41] hover:text-white transition text-2xl font-bold"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xl font-bold text-[#6d4c41] mb-1 text-center">
                                            Gift
                                        </label>
                                        <div className="flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setGaveGift(!gaveGift)
                                                }
                                                className="relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#b4352a] focus:ring-offset-2"
                                                style={{
                                                    height: `${toggleHeight}px`,
                                                    width: `${toggleWidth}px`,
                                                    backgroundColor: gaveGift
                                                        ? "#b4352a"
                                                        : "#d1d5db",
                                                }}
                                            >
                                                <span
                                                    className="inline-block rounded-full bg-white shadow-lg transition-transform"
                                                    style={{
                                                        height: `${toggleCircle}px`,
                                                        width: `${toggleCircle}px`,
                                                        transform: `translateX(${gaveGift ? toggleTranslateOn : toggleTranslateOff}px)`,
                                                    }}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-center pt-2">
                                    <button
                                        onClick={handleSubmitAttendance}
                                        disabled={submitting}
                                        className="w-[20vw] py-4 px-6 bg-[#b4352a] hover:bg-[#8d2a21] text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting
                                            ? "Processing..."
                                            : "Submit"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Load jsQR library */}
                <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
            </main>
        </div>
    );
}
