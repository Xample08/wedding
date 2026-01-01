"use client";

import { useState } from "react";
import { InviteScreen } from "./components/InviteScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { SectionsScroller } from "./components/SectionsScroller";
import { BACKGROUNDS } from "./data/backgrounds";
import { LOADING_IMAGES } from "./data/loadingImages";
import { SECTIONS } from "./data/sections";
import { useLoadingFlow } from "./hooks/useLoadingFlow";

export default function Home() {
    const FLIP_DURATION_MS = 1600;
    const [isOpening, setIsOpening] = useState(false);
    const {
        progress,
        phase,
        currentBackground,
        openPages,
        scrollContainerRef,
    } = useLoadingFlow(BACKGROUNDS);

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
                            <InviteScreen onOpen={handleOpenAnimated} />
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
        />
    );
}
