"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import RsvpForm from "@/app/components/RsvpForm";
import { LoadingScreen } from "@/app/components/LoadingScreen";
import { LOADING_IMAGES } from "@/app/data/loadingImages";
import type { InvitationPublic } from "@/services/invitationsService";

export default function RsvpPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const [token, setToken] = useState<string | null>(null);
    const [invitation, setInvitation] = useState<InvitationPublic | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const router = useRouter();

    useEffect(() => {
        params.then((p) => setToken(p.token));
    }, [params]);

    useEffect(() => {
        if (!token) return;

        const fetchInvitation = async () => {
            try {
                const response = await fetch(`/api/guest/invitations/${token}`);
                if (!response.ok) {
                    throw new Error("Invitation not found");
                }
                const data = await response.json();
                setInvitation(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load invitation"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchInvitation();
    }, [token]);

    const handleSubmitSuccess = () => {
        setSubmitted(true);
        // Show QR code after short delay
        setTimeout(() => {
            setShowQRCode(true);
        }, 1500);
    };

    useEffect(() => {
        if (showQRCode && qrCanvasRef.current && token) {
            const qrUrl = `${window.location.origin}/invite/${token}`;
            QRCode.toCanvas(
                qrCanvasRef.current,
                qrUrl,
                {
                    width: 280,
                    margin: 2,
                    color: {
                        dark: "#000000",
                        light: "#FFFFFF",
                    },
                },
                (error) => {
                    if (error)
                        console.error("QR Code generation error:", error);
                }
            );
        }
    }, [showQRCode, token]);

    const handleDownloadQR = () => {
        if (qrCanvasRef.current) {
            const url = qrCanvasRef.current.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `wedding-invitation-${
                invitation?.name || "qr"
            }.png`;
            link.href = url;
            link.click();
        }
    };

    if (loading) {
        return <LoadingScreen progress={50} images={LOADING_IMAGES} />;
    }

    if (error || !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="text-center">
                    <h1 className="font-ovo text-3xl text-red-600 mb-4">
                        Oops!
                    </h1>
                    <p className="font-inter text-gray-700">
                        {error || "Invitation not found"}
                    </p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="mb-6">
                            <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center">
                                <svg
                                    className="w-10 h-10 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                        </div>
                        <h1 className="font-ovo text-3xl text-white mb-4">
                            Thank You!
                        </h1>
                        <p className="font-inter text-white/70">
                            Your RSVP has been{" "}
                            {invitation.responded_at ? "updated" : "submitted"}{" "}
                            successfully.
                        </p>
                    </div>

                    {showQRCode && (
                        <div className="mt-12 space-y-6">
                            <div className="text-center">
                                <p className="font-inter text-[14px] text-white/70 mb-2">
                                    Scan to view your invitation
                                </p>
                                <p className="font-inter text-[12px] text-white/50">
                                    Share this QR code with your guests or save
                                    it for easy access
                                </p>
                            </div>

                            <div className="flex justify-center">
                                <div className="bg-white p-4 rounded-lg shadow-xl">
                                    <canvas ref={qrCanvasRef} />
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={handleDownloadQR}
                                    className="border-b border-white px-4 pb-2 font-inter text-[13px] text-white transition-colors hover:text-white/70"
                                >
                                    Download QR Code
                                </button>
                            </div>

                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => {
                                        if (token) {
                                            router.push(`/invite/${token}`);
                                        }
                                    }}
                                    className="border-b border-white/35 px-4 pb-2 font-inter text-[13px] text-white/70 transition-colors hover:text-white"
                                >
                                    View Invitation
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <RsvpForm
            invitation={invitation}
            onSubmitSuccess={handleSubmitSuccess}
        />
    );
}
