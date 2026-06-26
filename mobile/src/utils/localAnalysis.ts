import { AnalyzeResponse, PracticeWord, ThaiTone } from "../types/practice";

const TONE_ORDER: ThaiTone[] = ["mid", "low", "falling", "high", "rising"];

function getNeighborTone(tone: ThaiTone) {
  const index = TONE_ORDER.indexOf(tone);
  return TONE_ORDER[(index + 1) % TONE_ORDER.length];
}

function getExpectedDurationMs(word: PracticeWord) {
  return Math.max(700, word.syllables.length * 750);
}

function getTimingScore(word: PracticeWord, durationMs: number) {
  const expectedDurationMs = getExpectedDurationMs(word);
  const timingDelta = Math.abs(durationMs - expectedDurationMs);
  return Math.max(58, Math.round(96 - (timingDelta / expectedDurationMs) * 34));
}

export function createLocalFallbackAnalysis(
  word: PracticeWord,
  durationMs: number
): AnalyzeResponse {
  const timingScore = getTimingScore(word, durationMs);
  const syllables = word.syllables.map((syllable, index) => {
    const shouldNudge = timingScore < 76 && index === word.syllables.length - 1;
    const accuracy = Math.max(55, timingScore - index * 4 - (shouldNudge ? 12 : 0));

    return {
      syllable: syllable.thai,
      expected_tone: syllable.tone,
      detected_tone: shouldNudge ? getNeighborTone(syllable.tone) : syllable.tone,
      accuracy,
      feedback: shouldNudge
        ? `Keep the ${syllable.tone} tone clearer on ${syllable.transcription}.`
        : `Good setup for the ${syllable.tone} tone on ${syllable.transcription}.`,
    };
  });
  const overallAccuracy = Math.round(
    syllables.reduce((sum, syllable) => sum + syllable.accuracy, 0) /
      syllables.length
  );

  return {
    word_id: word.id,
    overall_accuracy: overallAccuracy,
    timing_score: timingScore,
    syllables,
    next_step:
      overallAccuracy >= 84
        ? "Repeat once more and focus on keeping the contour steady."
        : "Try again a little slower and exaggerate the target tone shape.",
    analysis_mode: "fallback",
    confidence: 0.35,
    diagnostics: [
      "analysis=fallback",
      "reason=backend_unavailable",
      "source=mobile_local_estimate",
    ],
  };
}
