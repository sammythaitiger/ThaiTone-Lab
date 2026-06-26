import { create } from "zustand";

import {
  SAMPLE_WORDS,
  getSampleWordById,
  getSampleWordSummaries,
} from "../data/sampleWords";
import {
  AnalyzeResponse,
  PracticeAttempt,
  PracticeWord,
  PracticeWordSummary,
  ThaiTone,
} from "../types/practice";
import {
  RecordingUpload,
  analyzeWord,
  analyzeRecording,
  fetchPracticeWord,
  fetchPracticeWords,
} from "../utils/api";
import { createLocalFallbackAnalysis } from "../utils/localAnalysis";

export type PracticeRoute = "selection" | "practice";
export type SyllableFilter = "1" | "2" | "3" | "4+" | null;
export type PracticeStage = "before_recording" | "recording" | "analyzing" | "results";
export type MicrophonePermissionState = "required" | "granted";

function getNetworkErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Backend is unavailable.";
}

type PracticeStore = {
  wordOptions: PracticeWordSummary[];
  practiceWords: PracticeWord[];
  selectedWordId: string;
  selectedWord: PracticeWord | null;
  analysis: AnalyzeResponse | null;
  currentRoute: PracticeRoute;
  practiceStage: PracticeStage;
  microphonePermission: MicrophonePermissionState;
  recordingSeconds: number;
  lastRecordingDurationMs: number;
  lastRecordingUri: string;
  selectedTones: ThaiTone[];
  syllableFilter: SyllableFilter;
  searchQuery: string;
  practiceHistory: PracticeAttempt[];
  isLoadingWords: boolean;
  isLoadingWordDetail: boolean;
  isAnalyzing: boolean;
  errorMessage: string;
  initialize: () => Promise<void>;
  setMicrophonePermission: (permission: MicrophonePermissionState) => void;
  setErrorMessage: (message: string) => void;
  selectWord: (wordId: string) => Promise<void>;
  openPractice: (wordId: string) => Promise<void>;
  goToSelection: () => void;
  toggleToneFilter: (tone: ThaiTone) => void;
  clearToneFilters: () => void;
  clearPracticeHistory: () => void;
  hydratePracticeHistory: (history: PracticeAttempt[]) => void;
  setSyllableFilter: (filter: SyllableFilter) => void;
  setSearchQuery: (query: string) => void;
  runAnalysis: () => Promise<void>;
  startRecording: () => void;
  tickRecording: () => void;
  stopRecording: (recording?: RecordingUpload) => Promise<void>;
  cancelRecording: () => void;
  resetPractice: () => void;
  clearError: () => void;
};

function buildPracticeAttempt(
  word: PracticeWord,
  analysis: AnalyzeResponse
): PracticeAttempt {
  return {
    id: `${word.id}-${Date.now()}`,
    wordId: word.id,
    thai: word.thai,
    transcription: word.transcription,
    overallAccuracy: analysis.overall_accuracy,
    timingScore: analysis.timing_score,
    confidence: analysis.confidence ?? 0.45,
    analysisMode: analysis.analysis_mode ?? "fallback",
    createdAt: new Date().toISOString(),
  };
}

export const usePracticeStore = create<PracticeStore>((set, get) => ({
  wordOptions: [],
  practiceWords: [],
  selectedWordId: "",
  selectedWord: null,
  analysis: null,
  currentRoute: "selection",
  practiceStage: "before_recording",
  microphonePermission: "required",
  recordingSeconds: 0,
  lastRecordingDurationMs: 0,
  lastRecordingUri: "",
  selectedTones: [],
  syllableFilter: null,
  searchQuery: "",
  practiceHistory: [],
  isLoadingWords: false,
  isLoadingWordDetail: false,
  isAnalyzing: false,
  errorMessage: "",

  initialize: async () => {
    try {
      set({ isLoadingWords: true, errorMessage: "" });

      const response = await fetchPracticeWords();
      const practiceWords = await Promise.all(
        response.items.map((item) => fetchPracticeWord(item.id))
      );
      const firstWordId = response.items[0]?.id ?? "";
      const firstWord =
        practiceWords.find((word) => word.id === firstWordId) ?? null;

      set({
        wordOptions: response.items,
        practiceWords,
        selectedWordId: firstWordId,
        selectedWord: firstWord,
        analysis: null,
        practiceStage: "before_recording",
        recordingSeconds: 0,
      });
    } catch (error) {
      const fallbackWords = [...SAMPLE_WORDS];
      const firstWord = fallbackWords[0] ?? null;

      set({
        wordOptions: getSampleWordSummaries(),
        practiceWords: fallbackWords,
        selectedWordId: firstWord?.id ?? "",
        selectedWord: firstWord,
        analysis: null,
        practiceStage: "before_recording",
        recordingSeconds: 0,
        errorMessage: `Using built-in practice library. ${getNetworkErrorMessage(error)}`,
      });
    } finally {
      set({ isLoadingWords: false });
    }
  },

  setMicrophonePermission: (permission) => {
    set({ microphonePermission: permission });
  },

  setErrorMessage: (message) => {
    set({ errorMessage: message });
  },

  selectWord: async (wordId: string) => {
    const cachedWord =
      get().practiceWords.find((word) => word.id === wordId) ??
      getSampleWordById(wordId);

    if (cachedWord) {
      set({
        selectedWordId: wordId,
        selectedWord: cachedWord,
        analysis: null,
        practiceStage: "before_recording",
        recordingSeconds: 0,
        lastRecordingDurationMs: 0,
        lastRecordingUri: "",
        errorMessage: "",
      });
      return;
    }

    try {
      set({
        selectedWordId: wordId,
        isLoadingWordDetail: true,
        errorMessage: "",
      });

      const response = await fetchPracticeWord(wordId);

      set({
        practiceWords: [...get().practiceWords, response],
        selectedWord: response,
        analysis: null,
        practiceStage: "before_recording",
        recordingSeconds: 0,
        lastRecordingDurationMs: 0,
        lastRecordingUri: "",
      });
    } catch (error) {
      const fallbackWord = getSampleWordById(wordId);

      if (fallbackWord) {
        set({
          practiceWords: [...get().practiceWords, fallbackWord],
          selectedWord: fallbackWord,
          analysis: null,
          practiceStage: "before_recording",
          recordingSeconds: 0,
          lastRecordingDurationMs: 0,
          lastRecordingUri: "",
          errorMessage: `Using built-in word data. ${getNetworkErrorMessage(error)}`,
        });
        return;
      }

      set({
        errorMessage:
          error instanceof Error
            ? error.message
            : "Failed to load word details.",
      });
    } finally {
      set({ isLoadingWordDetail: false });
    }
  },

  openPractice: async (wordId: string) => {
    await get().selectWord(wordId);
    set({
      currentRoute: "practice",
      practiceStage: "before_recording",
      recordingSeconds: 0,
      lastRecordingDurationMs: 0,
      lastRecordingUri: "",
    });
  },

  goToSelection: () => {
    set({
      currentRoute: "selection",
      analysis: null,
      isAnalyzing: false,
      practiceStage: "before_recording",
      recordingSeconds: 0,
      lastRecordingDurationMs: 0,
      lastRecordingUri: "",
    });
  },

  toggleToneFilter: (tone) => {
    set((state) => ({
      selectedTones: state.selectedTones.includes(tone)
        ? state.selectedTones.filter((item) => item !== tone)
        : [...state.selectedTones, tone],
    }));
  },

  clearToneFilters: () => {
    set({ selectedTones: [] });
  },

  clearPracticeHistory: () => {
    set({ practiceHistory: [] });
  },

  hydratePracticeHistory: (history) => {
    set({ practiceHistory: history.slice(0, 25) });
  },

  setSyllableFilter: (filter) => {
    set({ syllableFilter: filter });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  runAnalysis: async () => {
    const { selectedWord } = get();

    if (!selectedWord) {
      return;
    }

    try {
      set({
        isAnalyzing: true,
        practiceStage: "analyzing",
        errorMessage: "",
      });

      const response = await analyzeWord(
        selectedWord.id,
        get().lastRecordingDurationMs || selectedWord.syllables.length * 700
      );

      set((state) => ({
        analysis: response,
        practiceStage: "results",
        practiceHistory: [
          buildPracticeAttempt(selectedWord, response),
          ...state.practiceHistory,
        ].slice(0, 25),
      }));
    } catch (error) {
      const fallbackDurationMs =
        get().lastRecordingDurationMs || selectedWord.syllables.length * 700;
      const fallbackResponse = createLocalFallbackAnalysis(
        selectedWord,
        fallbackDurationMs
      );

      set((state) => ({
        analysis: fallbackResponse,
        practiceStage: "results",
        practiceHistory: [
          buildPracticeAttempt(selectedWord, fallbackResponse),
          ...state.practiceHistory,
        ].slice(0, 25),
        errorMessage: `Using guided estimate. ${getNetworkErrorMessage(error)}`,
      }));
    } finally {
      set({ isAnalyzing: false });
    }
  },

  startRecording: () => {
    if (get().microphonePermission !== "granted") {
      set({
        errorMessage: "Microphone permission is required before recording.",
      });
      return;
    }

    set({
      practiceStage: "recording",
      recordingSeconds: 0,
      lastRecordingDurationMs: 0,
      lastRecordingUri: "",
      analysis: null,
      errorMessage: "",
    });
  },

  tickRecording: () => {
    set((state) => ({
      recordingSeconds: state.recordingSeconds + 1,
    }));
  },

  stopRecording: async (recording?: RecordingUpload) => {
    const { selectedWord } = get();

    if (!selectedWord) {
      return;
    }

    set({
      lastRecordingDurationMs: recording?.durationMs ?? get().lastRecordingDurationMs,
      lastRecordingUri: recording?.uri ?? "",
    });

    try {
      set({
        isAnalyzing: true,
        practiceStage: "analyzing",
        errorMessage: "",
      });

      const fallbackDurationMs =
        recording?.durationMs || selectedWord.syllables.length * 700;
      const response = recording?.uri
        ? await analyzeRecording(selectedWord.id, {
            uri: recording.uri,
            durationMs: fallbackDurationMs,
          })
        : await analyzeWord(selectedWord.id, fallbackDurationMs);

      set((state) => ({
        analysis: response,
        practiceStage: "results",
        practiceHistory: [
          buildPracticeAttempt(selectedWord, response),
          ...state.practiceHistory,
        ].slice(0, 25),
      }));
    } catch (error) {
      const fallbackResponse = createLocalFallbackAnalysis(
        selectedWord,
        recording?.durationMs || selectedWord.syllables.length * 700
      );

      set((state) => ({
        analysis: fallbackResponse,
        practiceStage: "results",
        practiceHistory: [
          buildPracticeAttempt(selectedWord, fallbackResponse),
          ...state.practiceHistory,
        ].slice(0, 25),
        errorMessage: `Using guided estimate. ${getNetworkErrorMessage(error)}`,
      }));
    } finally {
      set({ isAnalyzing: false });
    }
  },

  cancelRecording: () => {
    set({
      practiceStage: "before_recording",
      recordingSeconds: 0,
      lastRecordingDurationMs: 0,
      lastRecordingUri: "",
      errorMessage: "",
    });
  },

  resetPractice: () => {
    set({
      analysis: null,
      isAnalyzing: false,
      practiceStage: "before_recording",
      recordingSeconds: 0,
      lastRecordingDurationMs: 0,
      lastRecordingUri: "",
      errorMessage: "",
    });
  },

  clearError: () => {
    set({ errorMessage: "" });
  },
}));
