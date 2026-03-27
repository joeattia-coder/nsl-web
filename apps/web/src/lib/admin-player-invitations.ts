type InvitationRecord = {
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  createdAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
  revokedAt: Date | null;
};

export type AdminPlayerInviteState =
  | "not-sent"
  | "invite-sent"
  | "accepted"
  | "expired"
  | "revoked";

export type AdminPlayerInviteSummary = {
  inviteState: AdminPlayerInviteState;
  inviteLabel: string;
  inviteMeta: string | null;
  inviteUpdatedAt: string | null;
};

const inviteDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatInviteDate(value: Date) {
  return inviteDateFormatter.format(value);
}

export function summarizeAccountSetupInvitation(
  invitation: InvitationRecord | null | undefined,
  now = new Date()
): AdminPlayerInviteSummary {
  if (!invitation) {
    return {
      inviteState: "not-sent",
      inviteLabel: "Not sent",
      inviteMeta: null,
      inviteUpdatedAt: null,
    };
  }

  if (invitation.status === "ACCEPTED") {
    return {
      inviteState: "accepted",
      inviteLabel: "Accepted",
      inviteMeta: `Accepted ${formatInviteDate(invitation.acceptedAt ?? invitation.createdAt)}`,
      inviteUpdatedAt: (invitation.acceptedAt ?? invitation.createdAt).toISOString(),
    };
  }

  if (invitation.status === "REVOKED") {
    return {
      inviteState: "revoked",
      inviteLabel: "Revoked",
      inviteMeta: `Revoked ${formatInviteDate(invitation.revokedAt ?? invitation.createdAt)}`,
      inviteUpdatedAt: (invitation.revokedAt ?? invitation.createdAt).toISOString(),
    };
  }

  if (invitation.status === "EXPIRED" || invitation.expiresAt <= now) {
    return {
      inviteState: "expired",
      inviteLabel: "Expired",
      inviteMeta: `Expired ${formatInviteDate(invitation.expiresAt)}`,
      inviteUpdatedAt: invitation.expiresAt.toISOString(),
    };
  }

  return {
    inviteState: "invite-sent",
    inviteLabel: "Sent",
    inviteMeta: `Sent ${formatInviteDate(invitation.createdAt)}`,
    inviteUpdatedAt: invitation.createdAt.toISOString(),
  };
}