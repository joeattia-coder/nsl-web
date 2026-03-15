import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { PublicFixture } from "@nsl/shared";

import { formatFixtureStatus, formatMatchDateTime, formatScoreLine } from "../lib/format";

type FixtureMatchCardProps = {
  fixture: PublicFixture;
  onPress?: () => void;
  showCompetition?: boolean;
};

type NameParts = {
  first: string;
  last: string;
};

function splitName(name: string): NameParts {
  const trimmed = name.trim();

  if (!trimmed) {
    return { first: "", last: "TBD" };
  }

  const parts = trimmed.split(/\s+/);

  if (parts.length === 1) {
    return { first: "", last: parts[0] };
  }

  return {
    first: parts.slice(0, -1).join(" "),
    last: parts[parts.length - 1],
  };
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "NSL";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function getFlagUri(countryCode: string) {
  const normalized = countryCode.trim().toLowerCase();
  return normalized ? `https://flagcdn.com/w40/${normalized}.png` : null;
}

function PlayerBlock({
  align,
  name,
  photoUrl,
  countryCode,
}: {
  align: "left" | "right";
  name: string;
  photoUrl: string | null;
  countryCode: string;
}) {
  const parts = splitName(name);
  const flagUri = getFlagUri(countryCode);
  const isRight = align === "right";

  return (
    <View style={[styles.playerBlock, isRight && styles.playerBlockRight]}>
      <View style={[styles.playerMediaWrap, isRight && styles.playerMediaWrapRight]}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.playerPhoto} />
        ) : (
          <View style={styles.playerFallback}>
            <Text style={styles.playerFallbackText}>{getInitials(name)}</Text>
          </View>
        )}
      </View>
      <View style={[styles.playerCopy, isRight && styles.playerCopyRight]}>
        {parts.first ? <Text style={[styles.playerFirst, isRight && styles.playerFirstRight]}>{parts.first}</Text> : null}
        <Text style={[styles.playerLast, isRight && styles.playerLastRight]} numberOfLines={1}>
          {parts.last}
        </Text>
        {flagUri ? (
          <View style={[styles.flagRow, isRight && styles.flagRowRight]}>
            <Image source={{ uri: flagUri }} style={styles.flag} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function FixtureMatchCard({ fixture, onPress, showCompetition = false }: FixtureMatchCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.metaTop}>
        <View style={styles.metaDateWrap}>
          <Text style={styles.metaTime}>{fixture.fixtureTime || "TBA"}</Text>
          <Text style={styles.metaDate}>{formatMatchDateTime(fixture.fixtureDateTime, fixture.fixtureTime)}</Text>
        </View>
        <View style={styles.metaCompetitionWrap}>
          {showCompetition ? <Text style={styles.metaCompetition}>{fixture.fixtureGroupDesc}</Text> : null}
          <Text style={styles.metaRound}>{fixture.roundDesc || formatFixtureStatus(fixture)}</Text>
        </View>
      </View>

      <View style={styles.vsRow}>
        <PlayerBlock
          align="left"
          name={fixture.homeTeamName}
          photoUrl={fixture.homePlayerPhotoUrl}
          countryCode={fixture.homeCountryCode}
        />

        <View style={styles.centerPillWrap}>
          <View style={styles.centerPill}>
            <Text style={styles.centerPillText}>{formatScoreLine(fixture)}</Text>
          </View>
          <Text style={styles.centerStatus}>{formatFixtureStatus(fixture)}</Text>
        </View>

        <PlayerBlock
          align="right"
          name={fixture.roadTeamName}
          photoUrl={fixture.roadPlayerPhotoUrl}
          countryCode={fixture.roadCountryCode}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0b0b0b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    gap: 16,
  },
  metaTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  metaDateWrap: {
    flex: 1,
  },
  metaTime: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "800",
  },
  metaDate: {
    color: "#9e9e9e",
    fontSize: 12,
    marginTop: 2,
  },
  metaCompetitionWrap: {
    flex: 1,
    alignItems: "flex-end",
  },
  metaCompetition: {
    color: "#cfcfcf",
    fontSize: 12,
    textAlign: "right",
  },
  metaRound: {
    color: "#8aa0b6",
    fontSize: 12,
    marginTop: 2,
    textAlign: "right",
  },
  vsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playerBlock: {
    flex: 1,
    gap: 10,
  },
  playerBlockRight: {
    alignItems: "flex-end",
  },
  playerMediaWrap: {
    alignItems: "flex-start",
  },
  playerMediaWrapRight: {
    alignItems: "flex-end",
  },
  playerPhoto: {
    width: 76,
    height: 92,
    resizeMode: "cover",
    backgroundColor: "#1f2937",
  },
  playerFallback: {
    width: 76,
    height: 92,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  playerFallbackText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  playerCopy: {
    alignItems: "flex-start",
    gap: 2,
  },
  playerCopyRight: {
    alignItems: "flex-end",
  },
  playerFirst: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
  },
  playerFirstRight: {
    textAlign: "right",
  },
  playerLast: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    maxWidth: 132,
  },
  playerLastRight: {
    textAlign: "right",
  },
  flagRow: {
    marginTop: 6,
  },
  flagRowRight: {
    alignItems: "flex-end",
  },
  flag: {
    width: 22,
    height: 15,
  },
  centerPillWrap: {
    alignItems: "center",
    gap: 10,
  },
  centerPill: {
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  centerPillText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  centerStatus: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
});