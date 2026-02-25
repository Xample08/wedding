import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Section } from "../types";

type SectionsScrollerProps = {
    sections: Section[];
    backgrounds: string[];
    scrollContainerRef: RefObject<HTMLDivElement | null>;
    showChrome?: boolean;
    rsvpSlot?: React.ReactNode;
    qrCodeSlot?: React.ReactNode;
};

export function SectionsScroller({
    sections,
    backgrounds,
    scrollContainerRef,
    showChrome = true,
    rsvpSlot,
    qrCodeSlot,
}: SectionsScrollerProps) {
    const sectionIds = useMemo(
        () => sections.map((_, idx) => `slide-${idx}`),
        [sections],
    );

    const [activeIndex, setActiveIndex] = useState(0);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [burgerPop, setBurgerPop] = useState(false);
    const rafRef = useRef<number | null>(null);

    const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        event.preventDefault();
        const container = event.currentTarget;
        const direction = Math.sign(event.deltaY) || 1;
        const step = container.clientHeight;
        container.scrollTo({
            top: container.scrollTop + direction * step,
            behavior: "smooth",
        });
    };

    const updateActiveIndex = (container: HTMLDivElement) => {
        const height = container.clientHeight || 1;
        const idx = Math.round(container.scrollTop / height);
        const clamped = Math.max(0, Math.min(sections.length - 1, idx));
        setActiveIndex(clamped);
    };

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const container = event.currentTarget;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() =>
            updateActiveIndex(container),
        );
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        updateActiveIndex(container);
    }, [scrollContainerRef]);

    useEffect(() => {
        if (!menuOpen) {
            setMenuVisible(false);
            return;
        }
        const id = requestAnimationFrame(() => setMenuVisible(true));
        return () => cancelAnimationFrame(id);
    }, [menuOpen]);

    const jumpTo = (idx: number) => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const targetTop = idx * container.clientHeight;
        container.scrollTo({ top: targetTop, behavior: "smooth" });
        setMenuOpen(false);
    };

    return (
        <div className="relative h-screen w-full isolate">
            <div
                ref={scrollContainerRef}
                className="h-screen w-full snap-y snap-mandatory overflow-y-scroll bg-white text-zinc-900 scroll-smooth"
                onWheel={handleWheel}
                onScroll={handleScroll}
            >
                {sections.map((section, idx) => (
                    <section
                        id={sectionIds[idx]}
                        key={section.title}
                        className="relative flex h-screen snap-start px-6"
                        style={{
                            backgroundImage: section.heroImage
                                ? undefined
                                : backgrounds[idx % backgrounds.length],
                        }}
                    >
                        {/* ── Hero slide (first page) ── */}
                        {section.heroImage ? (
                            <>
                                {/* Background photo */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${section.heroImage}), linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)`,
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

                                    {section.subtitle && (
                                        <p className="font-inter text-[10px] uppercase tracking-[0.20em] text-white/85">
                                            {section.subtitle}
                                        </p>
                                    )}

                                    <h1 className="mt-3 font-ovo text-[28px] uppercase tracking-[0.12em] text-white sm:text-4xl">
                                        {section.title}
                                    </h1>

                                    {section.date && (
                                        <p className="mt-3 font-inter text-[10px] uppercase tracking-[0.20em] text-white/85">
                                            {section.date}
                                        </p>
                                    )}

                                    {/* Scroll-down arrow */}
                                    <button
                                        type="button"
                                        aria-label="Scroll down"
                                        onClick={() => {
                                            const container =
                                                scrollContainerRef.current;
                                            if (!container) return;
                                            container.scrollTo({
                                                top: container.clientHeight,
                                                behavior: "smooth",
                                            });
                                        }}
                                        className="relative z-[100] mt-25 mb-40 flex h-7 w-7 items-center justify-center rounded-full border border-white/50 text-white/80 transition hover:bg-white/10 animate-scroll-bounce"
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
                            </>
                        ) : section.quoteImage ? (
                            <>
                                {/* Background photo */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${section.quoteImage})`,
                                        filter: 'grayscale(100%)',
                                    }}
                                />
                                {/* Bottom gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                {/* Bottom-left content */}
                                <div className="relative z-10 flex w-full flex-col justify-end pb-16">
                                    <h2 className="font-ovo text-[22px] uppercase tracking-[0.18em] text-white">
                                        {section.title}
                                    </h2>

                                    <p className="mt-4 max-w-sm font-times-italic text-[14px] leading-relaxed text-white/90">
                                        {section.body}
                                    </p>

                                    {section.attribution && (
                                        <p className="mt-5 font-times-italic text-[16px] text-white">
                                            {section.attribution}
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : section.fullName ? (
                            <>
                                {/* Dark background */}
                                <div className="absolute inset-0 bg-black" />

                                {/* Bottom-left content */}
                                <div className="relative z-10 flex w-full flex-col justify-end pb-16">
                                    {section.label && (
                                        <p className="font-inter text-[10px] uppercase tracking-[0.25em] text-white/70">
                                            {section.label}
                                        </p>
                                    )}

                                    <h2 className="mt-3 font-ovo text-[56px] leading-[1.05] text-white">
                                        {section.fullName.split('\n').map((line, i) => (
                                            <span key={i}>
                                                {line}
                                                {i < section.fullName!.split('\n').length - 1 && <br />}
                                            </span>
                                        ))}
                                    </h2>

                                    {section.parentNames && (
                                        <div className="mt-6">
                                            <p className="font-times-italic text-[20px] text-white/80 flex items-center gap-3">
                                                <span>The Son of</span>
                                                <span className="flex-1 border-t border-white/30" />
                                            </p>
                                            <p className="mt-2 font-inter text-[13px] tracking-wide text-white/85">
                                                {section.parentNames}
                                            </p>
                                        </div>
                                    )}

                                    {section.socialHandle && (
                                        <div className="mt-5 mb-15">
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3.5 py-1.5 text-[12px] uppercase tracking-[0.12em] text-white/80">
                                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                                </svg>
                                                {section.socialHandle}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : section.storyImage ? (
                            <>
                                {/* Background photo */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${section.storyImage})`,
                                    }}
                                />
                                {/* Dark overlay */}
                                <div className="absolute inset-0 bg-black/70" />

                                {/* Scrollable story content */}
                                <div className="relative z-10 flex w-full flex-col px-5 py-10 overflow-y-auto justify-center">
                                    {/* Title */}
                                    <h2 className="font-ovo mt-5 text-[34px] uppercase leading-[1] tracking-[0.06em] text-white">
                                        {section.title.split('\n').map((line, i) => (
                                            <span key={i}>
                                                {line}
                                                {i < section.title.split('\n').length - 1 && <br />}
                                            </span>
                                        ))}
                                    </h2>

                                    {/* Story paragraphs */}
                                    {section.storyHtml && (
                                        <div
                                            className="story-body mt-6 font-inter text-[13px] leading-[1.7] text-white/85"
                                            dangerouslySetInnerHTML={{ __html: section.storyHtml }}
                                        />
                                    )}

                                    {/* Hashtags */}
                                    {section.hashtags && (
                                        <p className="mt-6 font-inter text-[13px] text-white/70">
                                            {section.hashtags}
                                        </p>
                                    )}

                                    {/* Couple label with decorative lines */}
                                    {section.coupleLabel && (
                                        <div className="mt-8 flex items-center gap-3">
                                            <span className="flex-1 border-t border-white/30" />
                                            <span className="font-inter text-[11px] uppercase tracking-[0.2em] text-white/85 whitespace-nowrap">
                                                {section.coupleLabel}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : section.eventImage ? (
                            <>
                                {/* Background photo */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage: `url(${section.eventImage})`,
                                    }}
                                />
                                {/* Dark overlay */}
                                <div className="absolute inset-0 bg-black/50" />

                                {/* Content */}
                                <div className="relative z-10 px-5 flex w-full flex-col justify-center">
                                    {/* Date */}
                                    {section.eventDate && (
                                        <h2 className="font-ovo text-[36px] leading-[1.05] text-white">
                                            {section.eventDate.split('\n').map((line, i) => (
                                                <span key={i}>
                                                    {line}
                                                    {i < section.eventDate!.split('\n').length - 1 && <br />}
                                                </span>
                                            ))}
                                        </h2>
                                    )}

                                    {/* Venue details */}
                                    {section.eventDetails && (
                                        <div className="mt-6 border-t border-white/30 pt-5">
                                            <p className="font-ovo text-[18px] uppercase leading-[1.4] tracking-[0.08em] text-white">
                                                {section.eventDetails.split('\n').map((line, i) => (
                                                    <span key={i}>
                                                        {line}
                                                        {i < section.eventDetails!.split('\n').length - 1 && <br />}
                                                    </span>
                                                ))}
                                            </p>
                                        </div>
                                    )}

                                    {/* Address */}
                                    {section.eventAddress && (
                                        <p className="mt-3 font-inter text-[13px] leading-[1.5] text-white/75">
                                            {section.eventAddress.split('\n').map((line, i) => (
                                                <span key={i}>
                                                    {line}
                                                    {i < section.eventAddress!.split('\n').length - 1 && <br />}
                                                </span>
                                            ))}
                                        </p>
                                    )}

                                    {/* Google Maps button */}
                                    {section.mapsUrl && (
                                        <div className="mt-5">
                                            <a
                                                href={section.mapsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block rounded-sm border border-white/40 bg-white/15 px-5 py-2.5 font-inter text-[11px] uppercase tracking-[0.18em] text-white backdrop-blur transition hover:bg-white/25"
                                            >
                                                Google Maps
                                            </a>
                                        </div>
                                    )}

                                    {/* Separator */}
                                    <div className="mt-8 border-t border-white/25" />
                                </div>
                            </>
                        ) : section.countdownDate ? (
                            <CountdownSlide section={section} backgrounds={backgrounds} idx={idx} />
                        ) : section.wishesImage ? (
                            <WishesSlide section={section} />
                        ) : section.title === "RSVP" && rsvpSlot ? (
                            <>
                                <div className="absolute inset-0 bg-black" />
                                <div className="relative z-10 w-full max-w-2xl px-2 pt-16 pb-10">
                                    {rsvpSlot}
                                </div>
                            </>
                        ) : (
                            <div className="max-w-md rounded-3xl bg-white/80 p-8 text-center shadow-xl backdrop-blur">
                                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-rose-500">
                                    {String(idx + 1).padStart(2, "0")} ·{" "}
                                    {idx === 0 ? "Welcome" : "Details"}
                                </p>
                                <h2 className="text-3xl font-semibold text-zinc-900">
                                    {section.title}
                                </h2>
                                <p className="mt-4 text-base leading-relaxed text-zinc-700">
                                    {section.body}
                                </p>
                            </div>
                        )}
                    </section>
                ))}
                {qrCodeSlot && (
                    <section
                        id="qr-code-section"
                        className="relative flex h-screen snap-start px-8"
                        style={{
                            backgroundImage:
                                backgrounds[backgrounds.length - 1],
                        }}
                    >
                        <div className="absolute inset-0 bg-black" />
                        <div className="relative z-10 w-full max-w-2xl px-2 pt-16 pb-10">
                            {qrCodeSlot}
                        </div>
                    </section>
                )}
            </div>

            {showChrome ? (
                <>
                    <div className="pointer-events-none absolute bottom-5 left-5 z-[9999] text-[12px] uppercase tracking-[0.25em] text-white/85">
                        {activeIndex + 1}/{sections.length}
                    </div>

                    <button
                        type="button"
                        aria-label="Open menu"
                        onClick={() => {
                            setBurgerPop(true);
                            window.setTimeout(() => setBurgerPop(false), 180);
                            setMenuOpen(true);
                        }}
                        className={`absolute right-5 top-5 z-[9999] flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white/30 ${
                            burgerPop ? "scale-110" : "scale-100"
                        }`}
                    >
                        <span className="flex flex-col gap-1">
                            <span className="block h-0.5 w-5 bg-white/90" />
                            <span className="block h-0.5 w-5 bg-white/90" />
                            <span className="block h-0.5 w-5 bg-white/90" />
                        </span>
                    </button>

                    {menuOpen ? (
                        <div className="absolute inset-0 z-[10000]">
                            <button
                                type="button"
                                aria-label="Close menu"
                                onClick={() => setMenuOpen(false)}
                                className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
                                    menuVisible ? "opacity-100" : "opacity-0"
                                }`}
                            />

                            <div
                                className={`absolute left-4 right-4 top-4 rounded-3xl bg-white/90 p-6 text-left text-zinc-900 shadow-xl backdrop-blur transition-all duration-300 ${
                                    menuVisible
                                        ? "translate-y-0 scale-100 opacity-100"
                                        : "translate-y-2 scale-95 opacity-0"
                                }`}
                            >
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setMenuOpen(false)}
                                        className="rounded-full bg-zinc-900 px-4 py-2 text-[12px] uppercase tracking-[0.12em] text-white"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="mt-6 space-y-3 font-ovo text-2xl">
                                    {sections.map((s, idx) => (
                                        <button
                                            key={s.title}
                                            type="button"
                                            onClick={() => jumpTo(idx)}
                                            className="block w-full text-left"
                                        >
                                            {s.title}
                                        </button>
                                    ))}
                                </div>

                                <p className="mt-8 max-w-xs text-[11px] text-zinc-500">
                                    Please click one of the menu options above
                                    to navigate directly to your desired page.
                                </p>
                            </div>
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}

/* ─── .ics file generator ────────────────────────────────────── */
function generateIcs(event: {
    title: string;
    location: string;
    start: string;
    end: string;
}) {
    const fmt = (iso: string) =>
        new Date(iso)
            .toISOString()
            .replace(/[-:]/g, "")
            .replace(/\.\d{3}/, "");

    const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Wedding//EN",
        "BEGIN:VEVENT",
        `DTSTART:${fmt(event.start)}`,
        `DTEND:${fmt(event.end)}`,
        `SUMMARY:${event.title}`,
        `LOCATION:${event.location}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "save-the-date.ics";
    a.click();
    URL.revokeObjectURL(url);
}

/* ─── Countdown Slide ────────────────────────────────────────── */
function CountdownSlide({
    section,
}: {
    section: Section;
    backgrounds: string[];
    idx: number;
}) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1_000);
        return () => clearInterval(id);
    }, []);

    const target = new Date(section.countdownDate!).getTime();
    const diff = Math.max(0, target - now);
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1_000);

    const boxes: [string, string][] = [
        [String(days).padStart(2, "0"), "Hari"],
        [String(hours).padStart(2, "0"), "Jam"],
        [String(minutes).padStart(2, "0"), "Menit"],
        [String(seconds).padStart(2, "0"), "Detik"],
    ];

    return (
        <>
            {/* Background photo */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${section.countdownImage})` }}
            />
            <div className="absolute inset-0 bg-black/60" />

            {/* Content */}
            <div className="relative z-10 flex w-full flex-col items-center justify-center text-center">
                {/* Couple photo */}
                {section.countdownPhoto && (
                    <img
                        src={section.countdownPhoto}
                        alt=""
                        className="mb-6 h-28 w-28 rounded-md object-cover shadow-lg"
                    />
                )}

                {/* Heading */}
                {section.countdownHeading && (
                    <h2 className="font-ovo text-[22px] uppercase leading-[1.2] tracking-[0.06em] text-white/90">
                        {section.countdownHeading.split("\n").map((line, i) => (
                            <span key={i}>
                                {line}
                                {i <
                                    section.countdownHeading!.split("\n")
                                        .length -
                                        1 && <br />}
                            </span>
                        ))}
                    </h2>
                )}

                {/* Countdown boxes */}
                <div className="mt-6 flex gap-3">
                    {boxes.map(([val, label]) => (
                        <div
                            key={label}
                            className="flex w-[72px] flex-col items-center rounded-md border border-white/20 py-3"
                        >
                            <span className="font-ovo text-[28px] leading-none text-white">
                                {val}
                            </span>
                            <span className="mt-1 font-inter text-[10px] uppercase tracking-[0.1em] text-white/60">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Save the date */}
                {section.icsEvent && (
                    <button
                        type="button"
                        onClick={() => generateIcs(section.icsEvent!)}
                        className="mt-7 inline-flex items-center gap-2 rounded-sm border border-white/40 bg-white/10 px-6 py-2.5 font-inter text-[11px] uppercase tracking-[0.18em] text-white backdrop-blur transition hover:bg-white/20"
                    >
                        Save the Date
                        <span className="text-[14px]">→</span>
                    </button>
                )}
            </div>
        </>
    );
}

/* ─── Wishes Slide ────────────────────────────────────────────── */
type WishItem = {
    display_name: string;
    wishes: string;
    responded_at: string;
};

function WishesSlide({ section }: { section: Section }) {
    const [wishes, setWishes] = useState<WishItem[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/wishes")
            .then((r) => r.json())
            .then((json) => {
                if (Array.isArray(json.data)) setWishes(json.data);
            })
            .catch(() => {});
    }, []);

    const scrollNext = () => {
        scrollRef.current?.scrollBy({ top: 300, behavior: "smooth" });
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return "";
        }
    };

    return (
        <>
            {/* Background photo */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${section.wishesImage})` }}
            />
            <div className="absolute inset-0 bg-black/60" />

            {/* Content */}
            <div className="relative z-10 flex h-full w-full flex-col px-6 pt-8 pb-16">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-ovo text-[24px] text-white">Wishes</h2>
                    <button
                        type="button"
                        onClick={scrollNext}
                        className="font-inter text-[11px] uppercase tracking-[0.18em] text-white/80 flex items-center gap-1.5 transition hover:text-white"
                    >
                        Next <span className="text-[14px]">→</span>
                    </button>
                </div>

                {/* Scrollable wishes list */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto pr-1"
                    style={{ scrollbarWidth: "none" }}
                >
                    {wishes.length === 0 && (
                        <p className="text-white/50 font-inter text-[13px] mt-8">
                            No wishes yet.
                        </p>
                    )}
                    {wishes.map((w, i) => (
                        <div
                            key={i}
                            className={`mb-6 ${i % 2 === 1 ? "text-right" : "text-left"}`}
                        >
                            <p className="font-ovo text-[20px] italic text-white">
                                {w.display_name}
                            </p>
                            <p className="mt-1 font-inter text-[13px] leading-[1.6] text-white/80">
                                {w.wishes}
                            </p>
                            <p className="mt-1 font-inter text-[10px] text-white/40">
                                {formatDate(w.responded_at)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
