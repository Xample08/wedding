export type InvitationPhase = "loading" | "invite" | "pages";

export type Section = {
    title: string;
    body: string;
    subtitle?: string;
    date?: string;
    heroImage?: string;
    quoteImage?: string;
    attribution?: string;
    label?: string;
    fullName?: string;
    parentNames?: string;
    socialHandle?: string;
    storyImage?: string;
    storyHtml?: string;
    hashtags?: string;
    coupleLabel?: string;
    eventImage?: string;
    eventDate?: string;
    eventDetails?: string;
    eventAddress?: string;
    mapsUrl?: string;
    countdownImage?: string;
    countdownDate?: string;
    countdownPhoto?: string;
    countdownHeading?: string;
    icsEvent?: {
        title: string;
        location: string;
        start: string; // ISO date string
        end: string;   // ISO date string
    };
    wishesImage?: string;
};
