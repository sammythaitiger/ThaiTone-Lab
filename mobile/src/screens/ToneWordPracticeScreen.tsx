import React, { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Text } from "react-native-paper";

import { AnimatedEntrance } from "../components/practice/AnimatedEntrance";
import { BottomTabBar } from "../components/practice/BottomTabBar";
import { PracticeAnalyzingState } from "../components/practice/PracticeAnalyzingState";
import { PracticeCountdownState } from "../components/practice/PracticeCountdownState";
import { PracticePermissionState } from "../components/practice/PracticePermissionState";
import { PracticeRecordingState } from "../components/practice/PracticeRecordingState";
import { PracticeReferencePanel } from "../components/practice/PracticeReferencePanel";
import { PracticeResultsPanel } from "../components/practice/PracticeResultsPanel";
import { PracticeStateCard } from "../components/practice/PracticeStateCard";
import { useMotionTransition } from "../hooks/useMotionTransition";
import { appColors } from "../theme/colors";
import { AnalyzeResponse, PracticeWord } from "../types/practice";
import { MicrophonePermissionState, PracticeStage } from "../store/practiceStore";

type ToneWordPracticeScreenProps = {
  word: PracticeWord;
  analysis: AnalyzeResponse | null;
  isAnalyzing: boolean;
  practiceStage: PracticeStage;
  microphonePermission: MicrophonePermissionState;
  recordingSeconds: number;
  recordingUri: string;
  recordingCountdown: number | null;
  isStoppingRecording: boolean;
  errorMessage: string;
  onBack: () => void;
  onGrantPermission: () => void;
  onStartRecording: () => void;
  onTickRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  onReset: () => void;
  onRetry: () => void;
  onOpenShowcase?: () => void;
  disableBack?: boolean;
};

export function ToneWordPracticeScreen({
  word,
  analysis,
  isAnalyzing,
  practiceStage,
  microphonePermission,
  recordingSeconds,
  recordingUri,
  recordingCountdown,
  isStoppingRecording,
  errorMessage,
  onBack,
  onGrantPermission,
  onStartRecording,
  onTickRecording,
  onStopRecording,
  onCancelRecording,
  onReset,
  onRetry,
  onOpenShowcase,
  disableBack = false,
}: ToneWordPracticeScreenProps) {
  const headerTitle =
    recordingCountdown !== null
      ? "Get ready..."
      : isStoppingRecording
        ? "Preparing analysis..."
        : practiceStage === "recording"
      ? "Recording..."
      : isAnalyzing
        ? "Analyzing..."
        : analysis
          ? "Results"
          : word.thai;
  const hasPracticeError = Boolean(errorMessage) && practiceStage === "before_recording";
  const activeSyllableIndex =
    word.syllables.length > 0
      ? Math.min(recordingSeconds % word.syllables.length, word.syllables.length - 1)
      : 0;
  const canOpenShowcase =
    Boolean(onOpenShowcase) &&
    practiceStage === "before_recording" &&
    recordingCountdown === null &&
    !isStoppingRecording &&
    !isAnalyzing;
  const motionSignature = [
    practiceStage,
    String(isAnalyzing),
    String(isStoppingRecording),
    String(recordingCountdown),
    String(Boolean(analysis)),
    microphonePermission,
    String(hasPracticeError),
  ].join(":");

  useMotionTransition(motionSignature, "emphasis");

  useEffect(() => {
    if (practiceStage !== "recording") {
      return;
    }

    const timer = setInterval(() => {
      onTickRecording();
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [onTickRecording, practiceStage]);

  return (
    <View style={styles.screen}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={onBack} disabled={disableBack} />
        <Appbar.Content title={headerTitle} subtitle="Practice" />
        {analysis ? (
          <View style={styles.scoreBadge}>
            <Text variant="labelMedium" style={styles.scoreText}>
              {analysis.overall_accuracy}%
            </Text>
          </View>
        ) : (
          <View style={styles.headerActions}>
            {canOpenShowcase && onOpenShowcase ? (
              <Appbar.Action
                icon="view-dashboard-outline"
                onPress={onOpenShowcase}
                containerColor={appColors.surfaceVariant}
              />
            ) : null}
          </View>
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {!isAnalyzing && !isStoppingRecording && recordingCountdown === null ? (
          <AnimatedEntrance delay={40} variant="hero">
          <View style={styles.modeBanner}>
            <Text variant="labelMedium" style={styles.modeBannerLabel}>
              {practiceStage === "recording" ? "Recording mode" : "Word practice"}
            </Text>
            <Text variant="bodyMedium" style={styles.modeBannerCopy}>
              {practiceStage === "recording"
                ? "Keep speaking until the full word feels natural, then stop to run analysis."
                : "Listen to the reference, review the cues, and begin recording only when the word feels clear."}
            </Text>
          </View>
          </AnimatedEntrance>
        ) : null}

        {recordingCountdown !== null ? (
          <AnimatedEntrance delay={90} variant="hero">
            <PracticeCountdownState
              word={word}
              countdownValue={recordingCountdown}
              onCancel={onCancelRecording}
            />
          </AnimatedEntrance>
        ) : null}

        {practiceStage === "before_recording" &&
        recordingCountdown === null &&
        microphonePermission === "required" ? (
          <AnimatedEntrance delay={110} variant="section">
          <PracticePermissionState onGrant={onGrantPermission} onBack={onBack} />
          </AnimatedEntrance>
        ) : null}

        {practiceStage === "before_recording" &&
        recordingCountdown === null &&
        microphonePermission === "granted" ? (
          <AnimatedEntrance delay={110} variant="section">
          <>
            <PracticeReferencePanel word={word} onAnalyze={onStartRecording} />
            <Text variant="bodyMedium" style={styles.backLink} onPress={onBack}>
              Back to word list
            </Text>
          </>
          </AnimatedEntrance>
        ) : null}

        {practiceStage === "recording" ? (
          <AnimatedEntrance delay={90} variant="hero">
          <PracticeRecordingState
            word={word}
            recordingSeconds={recordingSeconds}
            activeSyllableIndex={activeSyllableIndex}
            onStop={onStopRecording}
            onCancel={onCancelRecording}
          />
          </AnimatedEntrance>
        ) : null}

        {isStoppingRecording ? (
          <AnimatedEntrance delay={90} variant="hero">
            <PracticeAnalyzingState phase="uploading" />
          </AnimatedEntrance>
        ) : null}

        {isAnalyzing ? (
          <AnimatedEntrance delay={90} variant="hero">
            <PracticeAnalyzingState />
          </AnimatedEntrance>
        ) : null}

        {hasPracticeError ? (
          <AnimatedEntrance delay={100} variant="section">
            <PracticeStateCard
              eyebrow="Analysis error"
              title="Analysis failed"
              description={errorMessage}
              tone="warning"
              primaryActionLabel="Try recording again"
              onPrimaryAction={onRetry}
              secondaryActionLabel="Back to word list"
              onSecondaryAction={onBack}
            />
          </AnimatedEntrance>
        ) : null}

        {analysis ? (
          <AnimatedEntrance delay={90} variant="hero">
          <PracticeResultsPanel
            analysis={analysis}
            recordingUri={recordingUri}
            onTryAgain={onReset}
            onBackToWords={onBack}
          />
          </AnimatedEntrance>
        ) : null}
      </ScrollView>

      {practiceStage !== "recording" &&
      !isAnalyzing &&
      !isStoppingRecording &&
      recordingCountdown === null ? (
        <BottomTabBar />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  appbar: {
    backgroundColor: appColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: appColors.outlineVariant,
  },
  scoreBadge: {
    marginRight: 16,
    borderRadius: 999,
    backgroundColor: appColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  scoreText: {
    color: appColors.onPrimary,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 20,
  },
  modeBanner: {
    borderRadius: 24,
    backgroundColor: appColors.surface,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: appColors.outlineVariant,
  },
  modeBannerLabel: {
    color: appColors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  modeBannerCopy: {
    color: appColors.textSecondary,
    lineHeight: 21,
  },
  backLink: {
    color: appColors.primary,
    textAlign: "center",
    marginTop: 4,
  },
});
