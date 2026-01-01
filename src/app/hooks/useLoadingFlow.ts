import { useEffect, useRef, useState } from "react";
import { InvitationPhase } from "../types";

export function useLoadingFlow(backgrounds: string[]) {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<InvitationPhase>("loading");
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (phase !== "loading") return;
        const id = setInterval(() => {
            setProgress((p) => {
                const next = Math.min(
                    100,
                    p + Math.floor(Math.random() * 8) + 1
                );
                if (next === 100) {
                    clearInterval(id);
                    setTimeout(() => setPhase("invite"), 500);
                }
                return next;
            });
        }, 120);
        return () => clearInterval(id);
    }, [phase]);

    const currentBackground =
        backgrounds[
            Math.floor((progress / 100) * backgrounds.length) %
                backgrounds.length
        ];

    const openPages = () => {
        setPhase("pages");
        requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });
            }
        });
    };

    return {
        progress,
        phase,
        setPhase,
        currentBackground,
        openPages,
        scrollContainerRef,
    };
}
