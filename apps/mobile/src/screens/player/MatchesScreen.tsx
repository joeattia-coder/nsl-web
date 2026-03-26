import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { EmptyState } from "../../components/EmptyState";
import { HeroHeaderCard } from "../../components/HeroHeaderCard";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { MatchCard } from "../../components/MatchCard";
import { FormField } from "../../components/FormField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SectionHeader } from "../../components/SectionHeader";
import { SegmentedControl } from "../../components/SegmentedControl";
import { mobileApi } from "../../lib/mobile-api";
import { useAppSession } from "../../state/app-session";
import { appTheme } from "../../theme";
import type { MainTabParamList, MatchItem } from "../../types/app";

const filters = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
];

export function MatchesScreen() {
  const navigation = useNavigation<any>();
  const { currentUser } = useAppSession();
  const [filter, setFilter] = useState("all");
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<MatchItem | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await mobileApi.getMyMatches();
      setMatches(response.matches);
    } catch (loadError) {
      setMatches([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load matches.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMatches();
  }, []);

  const visibleMatches = useMemo(() => matches.filter((match) => {
    if (filter === "scheduled") {
      return match.status !== "Completed";
    }

    if (filter === "completed") {
      return match.status === "Completed";
    }

    return true;
  }), [filter, matches]);

  const handleReviewApprove = async () => {
    if (!reviewTarget) {
      return;
    }

    setIsSubmittingReview(true);

    try {
      await mobileApi.approveMatchResult(reviewTarget.id);
      setReviewTarget(null);
      setDisputeReason("");
      await loadMatches();
      Alert.alert("Review Result", "The submitted result has been approved.");
    } catch (error) {
      Alert.alert("Review Result", error instanceof Error ? error.message : "Unable to approve this result.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleReviewDispute = async () => {
    if (!reviewTarget || !disputeReason.trim()) {
      Alert.alert("Review Result", "Add a dispute reason before sending the dispute.");
      return;
    }

    setIsSubmittingReview(true);

    try {
      await mobileApi.disputeMatchResult(reviewTarget.id, disputeReason.trim());
      setReviewTarget(null);
      setDisputeReason("");
      await loadMatches();
      Alert.alert("Review Result", "The dispute has been sent to league staff.");
    } catch (error) {
      Alert.alert("Review Result", error instanceof Error ? error.message : "Unable to dispute this result.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <ScreenContainer>
      <HeroHeaderCard
        eyebrow="My Matches"
        title="My Matches"
        subtitle="Premium mobile match cards with fast access to match hub workflows and result submission actions."
        initials={currentUser.initials}
        badge={`${matches.length} live match records`}
      />

      <SegmentedControl items={filters} value={filter} onChange={setFilter} />

      <SectionHeader title="Matchday Feed" subtitle="Upcoming, live, and completed matches tied to your session." />
      {isLoading ? (
        <LoadingSkeleton lines={4} height={18} />
      ) : error ? (
        <EmptyState title="Match feed unavailable" description={error} icon="alert-circle-outline" />
      ) : visibleMatches.length === 0 ? (
        <EmptyState title="No matches yet" description="No fixtures are currently assigned to your player profile." icon="calendar-blank-outline" />
      ) : (
        <View style={styles.stack}>
          {visibleMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onViewHub={() => Alert.alert("Match Hub", `${match.tournamentName}\n${match.stage}\n${match.venue}`)}
              onSubmitResult={() => {
                if (match.pendingMode === "awaitingYourReview") {
                  setReviewTarget(match);
                  setDisputeReason("");
                  return;
                }

                if (match.pendingMode === "submittedByYou") {
                  Alert.alert("Result Pending", "This result is already waiting for opponent approval.");
                  return;
                }

                navigation.navigate("Score" as keyof MainTabParamList, { matchId: match.id });
              }}
            />
          ))}
        </View>
      )}

      {reviewTarget ? (
        <View style={styles.reviewPanel}>
          <Text style={styles.reviewTitle}>Review submitted result</Text>
          <Text style={styles.reviewCopy}>{reviewTarget.homePlayer.name} vs {reviewTarget.awayPlayer.name}</Text>
          <FormField
            label="Dispute Reason"
            value={disputeReason}
            onChangeText={setDisputeReason}
            multiline
            numberOfLines={4}
            style={styles.reviewInput}
          />
          <View style={styles.reviewActions}>
            <PrimaryButton label={isSubmittingReview ? "Approving..." : "Approve"} onPress={handleReviewApprove} disabled={isSubmittingReview} />
            <PrimaryButton label={isSubmittingReview ? "Disputing..." : "Dispute"} variant="ghost" onPress={handleReviewDispute} disabled={isSubmittingReview} />
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  reviewPanel: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceStrong,
    gap: 12,
  },
  reviewTitle: {
    color: appTheme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  reviewCopy: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
  },
  reviewInput: {
    minHeight: 110,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  reviewActions: {
    gap: 12,
  },
});