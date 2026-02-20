"use client";

import { useState } from "react";
import type { InvitationPublic } from "@/services/invitationsService";
import type { Teapai } from "@/utils/validation";

type RsvpFormProps = {
    invitation: InvitationPublic;
    onSubmitSuccess: () => void;
};

type FormData = {
    displayName: string;
    expectedAttendance: number | null;
    isAttending: boolean | null;
    wishes: string;
    teapai: Teapai | null;
};

export default function RsvpForm({
    invitation,
    onSubmitSuccess,
}: RsvpFormProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({
        displayName: invitation.display_name || invitation.name,
        expectedAttendance: invitation.expected_attendance || null,
        isAttending: invitation.is_attending,
        wishes: invitation.wishes || "",
        teapai: invitation.teapai,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = invitation.responded_at !== null;
    const totalSteps = invitation.is_family ? 5 : 4;

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/guest/invitations/${invitation.url_token}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        displayName: formData.displayName,
                        expectedAttendance: formData.expectedAttendance,
                        isAttending: formData.isAttending,
                        wishes: formData.wishes,
                        teapai: formData.teapai,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to submit RSVP");
            }

            onSubmitSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check if all required fields are filled
    const isFormValid = () => {
        if (!formData.displayName || !formData.displayName.trim()) {
            return false;
        }
        if (
            formData.expectedAttendance === null ||
            formData.expectedAttendance < 1 ||
            formData.expectedAttendance > invitation.number_of_guests
        ) {
            return false;
        }
        if (formData.isAttending === null) {
            return false;
        }
        if (invitation.is_family && !formData.teapai) {
            return false;
        }
        return true;
    };

    const isCurrentStepValid = () => {
        if (currentStep === 1) {
            return !!formData.displayName.trim();
        }
        if (currentStep === 2) {
            return (
                formData.expectedAttendance !== null &&
                formData.expectedAttendance >= 1 &&
                formData.expectedAttendance <= invitation.number_of_guests
            );
        }
        if (currentStep === 3) {
            return formData.isAttending !== null;
        }
        if (currentStep === 5 && invitation.is_family) {
            return !!formData.teapai;
        }
        return true;
    };

    return (
        <div className="w-full">
            {/* Progress Indicator */}
            <div className="w-full mb-7">
                <div className="mb-2 flex items-center justify-between">
                    <p className="font-inter text-[12px] text-white/70">
                        Step {currentStep} of {totalSteps}
                    </p>
                    {isEditing ? (
                        <p className="font-inter text-[12px] text-white/70">
                            Editing
                        </p>
                    ) : null}
                </div>

                <div className="relative flex w-full items-center justify-between">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-white/25" />
                    <div
                        className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-white/80 transition-all duration-300"
                        style={{
                            width: `${
                                totalSteps <= 1
                                    ? 0
                                    : ((currentStep - 1) / (totalSteps - 1)) *
                                      100
                            }%`,
                        }}
                    />
                    {Array.from({ length: totalSteps }, (_, i) => i + 1).map(
                        (step) => (
                            <div
                                key={step}
                                className={
                                    "relative z-10 h-2.5 w-2.5 rounded-full transition-colors " +
                                    (step <= currentStep
                                        ? "bg-white"
                                        : "bg-white/35")
                                }
                            />
                        )
                    )}
                </div>
            </div>

            {/* Form Content */}
            <div className="w-full max-w-xl">
                <div className="min-h-50 flex flex-col">
                    {currentStep === 1 && (
                        <div className="space-y-2 w-full">
                            <label className="font-inter text-[12px] text-white/70">
                                Full name
                            </label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        displayName: e.target.value,
                                    })
                                }
                                className="w-full border-0 border-b border-white/35 bg-transparent px-0 py-3 font-inter text-[15px] text-white placeholder:text-white/45 focus:outline-none focus:ring-0"
                                placeholder="Enter your name"
                            />
                            {!formData.displayName.trim() ? (
                                <p className="text-[12px] text-rose-200 font-inter">
                                    Please enter your name.
                                </p>
                            ) : null}
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-2 w-full">
                            <label className="font-inter text-[12px] text-white/70">
                                Number of guests (max:{" "}
                                {invitation.number_of_guests})
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={invitation.number_of_guests}
                                value={formData.expectedAttendance ?? ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const num =
                                        val === "" ? null : parseInt(val, 10);
                                    setFormData({
                                        ...formData,
                                        expectedAttendance: num,
                                    });
                                }}
                                className="w-full border-0 border-b border-white/35 bg-transparent px-0 py-3 font-inter text-[15px] text-white placeholder:text-white/45 focus:outline-none focus:ring-0"
                                placeholder="Enter number of guests"
                            />
                            {formData.expectedAttendance !== null &&
                            (formData.expectedAttendance < 1 ||
                                formData.expectedAttendance >
                                    invitation.number_of_guests) ? (
                                <p className="text-[12px] text-rose-200 font-inter">
                                    Please enter a valid number (1-
                                    {invitation.number_of_guests}).
                                </p>
                            ) : null}
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-3 w-full">
                            <p className="font-inter text-[12px] text-white/70">
                                Will you attend?
                            </p>
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            isAttending: true,
                                        })
                                    }
                                    className={
                                        "w-full px-2 py-3 text-left font-inter text-[15px] transition-colors " +
                                        (formData.isAttending === true
                                            ? "border-b-2 border-white bg-white/10 text-white font-semibold"
                                            : "border-b border-white/35 text-white/70 hover:bg-white/5 hover:text-white")
                                    }
                                >
                                    Excited to attend
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            isAttending: false,
                                        })
                                    }
                                    className={
                                        "w-full px-2 py-3 text-left font-inter text-[15px] transition-colors " +
                                        (formData.isAttending === false
                                            ? "border-b-2 border-white bg-white/10 text-white font-semibold"
                                            : "border-b border-white/35 text-white/70 hover:bg-white/5 hover:text-white")
                                    }
                                >
                                    Unable to attend
                                </button>
                            </div>
                            {formData.isAttending === null ? (
                                <p className="text-[12px] text-rose-200 font-inter">
                                    Please select an option.
                                </p>
                            ) : null}
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-2 w-full">
                            <label className="font-inter text-[12px] text-white/70">
                                Wishes (optional)
                            </label>
                            <textarea
                                value={formData.wishes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        wishes: e.target.value,
                                    })
                                }
                                className="w-full resize-none border-0 border-b border-white/35 bg-transparent px-0 py-3 font-inter text-[15px] text-white placeholder:text-white/45 focus:outline-none focus:ring-0"
                                placeholder="Share your wishes for the couple..."
                                rows={4}
                            />
                            {isEditing && (
                                <p className="text-[12px] text-amber-200 font-inter">
                                    Note: Editing wishes will hide them from
                                    public display until reviewed
                                </p>
                            )}
                        </div>
                    )}

                    {currentStep === 5 && invitation.is_family && (
                        <div className="space-y-3 w-full">
                            <p className="font-inter text-[12px] text-white/70">
                                Jadwal Teapai
                            </p>
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            teapai: "pagi",
                                        })
                                    }
                                    className={
                                        "w-full px-2 py-3 text-left font-inter text-[15px] transition-colors " +
                                        (formData.teapai === "pagi"
                                            ? "border-b-2 border-white bg-white/10 text-white font-semibold"
                                            : "border-b border-white/35 text-white/70 hover:bg-white/5 hover:text-white")
                                    }
                                >
                                    Pagi
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            teapai: "malam",
                                        })
                                    }
                                    className={
                                        "w-full px-2 py-3 text-left font-inter text-[15px] transition-colors " +
                                        (formData.teapai === "malam"
                                            ? "border-b-2 border-white bg-white/10 text-white font-semibold"
                                            : "border-b border-white/35 text-white/70 hover:bg-white/5 hover:text-white")
                                    }
                                >
                                    Malam
                                </button>
                            </div>
                            {!formData.teapai ? (
                                <p className="text-[12px] text-rose-200 font-inter">
                                    Please select an option.
                                </p>
                            ) : null}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-3 font-inter text-[12px] text-rose-200">
                        {error}
                    </p>
                )}

                <div className="flex items-center justify-between mt-8">
                    <button
                        type="button"
                        onClick={handlePrev}
                        disabled={currentStep === 1 || isSubmitting}
                        className={
                            "border-b px-0 pb-2 font-inter text-[13px] transition-colors " +
                            (currentStep === 1 || isSubmitting
                                ? "border-transparent text-white/30"
                                : "border-white/35 text-white/70 hover:text-white")
                        }
                    >
                        Previous
                    </button>

                    <button
                        type="button"
                        onClick={
                            currentStep === totalSteps
                                ? handleSubmit
                                : handleNext
                        }
                        disabled={
                            isSubmitting ||
                            !isCurrentStepValid() ||
                            (currentStep === totalSteps && !isFormValid())
                        }
                        className={
                            "border-b px-0 pb-2 font-inter text-[13px] transition-colors " +
                            (isSubmitting ||
                            !isCurrentStepValid() ||
                            (currentStep === totalSteps && !isFormValid())
                                ? "border-transparent text-white/30"
                                : "border-white text-white")
                        }
                    >
                        {isSubmitting
                            ? "Submitting..."
                            : currentStep === totalSteps
                            ? isEditing
                                ? "Update"
                                : "Submit"
                            : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );
}
