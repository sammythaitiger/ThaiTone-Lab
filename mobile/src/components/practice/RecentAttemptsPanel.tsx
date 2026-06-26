import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

import { appColors } from "../../theme/colors";
import { radii, spacing, typography } from "../../theme/tokens";
import { PracticeAttempt } from "../../types/practice";

type RecentAttemptsPanelProps = {
  attempts: PracticeAttempt[];
  onOpenPractice: (wordId: string) => void;
  onClear: () => void;
};

function formatAttemptTime(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "Recent";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function RecentAttemptsPanel({
  attempts,
  onOpenPractice,
  onClear,
}: RecentAttemptsPanelProps) {
  const recentAttempts = attempts.slice(0, 3);

  if (recentAttempts.length === 0) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <View style={styles.headerRow}>
        <View>
          <Text variant="titleMedium" style={styles.title}>
            Recent attempts
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Your last saved practice results on this device.
          </Text>
        </View>
        <Button compact mode="text" onPress={onClear}>
          Clear
        </Button>
      </View>

      <View style={styles.attemptsList}>
        {recentAttempts.map((attempt) => (
          <View key={attempt.id} style={styles.attemptRow}>
            <View style={styles.wordBlock}>
              <Text variant="titleMedium" style={styles.wordThai}>
                {attempt.thai}
              </Text>
              <Text variant="bodySmall" style={styles.wordMeta}>
                {attempt.transcription} · {formatAttemptTime(attempt.createdAt)}
              </Text>
            </View>

            <View style={styles.scoreBlock}>
              <Text variant="headlineSmall" style={styles.scoreText}>
                {attempt.overallAccuracy}%
              </Text>
              <Text variant="labelSmall" style={styles.scoreMeta}>
                {attempt.analysisMode === "pitch" ? "Pitch" : "Estimate"} ·{" "}
                {Math.round(attempt.confidence * 100)}%
              </Text>
            </View>

            <Button
              compact
              mode="contained-tonal"
              onPress={() => onOpenPractice(attempt.wordId)}
            >
              Retry
            </Button>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radii.medium,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.outlineVariant,
    padding: spacing.large,
    gap: spacing.large,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.medium,
  },
  title: {
    color: appColors.textPrimary,
  },
  subtitle: {
    color: appColors.textSecondary,
    marginTop: spacing.micro,
  },
  attemptsList: {
    gap: spacing.small,
  },
  attemptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.medium,
    borderRadius: radii.small,
    backgroundColor: appColors.surfaceAlt,
    padding: spacing.medium,
  },
  wordBlock: {
    flex: 1,
    minWidth: 96,
  },
  wordThai: {
    color: appColors.textPrimary,
  },
  wordMeta: {
    color: appColors.textMuted,
    marginTop: spacing.micro,
  },
  scoreBlock: {
    alignItems: "flex-end",
    minWidth: 82,
  },
  scoreText: {
    color: appColors.primary,
    fontWeight: "800",
  },
  scoreMeta: {
    color: appColors.textMuted,
    letterSpacing: typography.trackingLabel,
    textTransform: "uppercase",
  },
});
