import { ToneDrill } from "../data/toneDrills";
import { ThaiTone } from "../types/practice";

const POINTS_PER_SYLLABLE = 16;

function buildToneSegment(tone: ThaiTone) {
  return Array.from({ length: POINTS_PER_SYLLABLE }, (_, index) => {
    const progress = index / (POINTS_PER_SYLLABLE - 1);

    if (tone === "mid") {
      return 0.55;
    }

    if (tone === "low") {
      return 0.45 - progress * 0.2;
    }

    if (tone === "falling") {
      return 0.82 - progress * 0.55;
    }

    if (tone === "high") {
      return 0.62 + progress * 0.22;
    }

    return progress < 0.45
      ? 0.5 - progress * 0.34
      : 0.35 + ((progress - 0.45) / 0.55) * 0.48;
  });
}

export function buildExpectedDrillCurve(drill: ToneDrill) {
  return drill.syllables.flatMap((syllable, syllableIndex) => {
    const segment = buildToneSegment(syllable.tone);

    if (syllableIndex === drill.syllables.length - 1) {
      return segment;
    }

    return [...segment, 0.5, 0.5];
  });
}

export function buildNativeFallbackRecordingCurve(
  drill: ToneDrill,
  durationMs: number
) {
  const expected = buildExpectedDrillCurve(drill);
  const durationFactor = Math.min(1, Math.max(0, durationMs / 5000));

  return expected.map((point, index) => {
    const wobble = Math.sin(index * 0.9) * 0.045 + Math.cos(index * 0.31) * 0.025;
    const breath = Math.sin(index * 0.13) * durationFactor * 0.03;
    return Math.min(0.92, Math.max(0.08, point + wobble + breath));
  });
}
