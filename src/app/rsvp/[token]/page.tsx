"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
        // Optionally redirect after a delay
        setTimeout(() => {
            if (token) {
                router.push(`/invite/${token}`);
            }
        }, 2000);
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
            <div className="min-h-screen flex items-center justify-center px-6">
                <div className="text-center">
                    <div className="mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                            <svg
                                className="w-10 h-10 text-green-600"
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
                    <h1 className="font-ovo text-3xl text-[#8B4513] mb-4">
                        Thank You!
                    </h1>
                    <p className="font-inter text-gray-700">
                        Your RSVP has been{" "}
                        {invitation.responded_at ? "updated" : "submitted"}{" "}
                        successfully.
                    </p>
                    <p className="font-inter text-sm text-gray-500 mt-2">
                        Redirecting...
                    </p>
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
