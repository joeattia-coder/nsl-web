import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View, Pressable } from "react-native";

import type { MatchItem } from "../types/app";
import { appTheme } from "../theme";
import { Avatar } from "./Avatar";
import { StatusPill } from "./StatusPill";

function formatMatchDateTime(value: string | null) {
  if (!value) {
    return "Time to be confirmed";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

type MatchCardProps = {
  match: MatchItem;
  onViewHub?: () => void;
  onStartMatch?: () => void;
  onOpenMenu?: () => void;
};

export function MatchCard({ match, onViewHub, onStartMatch, onOpenMenu }: MatchCardProps) {
  const canStartMatch = match.status !== "Completed";

  return (
    <View style={styles.card}>
      <View style={styles.metaRow}>
        <View style={styles.metaCopy}>
          <Text style={styles.tournament}>{match.tournamentName}</Text>
          <Text style={styles.meta}>{match.venue}</Text>
          <Text style={styles.meta}>{match.stage} • {formatMatchDateTime(match.dateTime)}</Text>
        </View>
        <View style={styles.metaActions}>
          <StatusPill status={match.status} />
          <Pressable onPress={onOpenMenu} style={styles.menuButton} accessibilityRole="button" accessibilityLabel={`More actions for ${match.homePlayer.name} versus ${match.awayPlayer.name}`}>
            <MaterialCommunityIcons name="dots-horizontal" size={20} color={appTheme.colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.playersRow}>
        <View style={styles.playerBlock}>
          <Avatar initials={match.homePlayer.initials} photoUrl={match.homePlayer.photoUrl} size={46} />
          <Text style={styles.playerName}>{match.homePlayer.name}</Text>
        </View>

        <View style={styles.scoreWrap}>
          <Text style={styles.score}>{match.scoreLine}</Text>
          <Text style={styles.scoreLabel}>Match score</Text>
        </View>

        <View style={[styles.playerBlock, styles.playerRight]}>
          <Avatar initials={match.awayPlayer.initials} photoUrl={match.awayPlayer.photoUrl} size={46} tone="gold" />
          <Text style={[styles.playerName, styles.playerNameRight]}>{match.awayPlayer.name}</Text>
        </View>
      </View>

      {match.pendingLabel ? <Text style={styles.pendingNote}>{match.pendingLabel}</Text> : null}

      <View style={styles.actionsRow}>
        <Pressable onPress={onViewHub} style={[styles.actionButton, styles.secondaryButton]}>
          <Text style={styles.secondaryButtonText}>View Match Hub</Text>
        </Pressable>
        <Pressable onPress={onStartMatch} disabled={!canStartMatch} style={[styles.actionButton, styles.primaryButton, !canStartMatch && styles.buttonDisabled]}>
          <Text style={styles.primaryButtonText}>Start Match</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: appTheme.spacing.md,
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    ...appTheme.shadows.soft,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  metaActions: {
    alignItems: "flex-end",
    gap: 10,
  },
  metaCopy: {
    flex: 1,
    gap: 3,
  },
  menuButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  tournament: {
    color: appTheme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  meta: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
  },
  playersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playerBlock: {
    flex: 1,
    alignItems: "flex-start",
    gap: 10,
  },
  playerRight: {
    alignItems: "flex-end",
  },
  playerName: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  playerNameRight: {
    textAlign: "right",
  },
  scoreWrap: {
    alignItems: "center",
    gap: 4,
  },
  score: {
    color: appTheme.colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  scoreLabel: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
  },
  pendingNote: {
    color: appTheme.colors.gold,
    fontSize: appTheme.typography.caption,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: appTheme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: appTheme.colors.borderStrong,
    backgroundColor: appTheme.colors.tealSoft,
  },
  primaryButton: {
    backgroundColor: appTheme.colors.gold,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  secondaryButtonText: {
    color: appTheme.colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  primaryButtonText: {
    color: "#17110a",
    fontSize: 12,
    fontWeight: "900",
  },
});