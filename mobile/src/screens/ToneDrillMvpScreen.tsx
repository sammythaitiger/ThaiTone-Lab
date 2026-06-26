import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  Chip,
  Snackbar,
  Text,
} from "react-native-paper";

import { PitchContourGraph } from "../components/practice/PitchContourGraph";
import { TONE_DRILLS, ToneDrill } from "../data/toneDrills";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { appColors, toneColors } from "../theme/colors";
import { ThaiTone } from "../types/practice";
import { startLivePitchMonitor } from "../utils/livePitch";
import {
  buildExpectedDrillCurve,
  buildNativeFallbackRecordingCurve,
} from "../utils/toneDrillCurves";
import { extractPitchContourPoints } from "../utils/waveform";

type RecordingStage = "idle" | "recording" | "processing" | "ready";
type CurveSource = "none" | "live_pitch" | "pitch" | "fallback";

const TONE_LABELS: Record<ThaiTone, string> = {
  mid: "mid",
  low: "low",
  falling: "falling",
  high: "high",
  rising: "rising",
};

function getMainTone(drill: ToneDrill) {
  return drill.syllables[0]?.tone ?? "mid";
}

export function ToneDrillMvpScreen() {
  const recorder = useAudioRecorder();
  const [selectedDrillIndex, setSelectedDrillIndex] = React.useState(0);
  const [recordingStage, setRecordingStage] =
    React.useState<RecordingStage>("idle");
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const [recordingCurve, setRecordingCurve] = React.useState<number[]>([]);
  const [curveSource, setCurveSource] = React.useState<CurveSource>("none");
  const [errorMessage, setErrorMessage] = React.useState("");
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const stopLivePitchRef = React.useRef<(() => void) | null>(null);
  const selectedDrill = TONE_DRILLS[selectedDrillIndex];
  const expectedCurve = React.useMemo(
    () => buildExpectedDrillCurve(selectedDrill),
    [selectedDrill]
  );
  const displayedRecordingCurve =
    recordingCurve.length > 0 ? recordingCurve : expectedCurve.map(() => 0.5);

  React.useEffect(() => {
    return () => {
      stopTimer();
      stopLivePitchMonitor();
    };
  }, []);

  function stopLivePitchMonitor() {
    if (stopLivePitchRef.current) {
      stopLivePitchRef.current();
      stopLivePitchRef.current = null;
    }
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function resetRecordingState() {
    stopTimer();
    stopLivePitchMonitor();
    setRecordingSeconds(0);
    setRecordingCurve([]);
    setCurveSource("none");
    setRecordingStage("idle");
  }

  function selectDrill(index: number) {
    if (recordingStage === "recording" || recordingStage === "processing") {
      return;
    }

    setSelectedDrillIndex(index);
    resetRecordingState();
  }

  async function handleStartRecording() {
    try {
      if (recorder.microphonePermission !== "granted") {
        const permission = await recorder.requestPermission();
        if (permission !== "granted") {
          setErrorMessage("Microphone permission is required to record.");
          return;
        }
      }

      setErrorMessage("");
      setRecordingCurve([]);
      setCurveSource("none");
      setRecordingSeconds(0);
      await recorder.startRecording();
      stopLivePitchMonitor();
      setRecordingStage("recording");

      try {
        stopLivePitchRef.current = await startLivePitchMonitor(
          expectedCurve.length,
          (points) => {
            setRecordingCurve(points);
            setCurveSource("live_pitch");
          }
        );
      } catch {
        setCurveSource("none");
      }

      timerRef.current = setInterval(() => {
        setRecordingSeconds((seconds) => seconds + 1);
      }, 1000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start recording."
      );
      setRecordingStage("idle");
    }
  }

  async function handleStopRecording() {
    try {
      stopTimer();
      stopLivePitchMonitor();
      setRecordingStage("processing");

      const recording = await recorder.stopRecording();
      const durationMs = recording?.durationMs ?? recordingSeconds * 1000;
      const pitchCurve = recording?.uri
        ? await extractPitchContourPoints(recording.uri, expectedCurve.length)
        : [];

      setRecordingCurve(
        pitchCurve.length > 0
          ? pitchCurve
          : buildNativeFallbackRecordingCurve(selectedDrill, durationMs)
      );
      setCurveSource(pitchCurve.length > 0 ? "pitch" : "fallback");
      setRecordingStage("ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to process recording."
      );
      setRecordingStage("idle");
    }
  }

  async function handleCancelRecording() {
    try {
      stopTimer();
      stopLivePitchMonitor();
      await recorder.cancelRecording();
    } catch {
      // Best effort cleanup for the tiny MVP flow.
    } finally {
      resetRecordingState();
    }
  }

  function handleNextDrill() {
    const nextIndex = (selectedDrillIndex + 1) % TONE_DRILLS.length;
    selectDrill(nextIndex);
  }

  const isBusy = recordingStage === "recording" || recordingStage === "processing";
  const primaryTone = getMainTone(selectedDrill);

  return (
    <View style={styles.screen}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="Thai Tone Drills" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text variant="labelLarge" style={styles.eyebrow}>
            Local MVP · no backend
          </Text>
          <Text variant="displaySmall" style={styles.thaiText}>
            {selectedDrill.thai}
          </Text>
          <Text variant="titleMedium" style={styles.transcription}>
            {selectedDrill.transcription}
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {selectedDrill.description}
          </Text>
        </View>

        <View style={styles.drillSelector}>
          {TONE_DRILLS.map((drill, index) => (
            <Chip
              key={drill.id}
              selected={selectedDrillIndex === index}
              disabled={isBusy}
              onPress={() => selectDrill(index)}
              style={[
                styles.drillChip,
                selectedDrillIndex === index ? styles.drillChipSelected : null,
              ]}
            >
              {drill.title}
            </Chip>
          ))}
        </View>

        <View style={styles.card}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Syllables
          </Text>
          <View style={styles.syllableRow}>
            {selectedDrill.syllables.map((syllable, index) => (
              <View key={`${syllable.thai}-${index}`} style={styles.syllableCard}>
                <Text variant="headlineSmall" style={styles.syllableThai}>
                  {syllable.thai}
                </Text>
                <Text variant="bodySmall" style={styles.syllableTranscription}>
                  {syllable.transcription}
                </Text>
                <View
                  style={[
                    styles.tonePill,
                    { backgroundColor: toneColors[syllable.tone] },
                  ]}
                >
                  <Text variant="labelSmall" style={styles.tonePillText}>
                    {TONE_LABELS[syllable.tone]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.graphHeader}>
            <View>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Curve
              </Text>
              <Text variant="bodySmall" style={styles.mutedText}>
                Reference contour plus your recorded pitch movement.
              </Text>
            </View>
            <Text variant="labelMedium" style={styles.stageLabel}>
              {recordingStage === "recording"
                ? `${recordingSeconds}s`
                : recordingStage === "processing"
                  ? "processing"
                  : recordingStage === "ready"
                    ? "recorded"
                    : "ready"}
            </Text>
          </View>

          <PitchContourGraph
            nativePoints={expectedCurve}
            userPoints={displayedRecordingCurve}
            tone={primaryTone}
            accuracy={recordingStage === "ready" ? 85 : undefined}
            detectedTone={primaryTone}
          />

          <Text variant="bodySmall" style={styles.mutedText}>
            {curveSource === "pitch"
              ? "Your curve is estimated from f0 pitch using browser audio."
              : curveSource === "live_pitch"
                ? "Drawing your f0 pitch live while you speak."
              : curveSource === "fallback"
                ? "Pitch was not available here, so this is a visual fallback."
                : "Record once to draw your pitch curve."}
          </Text>
        </View>

        <View style={styles.controls}>
          {recordingStage === "recording" ? (
            <>
              <Button
                mode="contained"
                icon="stop"
                onPress={() => void handleStopRecording()}
                style={styles.controlButton}
              >
                Stop
              </Button>
              <Button
                mode="outlined"
                icon="close"
                onPress={() => void handleCancelRecording()}
                style={styles.controlButton}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                mode="contained"
                icon="microphone"
                disabled={recordingStage === "processing"}
                loading={recordingStage === "processing"}
                onPress={() => void handleStartRecording()}
                style={styles.controlButton}
              >
                Record
              </Button>
              <Button
                mode="outlined"
                icon="refresh"
                disabled={recordingStage === "processing"}
                onPress={resetRecordingState}
                style={styles.controlButton}
              >
                Try again
              </Button>
              <Button
                mode="text"
                icon="arrow-right"
                disabled={recordingStage === "processing"}
                onPress={handleNextDrill}
                style={styles.controlButton}
              >
                Next drill
              </Button>
            </>
          )}
        </View>
      </ScrollView>

      <Snackbar
        visible={Boolean(errorMessage)}
        onDismiss={() => setErrorMessage("")}
        duration={5000}
      >
        {errorMessage}
      </Snackbar>
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
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: appColors.heroPrimary,
    borderRadius: 8,
    padding: 20,
    gap: 8,
  },
  eyebrow: {
    color: appColors.heroAccent,
    textTransform: "uppercase",
  },
  thaiText: {
    color: appColors.heroText,
    lineHeight: 54,
  },
  transcription: {
    color: appColors.heroTextSoft,
  },
  description: {
    color: appColors.heroTextMuted,
  },
  drillSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  drillChip: {
    backgroundColor: appColors.surface,
  },
  drillChipSelected: {
    backgroundColor: appColors.surfaceVariant,
  },
  card: {
    backgroundColor: appColors.surface,
    borderRadius: 8,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: appColors.outlineVariant,
  },
  sectionTitle: {
    color: appColors.textPrimary,
    fontWeight: "700",
  },
  mutedText: {
    color: appColors.textMuted,
  },
  syllableRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  syllableCard: {
    minWidth: 86,
    backgroundColor: appColors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: appColors.outlineVariant,
  },
  syllableThai: {
    color: appColors.textPrimary,
  },
  syllableTranscription: {
    color: appColors.textSecondary,
  },
  tonePill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tonePillText: {
    color: appColors.onPrimary,
    fontWeight: "700",
  },
  graphHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  stageLabel: {
    color: appColors.infoText,
    backgroundColor: appColors.infoSurface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: "hidden",
  },
  controls: {
    gap: 10,
  },
  controlButton: {
    borderRadius: 8,
  },
});
