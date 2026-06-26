import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, ProgressBar, Surface, Text } from "react-native-paper";

import { useMockPlayback } from "../../hooks/useMockPlayback";
import { useRecordingPlayback } from "../../hooks/useRecordingPlayback";
import { AnalyzeResponse } from "../../types/practice";
import { appColors } from "../../theme/colors";
import { elevation, radii, spacing, typography } from "../../theme/tokens";
import { buildCoachingSignal } from "../../utils/coaching";
import { getNativeContourPoints, getUserContourPoints } from "../../utils/contours";
import { PitchContourGraph } from "./PitchContourGraph";
import { ToneChip } from "./ToneChip";

type PracticeResultsPanelProps = {
  analysis: AnalyzeResponse;
  recordingUri?: string;
  onTryAgain: () => void;
  onBackToWords: () => void;
};

function getAccuracyTier(accuracy: number) {
  if (accuracy >= 85) {
    return "strong";
  }

  if (accuracy >= 70) {
    return "developing";
  }

  return "weak";
}

function getAccuracyTone(accuracy: number) {
  if (accuracy >= 85) {
    return {
      cardBackground: appColors.successSurface,
      cardBorder: "#CDE8CF",
      badgeBackground: appColors.successText,
      badgeText: appColors.onSecondary,
      eyebrowText: appColors.successText,
      feedbackBackground: "#F6FBF6",
      feedbackText: "#2C5F32",
      label: "Strong",
    };
  }

  if (accuracy >= 70) {
    return {
      cardBackground: appColors.warningSurface,
      cardBorder: "#F6D7A8",
      badgeBackground: appColors.warningText,
      badgeText: appColors.onPrimary,
      eyebrowText: appColors.warningText,
      feedbackBackground: "#FFF8ED",
      feedbackText: "#925F16",
      label: "Developing",
    };
  }

  return {
    cardBackground: appColors.dangerSurface,
    cardBorder: "#F3C7C3",
    badgeBackground: appColors.dangerText,
    badgeText: appColors.onPrimary,
    eyebrowText: appColors.dangerText,
    feedbackBackground: "#FFF5F4",
    feedbackText: "#8A2D25",
    label: "Needs work",
  };
}

function getGraphCue(
  expectedTone: AnalyzeResponse["syllables"][number]["expected_tone"],
  detectedTone: AnalyzeResponse["syllables"][number]["detected_tone"]
) {
  if (expectedTone === detectedTone) {
    return "The two curves should stay close together, so focus on keeping that contour stable on the next pass.";
  }

  if (expectedTone === "falling" && detectedTone === "high") {
    return "On the graph, the native line should fall earlier while your line is holding too high for too long.";
  }

  if (expectedTone === "mid" && detectedTone === "rising") {
    return "On the graph, the native line stays flatter while your line lifts at the end.";
  }

  if (expectedTone === "low" && detectedTone === "high") {
    return "On the graph, the target line sits lower while your line peaks too early.";
  }

  return "Use the graph to compare where the native contour changes direction and try to match that shape more closely.";
}

export function PracticeResultsPanel({
  analysis,
  recordingUri = "",
  onTryAgain,
  onBackToWords,
}: PracticeResultsPanelProps) {
  const playback = useMockPlayback({
    durationMs: Math.max(analysis.syllables.length * 900, 2000),
  });
  const userPlayback = useRecordingPlayback(recordingUri);
  const weakestSyllable = analysis.syllables.reduce((lowest, current) => {
    return current.accuracy < lowest.accuracy ? current : lowest;
  }, analysis.syllables[0]);
  const weakCount = analysis.syllables.filter(
    (syllable) => getAccuracyTier(syllable.accuracy) === "weak"
  ).length;
  const coachingSignal = buildCoachingSignal(analysis);
  const coachingReason = weakestSyllable?.feedback ?? coachingSignal.whyCopy;
  const coachingGraphCue = weakestSyllable
    ? getGraphCue(weakestSyllable.expected_tone, weakestSyllable.detected_tone)
    : coachingSignal.graphCopy;
  const confidencePercent = Math.round((analysis.confidence ?? 0.45) * 100);
  const analysisModeLabel =
    analysis.analysis_mode === "pitch" ? "Pitch analysis" : "Guided estimate";

  return (
    <View style={styles.container}>
      <Card style={styles.summaryCard}>
        <Card.Content style={styles.summaryContent}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryBadge}>
              <Text variant="labelMedium" style={styles.summaryBadgeText}>
                Results
              </Text>
            </View>
            <Text variant="labelMedium" style={styles.summaryMeta}>
              {analysis.syllables.length} checks
            </Text>
          </View>

          <View style={styles.summaryHeroRow}>
            <View style={styles.summaryScoreBlock}>
              <Text variant="displaySmall" style={styles.summaryScore}>
                {analysis.overall_accuracy}%
              </Text>
              <Text variant="bodyLarge" style={styles.summaryCopy}>
                overall accuracy
              </Text>
            </View>

            <View style={styles.summaryInsightCard}>
              <Text variant="labelSmall" style={styles.summaryInsightLabel}>
                Main focus
              </Text>
              <Text variant="titleMedium" style={styles.summaryInsightValue}>
                {weakestSyllable?.syllable ?? "--"}
              </Text>
              <Text variant="bodySmall" style={styles.summaryInsightCopy}>
                weakest syllable right now
              </Text>
            </View>
          </View>

          <Text variant="headlineSmall" style={styles.summaryTitle}>
            Your result is ready.
          </Text>
          <Text variant="bodyLarge" style={styles.summaryCopy}>
            You can understand the score fast: timing is {analysis.timing_score}%,{" "}
            and the next coaching target is {weakestSyllable?.syllable ?? "the weakest syllable"}.
          </Text>
          <ProgressBar
            progress={analysis.overall_accuracy / 100}
            style={styles.progress}
          />

          <View style={styles.summaryNote}>
            <Text variant="bodyMedium" style={styles.summaryNoteText}>
              Focus {coachingSignal.focusSyllable}. {coachingSignal.nextAction}
            </Text>
          </View>

          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatCard}>
              <Text variant="labelSmall" style={styles.summaryStatLabel}>
                Mode
              </Text>
              <Text variant="titleMedium" style={styles.summaryStatValue}>
                {analysisModeLabel}
              </Text>
            </View>
            <View style={styles.summaryStatCard}>
              <Text variant="labelSmall" style={styles.summaryStatLabel}>
                Timing
              </Text>
              <Text variant="headlineSmall" style={styles.summaryStatValue}>
                {analysis.timing_score}%
              </Text>
            </View>
            <View style={styles.summaryStatCard}>
              <Text variant="labelSmall" style={styles.summaryStatLabel}>
                Confidence
              </Text>
              <Text variant="headlineSmall" style={styles.summaryStatValue}>
                {confidencePercent}%
              </Text>
            </View>
            <View style={styles.summaryStatCard}>
              <Text variant="labelSmall" style={styles.summaryStatLabel}>
                Needs work
              </Text>
              <Text variant="headlineSmall" style={styles.summaryStatValue}>
                {weakCount}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.compareCard}>
        <Card.Content style={styles.compareContent}>
          <View style={styles.compareTopRow}>
            <View style={styles.compareHeaderBlock}>
              <Text variant="labelMedium" style={styles.compareLabel}>
                Audio comparison
              </Text>
              <Text variant="headlineSmall" style={styles.compareTitle}>
                Listen to the native sample, then your attempt
              </Text>
              <Text variant="bodyLarge" style={styles.compareCopy}>
                Keep both recordings in one place so the comparison stays fast
                and easy to explain.
              </Text>
            </View>
            <View style={styles.compareFocusPill}>
              <Text variant="labelMedium" style={styles.compareFocusText}>
                Focus {coachingSignal.focusSyllable}
              </Text>
            </View>
          </View>

          <View style={styles.audioRows}>
            <View style={styles.audioRow}>
              <View style={styles.audioRowCopy}>
                <Text variant="titleMedium" style={styles.audioRowTitle}>
                  Native reference
                </Text>
                <Text variant="bodySmall" style={styles.audioRowText}>
                  Play the target contour first.
                </Text>
              </View>
              <Button
                mode="contained"
                icon={playback.getStatus("native-model") === "playing" ? "pause-circle" : "play-circle"}
                onPress={() => playback.toggle("native-model")}
                loading={playback.getStatus("native-model") === "loading"}
                disabled={playback.getStatus("user-attempt") === "loading"}
                contentStyle={styles.audioButtonContent}
              >
                {playback.getStatus("native-model") === "playing" ? "Pause" : "Play native"}
              </Button>
            </View>

            <View style={styles.audioRow}>
              <View style={styles.audioRowCopy}>
                <Text variant="titleMedium" style={styles.audioRowTitle}>
                  Your attempt
                </Text>
                <Text variant="bodySmall" style={styles.audioRowText}>
                  Then replay your recording and compare the shape.
                </Text>
              </View>
              <Button
                mode="contained"
                icon={userPlayback.status === "playing" ? "pause-circle" : "play-circle"}
                onPress={userPlayback.toggle}
                loading={userPlayback.status === "loading"}
                disabled={
                  !recordingUri ||
                  playback.getStatus("native-model") === "loading" ||
                  userPlayback.status === "loading"
                }
                contentStyle={styles.audioButtonContent}
              >
                {!recordingUri
                  ? "No recording"
                  : userPlayback.status === "playing"
                    ? "Pause"
                    : "Play yours"}
              </Button>
            </View>
          </View>

          <View style={styles.compareHint}>
            <Text variant="bodySmall" style={styles.compareHintText}>
              Step 1: hear the native model. Step 2: listen to your own take.
              Step 3: compare both with the graph below.
            </Text>
            {recordingUri ? (
              <ProgressBar
                progress={userPlayback.progress}
                style={styles.userPlaybackProgress}
              />
            ) : null}
          </View>
        </Card.Content>
      </Card>

      <View style={styles.sectionHeader}>
        <View>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Syllable breakdown
          </Text>
          <Text variant="bodySmall" style={styles.sectionCopy}>
            Each syllable shows the graph first, then the score and feedback.
          </Text>
        </View>
      </View>

      <View style={styles.resultsList}>
        {analysis.syllables.map((result) => (
          (() => {
            const tone = getAccuracyTone(result.accuracy);
            const isFocus = weakestSyllable?.syllable === result.syllable;
            const graphCue = getGraphCue(result.expected_tone, result.detected_tone);

            return (
              <Surface
                key={result.syllable}
                style={[
                  styles.resultCard,
                  isFocus ? styles.resultCardFocus : null,
                  {
                    backgroundColor: tone.cardBackground,
                    borderColor: tone.cardBorder,
                  },
                ]}
              >
                <View style={styles.resultHeader}>
                  <View style={styles.resultTitleGroup}>
                    <Text variant="labelSmall" style={[styles.resultEyebrow, { color: tone.eyebrowText }]}>
                      {tone.label}
                    </Text>
                    <Text variant="titleLarge" style={styles.resultTitle}>
                      {result.syllable}
                    </Text>
                    <Text variant="bodySmall" style={styles.resultSubtitle}>
                      {isFocus ? "Primary coaching target" : "Tone contour comparison"}
                    </Text>
                  </View>
                  <View style={styles.resultBadgeColumn}>
                    {isFocus ? (
                      <View style={styles.focusBadge}>
                        <Text variant="labelSmall" style={styles.focusBadgeText}>
                          Focus now
                        </Text>
                      </View>
                    ) : null}
                    <View style={[styles.badge, { backgroundColor: tone.badgeBackground }]}>
                      <Text
                        variant="labelMedium"
                        style={[styles.badgeText, { color: tone.badgeText }]}
                      >
                        {result.accuracy}%
                      </Text>
                    </View>
                  </View>
                </View>

                <PitchContourGraph
                  userPoints={
                    result.user_pitch_points ??
                    getUserContourPoints(
                      result.expected_tone,
                      result.detected_tone,
                      result.accuracy
                    )
                  }
                  nativePoints={
                    result.native_pitch_points ??
                    getNativeContourPoints(result.expected_tone)
                  }
                  tone={result.expected_tone}
                  accuracy={result.accuracy}
                  detectedTone={result.detected_tone}
                />

                <View style={styles.graphCuePanel}>
                  <Text variant="labelSmall" style={styles.graphCueLabel}>
                    Graph reading
                  </Text>
                  <Text variant="bodySmall" style={styles.graphCueText}>
                    {graphCue}
                  </Text>
                </View>

                <View style={styles.compareRow}>
                  <View style={styles.compareGroup}>
                    <Text variant="labelSmall" style={styles.syllableCompareLabel}>
                      Expected
                    </Text>
                    <ToneChip tone={result.expected_tone} compact />
                  </View>
                  <View style={styles.compareGroup}>
                    <Text variant="labelSmall" style={styles.syllableCompareLabel}>
                      Detected
                    </Text>
                    <ToneChip tone={result.detected_tone} compact />
                  </View>
                  <View style={styles.compareGroup}>
                    <Text variant="labelSmall" style={styles.syllableCompareLabel}>
                      Match
                    </Text>
                    <View style={styles.matchPill}>
                      <Text variant="labelSmall" style={styles.matchPillText}>
                        {result.expected_tone === result.detected_tone ? "Matched" : "Different"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.feedbackPanel,
                    { backgroundColor: tone.feedbackBackground },
                  ]}
                >
                  <Text
                    variant="bodySmall"
                    style={[styles.feedbackText, { color: tone.feedbackText }]}
                  >
                    {result.feedback}
                  </Text>
                </View>
              </Surface>
            );
          })()
        ))}
      </View>

      <View style={styles.actions}>
        <Button mode="contained" onPress={onTryAgain} contentStyle={styles.actionButton}>
          Try again
        </Button>
        <Button mode="outlined" onPress={onBackToWords} contentStyle={styles.actionButton}>
          Back to word list
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.large,
  },
  summaryCard: {
    borderRadius: radii.large,
    backgroundColor: appColors.heroPrimary,
  },
  summaryContent: {
    gap: spacing.large,
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.medium,
  },
  summaryBadge: {
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  summaryBadgeText: {
    color: appColors.heroText,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: typography.trackingLabel,
  },
  summaryMeta: {
    color: appColors.heroAccent,
  },
  summaryHeroRow: {
    flexDirection: "row",
    gap: spacing.large,
    alignItems: "stretch",
  },
  summaryScoreBlock: {
    flex: 1.1,
    gap: 2,
  },
  summaryScore: {
    color: appColors.heroText,
    fontWeight: "800",
    lineHeight: 56,
  },
  summaryInsightCard: {
    flex: 0.9,
    borderRadius: radii.small,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: spacing.large,
    gap: spacing.xsmall,
  },
  summaryInsightLabel: {
    color: appColors.heroAccent,
    textTransform: "uppercase",
    letterSpacing: typography.trackingLabel,
  },
  summaryInsightValue: {
    color: appColors.heroText,
  },
  summaryInsightCopy: {
    color: appColors.heroTextMuted,
  },
  summaryTitle: {
    color: appColors.heroText,
  },
  summaryCopy: {
    color: appColors.heroTextSoft,
    lineHeight: typography.lineHeightBodyLarge,
  },
  summaryStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.small,
  },
  summaryNote: {
    borderRadius: radii.small,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
  },
  summaryNoteText: {
    color: appColors.heroTextSoft,
    lineHeight: typography.lineHeightBody,
  },
  summaryStatCard: {
    flex: 1,
    minWidth: 92,
    borderRadius: radii.small,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: spacing.large,
    gap: spacing.micro,
  },
  summaryStatLabel: {
    color: appColors.heroAccent,
    textTransform: "uppercase",
    letterSpacing: typography.trackingLabel,
  },
  summaryStatValue: {
    color: appColors.heroText,
    fontWeight: "600",
  },
  progress: {
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  sectionHeader: {
    gap: spacing.micro,
  },
  sectionTitle: {
    color: appColors.textPrimary,
  },
  sectionCopy: {
    color: appColors.textSecondary,
    lineHeight: typography.lineHeightBody,
  },
  resultsList: {
    gap: spacing.large,
  },
  resultCard: {
    borderRadius: radii.medium,
    padding: 18,
    gap: spacing.large,
    borderWidth: 1,
  },
  resultCardFocus: {
    borderWidth: 2,
    ...elevation.focusCard,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.medium,
    alignItems: "flex-start",
  },
  resultTitleGroup: {
    flex: 1,
    gap: spacing.micro,
  },
  resultBadgeColumn: {
    alignItems: "flex-end",
    gap: spacing.small,
  },
  resultEyebrow: {
    textTransform: "uppercase",
    letterSpacing: typography.trackingLabel,
    fontWeight: "700",
  },
  resultTitle: {
    color: appColors.textPrimary,
  },
  resultSubtitle: {
    color: appColors.textMuted,
  },
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  badgeText: {
    fontWeight: "700",
  },
  focusBadge: {
    borderRadius: radii.pill,
    backgroundColor: appColors.heroPrimary,
    paddingHorizontal: 10,
    paddingVertical: spacing.xsmall,
  },
  focusBadgeText: {
    color: appColors.heroText,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: typography.trackingLabel,
  },
  compareRow: {
    flexDirection: "row",
    gap: spacing.large,
    flexWrap: "wrap",
  },
  compareGroup: {
    gap: spacing.xsmall,
  },
  syllableCompareLabel: {
    color: appColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: typography.trackingLabel,
  },
  matchPill: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    backgroundColor: appColors.surface,
    paddingHorizontal: 10,
    paddingVertical: spacing.xsmall,
    borderWidth: 1,
    borderColor: appColors.outlineVariant,
  },
  matchPillText: {
    color: appColors.textSecondary,
    fontWeight: "700",
  },
  feedbackPanel: {
    borderRadius: radii.small,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  graphCuePanel: {
    borderRadius: radii.small,
    backgroundColor: appColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: appColors.outlineVariant,
    gap: spacing.xsmall,
  },
  graphCueLabel: {
    color: appColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: typography.trackingLabel,
  },
  graphCueText: {
    color: appColors.textSecondary,
    lineHeight: typography.lineHeightBody,
  },
  feedbackText: {
    lineHeight: typography.lineHeightBody,
  },
  compareCard: {
    borderRadius: radii.medium,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.outlineVariant,
  },
  compareContent: {
    gap: spacing.large,
  },
  compareTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.medium,
  },
  compareHeaderBlock: {
    flex: 1,
    gap: spacing.xsmall,
  },
  compareLabel: {
    color: appColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: typography.trackingLabel,
  },
  compareTitle: {
    color: appColors.textPrimary,
  },
  compareCopy: {
    color: appColors.textSecondary,
    lineHeight: typography.lineHeightBody,
  },
  compareFocusPill: {
    borderRadius: radii.pill,
    backgroundColor: appColors.infoSurface,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  compareFocusText: {
    color: appColors.infoText,
    fontWeight: "700",
  },
  audioRows: {
    gap: spacing.small,
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.medium,
    flexWrap: "wrap",
    borderRadius: radii.small,
    backgroundColor: appColors.surfaceAlt,
    padding: spacing.large,
  },
  audioRowCopy: {
    flex: 1,
    gap: spacing.xsmall,
    minWidth: 180,
  },
  audioRowTitle: {
    color: appColors.textPrimary,
  },
  audioRowText: {
    color: appColors.textSecondary,
  },
  audioButtonContent: {
    minHeight: 48,
  },
  compareHint: {
    borderRadius: radii.small,
    backgroundColor: appColors.infoSurface,
    padding: spacing.large,
    gap: spacing.small,
  },
  compareHintText: {
    color: appColors.infoText,
    lineHeight: typography.lineHeightBody,
  },
  userPlaybackProgress: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: "rgba(30, 103, 115, 0.18)",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.small,
    marginTop: 2,
  },
  actionButton: {
    minHeight: 48,
  },
});
