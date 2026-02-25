"use client";

import { useEffect, useMemo, useState } from "react";
import { InviteScreen } from "../components/InviteScreen";
import { LoadingScreen } from "../components/LoadingScreen";
import { SectionsScroller } from "../components/SectionsScroller";
import RsvpForm from "@/app/components/RsvpForm";
import QRCodeSection from "@/app/components/QRCodeSection";
import { BACKGROUNDS } from "../data/backgrounds";
import { LOADING_IMAGES } from "../data/loadingImages";
import { SECTIONS } from "../data/sections";
import { useLoadingFlow } from "../hooks/useLoadingFlow";
import type { InvitationPublic } from "@/services/invitationsService";

type InviteExperienceProps = {
    token?: string;
    initialInvitation?: InvitationPublic;
};

function isValidToken(token: string | undefined): token is string {
    return typeof token === "string" && /^[0-9a-f]{32}$/i.test(token);
}

export function InviteExperience({
    token,
    initialInvitation,
}: InviteExperienceProps) {
    const FLIP_DURATION_MS = 1600;
    const [isOpening, setIsOpening] = useState(false);

    const { progress, phase, openPages, scrollContainerRef } =
        useLoadingFlow(BACKGROUNDS);

    const [invitation, setInvitation] = useState<InvitationPublic | null>(
        initialInvitation ?? null
    );
    const [invitationError, setInvitationError] = useState<string | null>(null);
    const [fetchingInvitation, setFetchingInvitation] = useState(false);

    const tokenOk = useMemo(() => isValidToken(token), [token]);

    useEffect(() => {
        if (!tokenOk) {
            setInvitation(null);
            setInvitationError(null);
            return;
        }

        // If the server already provided the invitation, avoid a client fetch
        // so guests don't see a loading flash when opening RSVP.
        if (initialInvitation) {
            setInvitation(initialInvitation);
            setInvitationError(null);
            setFetchingInvitation(false);
            return;
        }

        // If we already have data (or an error), don't refetch.
        if (invitation || invitationError) return;

        let cancelled = false;
        setFetchingInvitation(true);
        setInvitationError(null);

        fetch(`/api/guest/invitations/${token}`, { method: "GET" })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(data?.error || "Invitation not found");
                }
                return data as InvitationPublic;
            })
            .then((data) => {
                if (cancelled) return;
                setInvitation(data);
            })
            .catch((err: any) => {
                if (cancelled) return;
                setInvitation(null);
                setInvitationError(err?.message || "Failed to load invitation");
            })
            .finally(() => {
                if (cancelled) return;
                setFetchingInvitation(false);
            });

        return () => {
            cancelled = true;
        };
    }, [token, tokenOk, initialInvitation, invitation, invitationError]);

    const handleOpenAnimated = () => {
        if (isOpening) return;
        const container = scrollContainerRef.current;
        if (container) {
            container.scrollTo({ top: 0, behavior: "auto" });
        }

        setIsOpening(true);
        window.setTimeout(() => {
            openPages();
            setIsOpening(false);
        }, FLIP_DURATION_MS);
    };

    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const handleRsvpSuccess = () => {
        setShowSuccessMessage(true);

        // Refresh invitation data (in the background)
        if (tokenOk && token) {
            fetch(`/api/guest/invitations/${token}`, { method: "GET" })
                .then(async (res) => {
                    const data = await res.json().catch(() => ({}));
                    if (res.ok) {
                        setInvitation(data as InvitationPublic);
                    }
                })
                .catch(() => {});
        }

        window.setTimeout(() => setShowSuccessMessage(false), 3000);
    };

    const qrCodeSlot =
        tokenOk && token ? (
            <div className="w-full px-4">
                <QRCodeSection token={token} name={invitation?.name} />
            </div>
        ) : null;

    const rsvpSlot = (
        <div className="w-full px-4">
            {!tokenOk ? (
                <p className="text-sm leading-relaxed text-white/85 text-center">
                    RSVP is available only through your personal invitation
                    link.
                </p>
            ) : fetchingInvitation ? (
                <p className="text-sm text-white/85 text-center">
                    Loading invitation…
                </p>
            ) : invitationError ? (
                <p className="text-sm text-rose-200 text-center">
                    {invitationError}
                </p>
            ) : !invitation ? (
                <p className="text-sm text-white/85 text-center">
                    Invitation not found.
                </p>
            ) : (
                <div className="w-full">
                    <h2 className="font-times-italic text-[34px] leading-[1.05] text-white">
                        Kindly Confirm Your Presence And Share Your Blessings
                    </h2>

                    <p className="mt-4 max-w-xl font-inter text-[13px] leading-relaxed text-white/85">
                        We kindly request your prompt response to confirm your
                        attendance at our upcoming event. Alongside your RSVP,
                        please take a moment to extend your warm regards and
                        best wishes.
                    </p>

                    <div className="mt-8">
                        <RsvpForm
                            invitation={invitation}
                            onSubmitSuccess={handleRsvpSuccess}
                        />
                    </div>

                    {showSuccessMessage ? (
                        <div className="mt-4 flex items-center gap-2 text-[12px] text-emerald-200">
                            <span aria-hidden="true">✓</span>
                            <span className="font-inter">
                                Your submission was successful.
                            </span>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );

    if (phase === "loading") {
        return <LoadingScreen progress={progress} images={LOADING_IMAGES} />;
    }

    if (phase === "invite") {
        const firstSection = SECTIONS[0];
        return (
            <div className="relative h-screen w-full overflow-hidden">

                <div className="invite-flip-scene">
                    <div
                        className={`invite-flip-card ${
                            isOpening ? "is-flipped" : ""
                        }`}
                    >
                        <div className="invite-flip-face">
                            <InviteScreen
                                onOpen={handleOpenAnimated}
                                recipientName={invitation?.name ?? null}
                            />
                        </div>
                        <div className="invite-flip-face invite-flip-back">
                            <section
                                className="relative flex h-screen items-center justify-center px-8"
                            >
                                {/* Background photo */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${firstSection?.heroImage ?? "/hero-bg.jpg"}), linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)`,
                                    }}
                                />
                                {/* Dark overlay */}
                                <div className="absolute inset-0 bg-black/40" />

                                {/* Centered content */}
                                <div className="relative z-10 flex w-full flex-col items-center justify-center text-center text-white">
                                    {/* Floral icon */}
                                    <img
                                        src="/floral-icon.svg"
                                        alt=""
                                        className="mb-5 h-8 w-8 brightness-0 invert opacity-80"
                                    />

                                    {firstSection?.subtitle && (
                                        <p className="font-inter text-[11px] uppercase tracking-[0.25em] text-white/85">
                                            {firstSection.subtitle}
                                        </p>
                                    )}

                                    <h1 className="mt-3 font-ovo text-[28px] uppercase tracking-[0.12em] text-white sm:text-4xl">
                                        {firstSection?.title}
                                    </h1>

                                    {firstSection?.date && (
                                        <p className="mt-3 font-inter text-[11px] uppercase tracking-[0.25em] text-white/85">
                                            {firstSection.date}
                                        </p>
                                    )}

                                    {/* Scroll-down arrow (same as SectionsScroller hero) */}
                                    <button
                                        type="button"
                                        aria-label="Scroll down"
                                        className="mt-30 mb-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/50 text-white/80 transition hover:bg-white/10 animate-scroll-bounce"
                                    >
                                        <svg
                                            className="h-3.5 w-3.5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M12 5v14" />
                                            <path d="M19 12l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* ── Chrome overlays shown during flip so they don't vanish ── */}
                {isOpening && (
                    <>
                        {/* Page number (bottom-left) */}
                        <div className="pointer-events-none absolute bottom-5 left-5 z-[9999] text-[12px] uppercase tracking-[0.25em] text-white/85 animate-flip-chrome-in">
                            1/{SECTIONS.length}
                        </div>

                        {/* Burger menu button (top-right) */}
                        <div
                            className="absolute right-5 top-5 z-[9999] flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur animate-flip-chrome-in"
                        >
                            <span className="flex flex-col gap-1">
                                <span className="block h-0.5 w-5 bg-white/90" />
                                <span className="block h-0.5 w-5 bg-white/90" />
                                <span className="block h-0.5 w-5 bg-white/90" />
                            </span>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <SectionsScroller
            sections={SECTIONS}
            backgrounds={BACKGROUNDS}
            scrollContainerRef={scrollContainerRef}
            rsvpSlot={rsvpSlot}
            qrCodeSlot={qrCodeSlot}
        />
    );
}
