"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

type QRCodeSectionProps = {
    token: string;
    name?: string;
};

export default function QRCodeSection({ token, name }: QRCodeSectionProps) {
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (qrCanvasRef.current && token) {
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
    }, [token]);

    const handleDownloadQR = () => {
        if (qrCanvasRef.current) {
            const url = qrCanvasRef.current.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `wedding-invitation-${name || "qr"}.png`;
            link.href = url;
            link.click();
        }
    };

    return (
        <div className="w-full px-4">
            <h2 className="font-times-italic text-[34px] leading-[1.05] text-white">
                Your Personal Invitation
            </h2>

            <p className="mt-4 max-w-xl font-inter text-[13px] leading-relaxed text-white/85">
                Scan this QR code to view your invitation anytime or share it
                with your guests for easy access. You can also download and save
                it for later.
            </p>

            <div className="mt-8 space-y-6">
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
            </div>
        </div>
    );
}
