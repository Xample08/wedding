import { notFound } from "next/navigation";
import { InviteExperience } from "../InviteExperience";
import { getInvitationByToken } from "@/services/invitationsService";

function isValidToken(token: string) {
    return /^[0-9a-f]{32}$/i.test(token);
}

export default async function InviteTokenPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    if (!token || !isValidToken(token)) {
        notFound();
    }

    const invitation = await getInvitationByToken(token);
    if (!invitation) {
        notFound();
    }

    return <InviteExperience token={token} initialInvitation={invitation} />;
}
