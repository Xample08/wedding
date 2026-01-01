import { useEffect, useState } from "react";

const FALLBACK_IMAGE_URL = "https://placehold.co/220x220/png?text=Photo";

type LoadingScreenProps = {
    progress: number;
    images: string[];
};

function AnimatedText({
    text,
    baseDelayMs = 0,
}: {
    text: string;
    baseDelayMs?: number;
}) {
    return (
        <span aria-label={text} className="inline-block">
            {Array.from(text).map((char, idx) => (
                <span
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${char}-${idx}`}
                    className="animate-invite-char inline-block"
                    style={{ animationDelay: `${baseDelayMs + idx * 40}ms` }}
                >
                    {char === " " ? "\u00A0" : char}
                </span>
            ))}
        </span>
    );
}

export function LoadingScreen({ progress, images }: LoadingScreenProps) {
    const IMAGE_SIZE_PX = 128;
    const IMAGE_GAP_PX = 56;

    const safeImages = images.length ? images : [FALLBACK_IMAGE_URL];
    const targetIndex = Math.min(
        safeImages.length - 1,
        Math.floor((progress / 100) * safeImages.length)
    );
    const targetSrc = safeImages[targetIndex];

    const [currentSrc, setCurrentSrc] = useState<string>(safeImages[0]);
    const [prevSrc, setPrevSrc] = useState<string | null>(null);
    const [currentOpacity, setCurrentOpacity] = useState(1);
    const [prevOpacity, setPrevOpacity] = useState(0);

    useEffect(() => {
        if (targetSrc === currentSrc) return;

        setPrevSrc(currentSrc);
        setPrevOpacity(1);
        setCurrentOpacity(0);
        setCurrentSrc(targetSrc);

        requestAnimationFrame(() => {
            setPrevOpacity(0);
            setCurrentOpacity(1);
        });

        const id = window.setTimeout(() => setPrevSrc(null), 600);
        return () => window.clearTimeout(id);
    }, [targetSrc, currentSrc]);

    return (
        <div className="relative min-h-screen bg-linear-to-b from-zinc-900 via-zinc-900 to-black px-8 text-center text-white">
            <div className="absolute inset-0 bg-black/40" />

            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ width: IMAGE_SIZE_PX, height: IMAGE_SIZE_PX }}
            >
                <div className="relative h-full w-full overflow-hidden bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.10)]">
                    {prevSrc ? (
                        <img
                            src={prevSrc}
                            alt="Couple"
                            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                            style={{ opacity: prevOpacity }}
                            draggable={false}
                        />
                    ) : null}
                    <img
                        src={currentSrc}
                        alt="Couple"
                        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                        style={{ opacity: currentOpacity }}
                        draggable={false}
                    />
                </div>
            </div>

            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2"
                style={{
                    transform: `translateY(calc(-50% - ${
                        IMAGE_SIZE_PX / 2 + IMAGE_GAP_PX
                    }px))`,
                }}
            >
                <div className="flex flex-col items-center gap-2">
                    <p className="font-inter text-[11px] uppercase tracking-[0.38em] text-white/80">
                        <AnimatedText text="WE INVITE YOU TO" baseDelayMs={0} />
                    </p>
                    <p className="font-inter text-[11px] uppercase tracking-[0.75em] text-white/80">
                        <AnimatedText text="CELEBRATE" baseDelayMs={520} />
                    </p>
                </div>
            </div>

            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2"
                style={{
                    transform: `translateY(calc(-50% + ${
                        IMAGE_SIZE_PX / 2 + IMAGE_GAP_PX
                    }px))`,
                }}
            >
                <p className="font-ovo text-[12px] uppercase tracking-[0.35em] text-white/80">
                    <AnimatedText text="OBE & FELICIA" baseDelayMs={900} />
                </p>
            </div>

            <p className="absolute bottom-1/4 left-1/2 -translate-x-1/2 font-inter text-[12px] uppercase tracking-[0.25em] text-white/85">
                LOADING... {progress}%
            </p>
        </div>
    );
}
