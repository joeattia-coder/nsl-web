import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "../../components/EmptyState";
import { HeroHeaderCard } from "../../components/HeroHeaderCard";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SectionHeader } from "../../components/SectionHeader";
import { TournamentCard } from "../../components/TournamentCard";
import { mobileApi } from "../../lib/mobile-api";
import { useAppSession } from "../../state/app-session";
import { appTheme } from "../../theme";
import type { MobileTournamentRecord } from "../../types/api";
import type { TournamentSummary } from "../../types/app";

function formatDateRange(startDate: string | null, endDate: string | null) {
  const formatValue = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "TBC";

  if (startDate && endDate) {
    return `${formatValue(startDate)} - ${formatValue(endDate)}`;
  }

  return formatValue(startDate || endDate);
}

function formatTournamentStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function mapTournament(record: MobileTournamentRecord, isRegistered: boolean): TournamentSummary {
  return {
    id: record.id,
    name: record.tournamentName,
    division: record.seasonName || record.participantType,
    venue: record.venueName || "Venue TBC",
    dateLabel: formatDateRange(record.startDate, record.endDate),
    status: formatTournamentStatus(record.status),
    registrationNote: record.registrationDeadline
      ? `Registration deadline ${new Date(record.registrationDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : isRegistered
        ? "You are registered"
        : "Registration status pending",
    shortDescription: record.description?.trim() || `${record.participantType} format${record.snookerFormat ? ` • ${record.snookerFormat.replace("REDS_", "")}-red` : ""}`,
    isRegistered,
    startDate: record.startDate,
    endDate: record.endDate,
    registrationDeadline: record.registrationDeadline,
    participantType: record.participantType,
    snookerFormat: record.snookerFormat,
  };
}

export function TournamentsScreen() {
  const navigation = useNavigation<any>();
  const { currentRole, currentUser } = useAppSession();
  const [registeredTournaments, setRegisteredTournaments] = useState<TournamentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTournaments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const registeredResponse = await mobileApi.getMyTournaments();

        if (!isMounted) {
          return;
        }

        const registered = registeredResponse.tournaments.map((record) => mapTournament(record, true));

        setRegisteredTournaments(registered);
      } catch (loadError) {
        if (isMounted) {
          setRegisteredTournaments([]);
          setError(loadError instanceof Error ? loadError.message : "Unable to load tournaments.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTournaments();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScreenContainer>
      <HeroHeaderCard
        eyebrow={currentRole === "player" ? "My Tournaments" : "Competition Control"}
        title={currentRole === "player" ? "My Tournaments" : "Event Operations"}
        subtitle={currentRole === "player" ? "Registered events, standings, and knockout progress built for mobile." : "Navigate draws, standings, and tournament operations from the same shell."}
        initials={currentUser.initials}
        badge={currentRole === "player" ? `${registeredTournaments.length} live entries` : "Operations mode"}
      />

      <SectionHeader
        title="Registered Tournaments"
        subtitle="Tap into groups, rankings, and live standings for your active entries."
      />

      <View style={styles.stack}>
        {isLoading ? (
          <LoadingSkeleton lines={4} height={18} />
        ) : error ? (
          <EmptyState title="Tournament feed unavailable" description={error} icon="alert-circle-outline" />
        ) : registeredTournaments.length === 0 ? (
          <EmptyState title="No entries yet" description="Your registered tournament cards will appear here once the roster is locked." />
        ) : (
          registeredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} onPress={() => navigation.navigate("TournamentDetail", { tournamentId: tournament.id })} />
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
});