import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { Snackbar } from "react-native-paper";

import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { usePracticeHistoryPersistence } from "../hooks/usePracticeHistoryPersistence";
import { usePracticeScreen } from "../hooks/usePracticeScreen";
import { appColors } from "../theme/colors";
import { UIShowcaseScreen } from "./UIShowcaseScreen";
import { ToneWordPracticeScreen } from "./ToneWordPracticeScreen";
import { ToneWordSelectionScreen } from "./ToneWordSelectionScreen";

export function TonePracticeScreen() {
  const {
    practiceWords,
    filteredWords,
    selectedWord,
    analysis,
    currentRoute,
    practiceStage,
    microphonePermission,
    recordingSeconds,
    lastRecordingUri,
    selectedTones,
    syllableFilter,
    searchQuery,
    practiceHistory,
    isLoadingWords,
    isAnalyzing,
    errorMessage,
    initialize,
    setMicrophonePermission,
    setErrorMessage,
    openPractice,
    goToSelection,
    toggleToneFilter,
    clearToneFilters,
    clearPracticeHistory,
    hydratePracticeHistory,
    setSyllableFilter,
    setSearchQuery,
    startRecording,
    tickRecording,
    stopRecording,
    cancelRecording,
    resetPractice,
    clearError,
  } = usePracticeScreen();
  const recorder = useAudioRecorder();
  const [isShowcaseOpen, setIsShowcaseOpen] = React.useState(false);
  const [recordingCountdown, setRecordingCountdown] = React.useState<number | null>(
    null
  );
  const [isStoppingRecording, setIsStoppingRecording] = React.useState(false);
  const countdownTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const hasInlineSelectionError =
    currentRoute === "selection" &&
    !isLoadingWords &&
    Boolean(errorMessage) &&
    practiceWords.length === 0;
  const hasInlinePracticeError =
    currentRoute === "practice" &&
    practiceStage === "before_recording" &&
    Boolean(errorMessage);
  const shouldShowSnackbar =
    Boolean(errorMessage) && !hasInlineSelectionError && !hasInlinePracticeError;

  usePracticeHistoryPersistence({
    history: practiceHistory,
    onHydrate: hydratePracticeHistory,
  });

  React.useEffect(() => {
    setMicrophonePermission(recorder.microphonePermission);
  }, [recorder.microphonePermission, setMicrophonePermission]);

  React.useEffect(() => {
    return () => {
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
      }
    };
  }, []);

  function clearCountdown() {
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    setRecordingCountdown(null);
  }

  async function beginRecording() {
    try {
      await recorder.startRecording();
      startRecording();
      clearCountdown();
    } catch (error) {
      clearCountdown();
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start recording."
      );
    }
  }

  function startCountdown(nextValue: number) {
    setRecordingCountdown(nextValue);

    countdownTimeoutRef.current = setTimeout(() => {
      if (nextValue <= 1) {
        void beginRecording();
        return;
      }

      startCountdown(nextValue - 1);
    }, 850);
  }

  async function handleGrantPermission() {
    const permission = await recorder.requestPermission();
    setMicrophonePermission(permission);
  }

  async function handleStartRecording() {
    try {
      if (microphonePermission !== "granted") {
        const permission = await recorder.requestPermission();
        setMicrophonePermission(permission);
        if (permission !== "granted") {
          return;
        }
      }

      if (recordingCountdown !== null) {
        return;
      }

      clearError();
      startCountdown(3);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start recording."
      );
    }
  }

  async function handleStopRecording() {
    try {
      setIsStoppingRecording(true);
      const recording = await recorder.stopRecording();
      await stopRecording(recording ?? undefined);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to stop recording."
      );
    } finally {
      setIsStoppingRecording(false);
    }
  }

  async function handleCancelRecording() {
    if (recordingCountdown !== null) {
      clearCountdown();
      clearError();
      return;
    }

    try {
      await recorder.cancelRecording();
      cancelRecording();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to cancel recording."
      );
    }
  }

  async function handleBackFromPractice() {
    if (isStoppingRecording || isAnalyzing) {
      return;
    }

    if (recordingCountdown !== null) {
      clearCountdown();
      goToSelection();
      return;
    }

    if (practiceStage === "recording") {
      try {
        await recorder.cancelRecording();
      } catch {
        // Best effort cleanup before leaving the screen.
      } finally {
        cancelRecording();
        goToSelection();
      }
      return;
    }

    goToSelection();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {isShowcaseOpen ? (
        <UIShowcaseScreen onBack={() => setIsShowcaseOpen(false)} />
      ) : currentRoute === "selection" ? (
        <ToneWordSelectionScreen
          wordsCount={practiceWords.length}
          filteredWords={filteredWords}
          selectedTones={selectedTones}
          syllableFilter={syllableFilter}
          searchQuery={searchQuery}
          practiceHistory={practiceHistory}
          isLoading={isLoadingWords}
          errorMessage={errorMessage}
          onToggleTone={toggleToneFilter}
          onSetSyllableFilter={setSyllableFilter}
          onSearchChange={setSearchQuery}
          onOpenPractice={(wordId) => void openPractice(wordId)}
          onClearFilters={() => {
            clearToneFilters();
            setSyllableFilter(null);
            setSearchQuery("");
          }}
          onClearPracticeHistory={clearPracticeHistory}
          onRetry={() => void initialize()}
          onOpenShowcase={__DEV__ ? () => setIsShowcaseOpen(true) : undefined}
        />
      ) : selectedWord ? (
        <ToneWordPracticeScreen
          word={selectedWord}
          analysis={analysis}
          isAnalyzing={isAnalyzing}
          practiceStage={practiceStage}
          microphonePermission={microphonePermission}
          recordingSeconds={recordingSeconds}
          recordingUri={lastRecordingUri}
          recordingCountdown={recordingCountdown}
          isStoppingRecording={isStoppingRecording}
          errorMessage={errorMessage}
          onBack={() => void handleBackFromPractice()}
          disableBack={isStoppingRecording || isAnalyzing}
          onGrantPermission={() => void handleGrantPermission()}
          onStartRecording={() => void handleStartRecording()}
          onTickRecording={tickRecording}
          onStopRecording={() => void handleStopRecording()}
          onCancelRecording={() => void handleCancelRecording()}
          onReset={resetPractice}
          onRetry={() => void handleStartRecording()}
          onOpenShowcase={__DEV__ ? () => setIsShowcaseOpen(true) : undefined}
        />
      ) : null}

      <Snackbar
        visible={shouldShowSnackbar}
        onDismiss={clearError}
        duration={4000}
      >
        {errorMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.background,
  },
});
