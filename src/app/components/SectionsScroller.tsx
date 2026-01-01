import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { Section } from "../types";

type SectionsScrollerProps = {
    sections: Section[];
    backgrounds: string[];
    scrollContainerRef: RefObject<HTMLDivElement | null>;
    showChrome?: boolean;
};

export function SectionsScroller({
    sections,
    backgrounds,
    scrollContainerRef,
    showChrome = true,
}: SectionsScrollerProps) {
    const sectionIds = useMemo(
        () => sections.map((_, idx) => `slide-${idx}`),
        [sections]
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
            updateActiveIndex(container)
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
        <div className="relative h-screen w-full">
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
                        className="relative flex h-screen snap-start items-center justify-center px-8"
                        style={{
                            backgroundImage:
                                backgrounds[idx % backgrounds.length],
                        }}
                    >
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
                    </section>
                ))}
            </div>

            {showChrome ? (
                <>
                    <div className="pointer-events-none absolute bottom-5 left-5 text-[12px] uppercase tracking-[0.25em] text-white/85">
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
                        className={`absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-white/30 ${
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
                        <div className="absolute inset-0 z-10">
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
