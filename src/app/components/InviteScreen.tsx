type InviteScreenProps = {
    onOpen: () => void;
};

export function InviteScreen({ onOpen }: InviteScreenProps) {
    return (
        <div className="relative flex min-h-screen flex-col bg-linear-to-b from-zinc-900 via-zinc-900 to-black px-8 py-20 text-center text-white">
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative flex flex-1 flex-col items-center justify-start gap-5 pt-4">
                <p className="font-inter text-[11px] uppercase tracking-[0.08em] text-white/80">
                    We invite you to celebrate
                </p>
                <h1 className="font-ovo text-3xl tracking-[0.08em] text-white">
                    OBE &amp; FELICIA
                </h1>
                <p className="font-inter text-[12px] uppercase tracking-[0.08em] text-white/80">
                    Friday, May 1 2026
                </p>
            </div>

            <div className="relative flex justify-center pb-4 pt-8 mb-30">
                <div className="relative flex flex-1 flex-col items-center justify-start gap-5 pt-4">
                    <p className="font-times-italic text-xl tracking-[0.08em] text-white">
                        Dear
                    </p>
                    <p className="font-times-italic text-2xl tracking-[0.08em] text-white">
                        Theofilus Sinjaya
                    </p>
                    <p className="font-inter max-w-xs text-[11px] text-white/80">
                        We would appreciate and be honored to have you
                    </p>
                    <button
                        onClick={onOpen}
                        className="font-inter mt-4 animate-invite-breathe bg-white px-4 py-2 text-[12px] uppercase tracking-[0.22em] text-black backdrop-blur transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/40"
                    >
                        Open
                    </button>
                </div>
            </div>
        </div>
    );
}
