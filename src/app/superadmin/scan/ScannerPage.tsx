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
    invitation_side: "GROOM" | "BRIDE";
    id: number;
};

type PageState = "welcome" | "scanner" | "form" | "already-registered";

export default function ScannerPage() {
    const router = useRouter();
    const [pageState, setPageState] = useState<PageState>("welcome");
    const [isUnlockingWelcome, setIsUnlockingWelcome] = useState(false);
    const [welcomeAnimationDone, setWelcomeAnimationDone] = useState(false);
    const [isDraggingWelcome, setIsDraggingWelcome] = useState(false);
    const [welcomeDragOffsetY, setWelcomeDragOffsetY] = useState(0);
    const [welcomeDragStartY, setWelcomeDragStartY] = useState<number | null>(
        null,
    );
    const [scanning, setScanning] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [data, setData] = useState<TeapaiData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attendance, setAttendance] = useState(1);
    const [gaveGift, setGaveGift] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [preferredFacingMode, setPreferredFacingMode] = useState<
        "user" | "environment" | null
    >(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Name search
    const [nameQuery, setNameQuery] = useState("");
    const [allGuests, setAllGuests] = useState<
        { url_token: string; name: string; display_name: string | null }[]
    >([]);
    const [searchResults, setSearchResults] = useState<
        { url_token: string; name: string; display_name: string | null }[]
    >([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const allGuestsFetchedRef = useRef(false);
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (pageState === "scanner" && scanning) {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [pageState, scanning, preferredFacingMode]);

    const triggerWelcomeTransition = () => {
        if (isUnlockingWelcome) return;
        setIsUnlockingWelcome(true);
        setPageState("scanner");
        setScanning(true);
        setIsDraggingWelcome(false);
        setWelcomeDragStartY(null);
        setWelcomeDragOffsetY(0);
        setTimeout(() => {
            setIsUnlockingWelcome(false);
            setWelcomeAnimationDone(true);
        }, 1300);
    };

    const handleWelcomePointerDown = (
        e: React.PointerEvent<HTMLDivElement>,
    ) => {
        if (pageState !== "welcome" || isUnlockingWelcome) return;
        setIsDraggingWelcome(true);
        setWelcomeDragStartY(e.clientY);
        setWelcomeDragOffsetY(0);
        (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
    };

    const handleWelcomePointerMove = (
        e: React.PointerEvent<HTMLDivElement>,
    ) => {
        if (!isDraggingWelcome || welcomeDragStartY === null) return;
        const delta = e.clientY - welcomeDragStartY;
        setWelcomeDragOffsetY(Math.min(0, delta));
    };

    const handleWelcomePointerEnd = () => {
        if (!isDraggingWelcome) return;
        const passedThreshold = welcomeDragOffsetY <= -90;
        setIsDraggingWelcome(false);
        setWelcomeDragStartY(null);
        if (passedThreshold) {
            triggerWelcomeTransition();
            return;
        }
        setWelcomeDragOffsetY(0);
    };

    const startCamera = async () => {
        try {
            const isMobileDevice =
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                    navigator.userAgent,
                );
            const facingMode =
                preferredFacingMode ??
                (isMobileDevice ? "user" : "environment");

            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { exact: facingMode },
                    },
                });
            } catch {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode },
                    });
                } catch {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                    });
                }
            }

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
            videoRef.current.srcObject = null;
        }
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
    };

    const handleSwitchCamera = () => {
        const isMobileDevice =
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent,
            );
        setPreferredFacingMode((prev) => {
            const current = prev ?? (isMobileDevice ? "user" : "environment");
            return current === "user" ? "environment" : "user";
        });
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

    const fetchAllGuests = async () => {
        if (allGuestsFetchedRef.current) return;
        allGuestsFetchedRef.current = true;
        try {
            const res = await fetch(`/api/admin/invitations/search?q=`);
            const json = await res.json();
            if (res.ok) setAllGuests(json.data ?? []);
        } catch {
            // silent
        }
    };

    const handleInputFocus = async () => {
        await fetchAllGuests();
        setShowDropdown(true);
    };

    const handleNameQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setNameQuery(val);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (val.trim().length < 1) {
            setSearchResults([]);
            setShowDropdown(true); // keep open to show allGuests
            return;
        }
        setSearchLoading(true);
        searchDebounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/admin/invitations/search?q=${encodeURIComponent(val.trim())}`,
                );
                const json = await res.json();
                setSearchResults(res.ok ? json.data : []);
                setShowDropdown(true);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300);
    };

    const handleSelectGuest = async (selectedToken: string) => {
        setShowDropdown(false);
        setNameQuery("");
        setSearchResults([]);
        setScanning(false);
        stopCamera();
        await fetchInvitationData(selectedToken);
    };

    const fetchInvitationData = async (scannedToken: string) => {
        setToken(scannedToken);
        setLoading(true);
        setError(null);
        setIsUnlockingWelcome(false);
        setWelcomeAnimationDone(true);
        try {
            const res = await fetch(`/api/admin/attendance/${scannedToken}`);
            const json = await res.json();
            if (res.ok) {
                setData(json);
                setAttendance(json.expected_attendance || 1);
                setPageState("form");
            } else if (
                res.status === 409 ||
                (typeof json?.error === "string" &&
                    json.error.toLowerCase().includes("already attended"))
            ) {
                setData(null);
                setPageState("already-registered");
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
                if (gaveGift) {
                    await fetch(`/api/admin/print/${token}`, {
                        method: "POST",
                    });
                }
                // Success - reset and go back to scanning
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

    useEffect(() => {
        console.log(data);
    }, [data]);

    const resetScanner = () => {
        setToken(null);
        setData(null);
        setAttendance(1);
        setGaveGift(false);
        setError(null);
        setNameQuery("");
        setSearchResults([]);
        setShowDropdown(false);
        setPageState("welcome");
        setScanning(false);
    };

    const backToScanner = () => {
        setToken(null);
        setData(null);
        setError(null);
        setPageState("scanner");
        setScanning(true);
    };

    // Form sizing variables
    const formSizes = {
        input: {
            width: "300px", // Width of the attendance input
            height: "70px", // Height of the attendance input
            fontSize: "2.5rem", // Font size for the number
            buttonSize: "40px", // Size of +/- buttons
        },
        toggle: {
            width: "60px", // Width of envelope toggle
            height: "30px", // Height of envelope toggle
            iconSize: "20px", // Size of envelope icon circle
            fontSize: "0.875rem", // Font size for YES/NO text
        },
    };

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center font-serif overflow-hidden overscroll-none touch-pan-y">
            <style jsx global>{`
                @import url("https://fonts.googleapis.com/css2?family=Gochi+Hand&display=swap");

                @font-face {
                    font-family: "Palr45w";
                    src: url("/teapai/fonts/palr45w.ttf") format("truetype");
                    font-weight: 400;
                    font-style: normal;
                }

                .canva-sans {
                    font-family: "Gochi Hand", "Arial", sans-serif;
                }

                .palr45w {
                    font-family: "Palr45w", "Palatino", "Book Antiqua", serif;
                }

                .palatino {
                    font-family: "Palatino", "Book Antiqua", serif;
                }

                @keyframes welcome-arrow-bounce {
                    0%,
                    100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(12px);
                    }
                }

                .welcome-arrow-bounce {
                    animation: welcome-arrow-bounce 1.2s ease-in-out infinite;
                }
            `}</style>

            <main className="relative h-full w-full overflow-hidden font-serif transition-all duration-1000">
                {/* Welcome Page */}
                <div
                    className="absolute inset-0 w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={handleWelcomePointerDown}
                    onPointerMove={handleWelcomePointerMove}
                    onPointerUp={handleWelcomePointerEnd}
                    onPointerCancel={handleWelcomePointerEnd}
                    onPointerLeave={handleWelcomePointerEnd}
                    style={{
                        backgroundImage:
                            "url('/teapai/background_welcome.PNG')",
                        // "url('/teapai/front.jpg')",
                        backgroundSize: "100% 100%",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        opacity: welcomeAnimationDone
                            ? pageState === "welcome"
                                ? 1
                                : 0
                            : 1,
                        transform: welcomeAnimationDone
                            ? "translateY(0)"
                            : isUnlockingWelcome || pageState === "scanner"
                              ? "translateY(-100%)"
                              : "translateY(0)",
                        pointerEvents:
                            pageState === "welcome" && !isUnlockingWelcome
                                ? "auto"
                                : "none",
                        zIndex: 10,
                        transition: welcomeAnimationDone
                            ? "opacity 600ms ease"
                            : "transform 1200ms ease-in-out",
                    }}
                >
                    <div className="relative h-full w-full pointer-events-none animate-fade-in">
                        <div className="h-full w-full flex flex-col items-center justify-start text-center px-6 py-50 md:pb-28">
                            <h2 className="palr45w text-[#111] font-bold md:mt-18 md:text-[33px]">
                                THE ENGAGEMENT OF
                            </h2>
                            <h1 className="palr45w text-[#c00707] font-bold md:mt-2 md:text-[80px]">
                                OBE & FELI
                            </h1>
                            <p className="palr45w text-[#111] font-bold md:mt-5 md:text-[35px]">
                                15 MARCH 2026
                            </p>
                            <p className="palr45w text-[#111] font-bold md:mt-23 md:text-[35px]">
                                Moi Village Restaurant
                            </p>
                        </div>

                        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 welcome-arrow-bounce text-[#c00707]">
                            <svg
                                width="56"
                                height="56"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M6 8L12 13L18 8"
                                    stroke="currentColor"
                                    strokeWidth="2.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M6 13L12 18L18 13"
                                    stroke="currentColor"
                                    strokeWidth="2.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* QR Scanner Background */}
                <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                        backgroundImage: "url('/teapai/background_qr.PNG')",
                        backgroundSize: "100% 100%",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        pointerEvents:
                            pageState === "scanner" ? "auto" : "none",
                        zIndex: 10,
                        opacity: welcomeAnimationDone
                            ? pageState === "scanner"
                                ? 1
                                : 0
                            : 1,
                        transform: welcomeAnimationDone
                            ? "translateY(0)"
                            : isUnlockingWelcome || pageState === "scanner"
                              ? "translateY(0)"
                              : "translateY(100%)",
                        transition: welcomeAnimationDone
                            ? "opacity 600ms ease"
                            : "transform 1200ms ease-in-out",
                    }}
                />

                {/* Form Background */}
                <div
                    className="absolute inset-0 w-full h-full transition-opacity duration-1000"
                    style={{
                        backgroundImage: "url('/teapai/background_qr.PNG')",
                        backgroundSize: "100% 100%",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        opacity:
                            pageState === "form" ||
                            pageState === "already-registered"
                                ? 1
                                : 0,
                        pointerEvents:
                            pageState === "form" ||
                            pageState === "already-registered"
                                ? "auto"
                                : "none",
                        zIndex:
                            pageState === "form" ||
                            pageState === "already-registered"
                                ? 20
                                : 10,
                    }}
                />

                {/* Back Button - Always visible */}
                {/* <button
                    onClick={() => router.push("/superadmin")}
                    className="absolute top-4 left-4 z-[60] bg-white/80 backdrop-blur-sm hover:bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg transition font-sans text-sm font-semibold"
                >
                    ← Back
                </button> */}

                {/* Content Container - Only show when not on welcome page */}
                <div
                    className="relative z-30 h-full w-full flex flex-col items-center justify-center px-6 transition-opacity duration-1000"
                    style={{
                        opacity:
                            pageState !== "welcome" && !isUnlockingWelcome
                                ? 1
                                : 0,
                        pointerEvents:
                            pageState !== "welcome" && !isUnlockingWelcome
                                ? "auto"
                                : "none",
                    }}
                >
                    {/* Scanner or Form */}
                    <div className="space-y-6">
                        {pageState === "scanner" && scanning && (
                            <div className="space-y-6 transition-opacity duration-500">
                                {/* Camera View - Full Screen with Centered Square */}
                                <div className="fixed inset-0 z-40 flex items-center justify-center">
                                    <div
                                        className="relative bg-black overflow-hidden rounded-2xl shadow-2xl"
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
                                        <button
                                            type="button"
                                            onClick={handleSwitchCamera}
                                            className="absolute top-2 right-2 z-20 px-2 py-1 rounded-md bg-black/50 text-white text-[10px] font-semibold backdrop-blur-sm hover:bg-black/65 transition"
                                        >
                                            Switch
                                        </button>
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

                                {/* Name Search - Overlay */}
                                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
                                    <div className="relative">
                                        {/* Dropdown opens upward */}
                                        {(() => {
                                            const listToShow =
                                                nameQuery.trim().length === 0
                                                    ? allGuests
                                                    : searchResults;
                                            return (
                                                showDropdown &&
                                                listToShow.length > 0 && (
                                                    <div className="absolute bottom-full mb-2 left-0 right-0 bg-white/95 backdrop-blur-sm border-2 border-[#b4352a] rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                                                        {listToShow.map(
                                                            (result) => (
                                                                <button
                                                                    key={
                                                                        result.url_token
                                                                    }
                                                                    type="button"
                                                                    onMouseDown={() =>
                                                                        handleSelectGuest(
                                                                            result.url_token,
                                                                        )
                                                                    }
                                                                    className="w-full text-left px-4 py-3 hover:bg-[#b4352a] hover:text-white text-[#6d4c41] transition-colors border-b border-[#b4352a]/20 last:border-b-0"
                                                                >
                                                                    <span className="palr45w font-semibold text-sm block leading-tight">
                                                                        {result.display_name ||
                                                                            result.name}
                                                                    </span>
                                                                    {result.display_name &&
                                                                        result.display_name !==
                                                                            result.name && (
                                                                            <span className="text-xs opacity-50 font-sans">
                                                                                {
                                                                                    result.name
                                                                                }
                                                                            </span>
                                                                        )}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                )
                                            );
                                        })()}
                                        {showDropdown &&
                                            searchResults.length === 0 &&
                                            nameQuery.trim().length > 0 &&
                                            !searchLoading && (
                                                <div className="absolute bottom-full mb-2 left-0 right-0 bg-white/95 backdrop-blur-sm border-2 border-[#b4352a] rounded-xl shadow-2xl px-4 py-3 text-center text-[#6d4c41] text-sm palr45w">
                                                    No result
                                                </div>
                                            )}

                                        {/* Input */}
                                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border-2 border-[#b4352a] rounded-xl px-3 py-2 shadow-lg">
                                            {searchLoading ? (
                                                <div className="w-4 h-4 border-2 border-[#b4352a] border-t-transparent rounded-full animate-spin shrink-0" />
                                            ) : (
                                                <svg
                                                    className="w-4 h-4 text-[#b4352a] shrink-0"
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
                                            )}
                                            <input
                                                type="text"
                                                value={nameQuery}
                                                onChange={handleNameQueryChange}
                                                onFocus={handleInputFocus}
                                                onBlur={() =>
                                                    setTimeout(
                                                        () =>
                                                            setShowDropdown(
                                                                false,
                                                            ),
                                                        150,
                                                    )
                                                }
                                                placeholder="Search guest name..."
                                                className="flex-1 bg-transparent focus:outline-none text-[#333] placeholder-[#aaa] palr45w text-sm"
                                            />
                                            {nameQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setNameQuery("");
                                                        setSearchResults([]);
                                                        setShowDropdown(false);
                                                    }}
                                                    className="text-[#aaa] hover:text-[#b4352a] transition shrink-0 text-lg leading-none"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="fixed top-20 left-4 right-4 z-50 bg-red-100/90 backdrop-blur-sm border-2 border-red-300 text-red-800 px-4 py-3 rounded-xl shadow-lg text-center font-semibold">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        {loading && (
                            <div className="flex flex-col items-center justify-center py-16 transition-opacity duration-500">
                                <div className="w-16 h-16 border-4 border-[#b4352a] border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-600 font-semibold">
                                    Loading invitation...
                                </p>
                            </div>
                        )}

                        {pageState === "form" && !loading && data && (
                            <div className="space-y-6 transition-opacity duration-1000">
                                {/* Guest Welcome */}
                                <div className="text-center py-4">
                                    <h2 className="text-3xl font-bold text-[#6d4c41]">
                                        Welcome,
                                    </h2>
                                    <h2 className="text-6xl mt-5 font-bold text-[#6d4c41]">
                                        {data.display_name || data.name}
                                    </h2>
                                    <h2 className="text-3xl mt-8 font-bold text-[#6d4c41]">
                                        {data.invitation_side}
                                    </h2>
                                </div>

                                {error && (
                                    <div className="bg-red-100/90 backdrop-blur-sm border-2 border-red-300 text-red-800 px-4 py-3 rounded-xl shadow-lg text-center font-semibold">
                                        {error}
                                    </div>
                                )}

                                {/* Attendance Form */}
                                <div className="p-6 space-y-8">
                                    <div>
                                        <label className="block text-2xl font-bold text-[#6d4c41] mb-4 text-center">
                                            {data.invitation_side
                                                .charAt(0)
                                                .toUpperCase()}
                                            {data.type.charAt(0).toUpperCase()}
                                            {data.id
                                                .toFixed(0)
                                                .padStart(2, "0")}
                                        </label>
                                        <div
                                            className="relative mx-auto"
                                            style={{
                                                width: formSizes.input.width,
                                            }}
                                        >
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
                                                className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center bg-transparent text-[#6d4c41] hover:bg-[#6d4c41] hover:text-white rounded-lg transition font-bold z-10"
                                                style={{
                                                    width: formSizes.input
                                                        .buttonSize,
                                                    height: formSizes.input
                                                        .buttonSize,
                                                    fontSize:
                                                        formSizes.input
                                                            .fontSize,
                                                }}
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                value={attendance}
                                                onChange={(e) =>
                                                    setAttendance(
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 0,
                                                    )
                                                }
                                                readOnly
                                                className="text-black w-full border-2 border-[#6d4c41] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#b4352a] focus:border-transparent font-bold text-center bg-white"
                                                style={{
                                                    height: formSizes.input
                                                        .height,
                                                    fontSize:
                                                        formSizes.input
                                                            .fontSize,
                                                    paddingLeft: `calc(${formSizes.input.buttonSize} + 12px)`,
                                                    paddingRight: `calc(${formSizes.input.buttonSize} + 12px)`,
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAttendance(
                                                        attendance + 1,
                                                    )
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center bg-transparent text-[#6d4c41] hover:bg-[#6d4c41] hover:text-white rounded-lg transition font-bold z-10"
                                                style={{
                                                    width: formSizes.input
                                                        .buttonSize,
                                                    height: formSizes.input
                                                        .buttonSize,
                                                    fontSize:
                                                        formSizes.input
                                                            .fontSize,
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setGaveGift(!gaveGift)
                                                }
                                                className="relative inline-flex items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#b4352a] focus:ring-offset-2 p-1"
                                                style={{
                                                    width: formSizes.toggle
                                                        .width,
                                                    height: formSizes.toggle
                                                        .height,
                                                    backgroundColor: gaveGift
                                                        ? "#4caf50"
                                                        : "#6d4c41",
                                                }}
                                            >
                                                <span
                                                    className="inline-flex items-center justify-center bg-white shadow-lg transition-all duration-300 rounded-full"
                                                    style={{
                                                        height: formSizes.toggle
                                                            .iconSize,
                                                        width: formSizes.toggle
                                                            .iconSize,
                                                        transform: gaveGift
                                                            ? `translateX(calc(${formSizes.toggle.width} - ${formSizes.toggle.iconSize} - 8px))`
                                                            : "translateX(0px)",
                                                    }}
                                                >
                                                    <svg
                                                        className="text-[#6d4c41]"
                                                        fill="currentColor"
                                                        viewBox="0 0 24 24"
                                                        style={{
                                                            width: `calc(${formSizes.toggle.iconSize} * 0.57)`,
                                                            height: `calc(${formSizes.toggle.iconSize} * 0.57)`,
                                                        }}
                                                    >
                                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                                    </svg>
                                                </span>
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

                        {pageState === "already-registered" && !loading && (
                            <div className="space-y-6 transition-opacity duration-1000 text-center">
                                <div className="bg-white/85 backdrop-blur-sm border-2 border-[#b4352a] rounded-2xl shadow-2xl px-8 py-10 max-w-xl mx-auto">
                                    <h2 className="palr45w text-4xl text-[#b4352a] font-semibold mb-4">
                                        Tamu Sudah Terdaftar
                                    </h2>
                                    <p className="text-[#6d4c41] text-lg font-semibold mb-8">
                                        Undangan ini sudah di-check-in
                                        sebelumnya.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={backToScanner}
                                        className="px-8 py-3 bg-[#b4352a] hover:bg-[#8d2a21] text-white rounded-xl font-bold transition"
                                    >
                                        Scan Lagi
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
