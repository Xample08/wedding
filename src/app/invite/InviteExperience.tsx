"use client";

import { useEffect, useMemo, useState } from "react";
import { InviteScreen } from "../components/InviteScreen";
import { LoadingScreen } from "../components/LoadingScreen";
import { SectionsScroller } from "../components/SectionsScroller";
import RsvpForm from "@/app/components/RsvpForm";
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
                {!isOpening ? (
                    <div className="absolute inset-0 pointer-events-none">
                        <SectionsScroller
                            sections={SECTIONS}
                            backgrounds={BACKGROUNDS}
                            scrollContainerRef={scrollContainerRef}
                            showChrome={false}
                        />
                    </div>
                ) : null}

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
                                style={{
                                    backgroundImage:
                                        BACKGROUNDS[0] ??
                                        "linear-gradient(135deg, #fce7f3 0%, #f1f5f9 100%)",
                                }}
                            >
                                <div className="max-w-md rounded-3xl bg-white/80 p-8 text-center shadow-xl backdrop-blur">
                                    <p className="mb-3 text-xs uppercase tracking-[0.3em] text-rose-500">
                                        {"01"} · {"Welcome"}
                                    </p>
                                    <h2 className="text-3xl font-semibold text-zinc-900">
                                        {firstSection?.title}
                                    </h2>
                                    <p className="mt-4 text-base leading-relaxed text-zinc-700">
                                        {firstSection?.body}
                                    </p>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <SectionsScroller
            sections={SECTIONS}
            backgrounds={BACKGROUNDS}
            scrollContainerRef={scrollContainerRef}
            rsvpSlot={rsvpSlot}
        />
    );
}
