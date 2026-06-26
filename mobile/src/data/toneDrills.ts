import { ThaiTone } from "../types/practice";

export type ToneDrillSyllable = {
  thai: string;
  transcription: string;
  tone: ThaiTone;
};

export type ToneDrill = {
  id: string;
  title: string;
  thai: string;
  transcription: string;
  description: string;
  syllables: ToneDrillSyllable[];
};

export const TONE_DRILLS: ToneDrill[] = [
  {
    id: "ma-all-tones",
    title: "Ma tone ladder",
    thai: "มา ม่า ม้า ม๊า ม๋า",
    transcription: "maa / maa / maa / maa / maa",
    description: "Same sound, five tone shapes.",
    syllables: [
      { thai: "มา", transcription: "maa", tone: "mid" },
      { thai: "ม่า", transcription: "maa", tone: "low" },
      { thai: "ม้า", transcription: "maa", tone: "falling" },
      { thai: "ม๊า", transcription: "maa", tone: "high" },
      { thai: "ม๋า", transcription: "maa", tone: "rising" },
    ],
  },
  {
    id: "gaa-all-tones",
    title: "Gaa tone ladder",
    thai: "กา ก่า ก้า ก๊า ก๋า",
    transcription: "gaa / gaa / gaa / gaa / gaa",
    description: "Clean drill for seeing each contour.",
    syllables: [
      { thai: "กา", transcription: "gaa", tone: "mid" },
      { thai: "ก่า", transcription: "gaa", tone: "low" },
      { thai: "ก้า", transcription: "gaa", tone: "falling" },
      { thai: "ก๊า", transcription: "gaa", tone: "high" },
      { thai: "ก๋า", transcription: "gaa", tone: "rising" },
    ],
  },
  {
    id: "mai-contrast",
    title: "Mai contrast",
    thai: "ไม่ ใหม่ ไหม ไม้",
    transcription: "mai / mai / mai / mai",
    description: "Four useful words that sound close but carry different tones.",
    syllables: [
      { thai: "ไม่", transcription: "mai", tone: "falling" },
      { thai: "ใหม่", transcription: "mai", tone: "low" },
      { thai: "ไหม", transcription: "mai", tone: "rising" },
      { thai: "ไม้", transcription: "mai", tone: "high" },
    ],
  },
  {
    id: "fall-rise-switch",
    title: "Fall and rise switch",
    thai: "ม้า ม๋า ม้า ม๋า",
    transcription: "maa / maa / maa / maa",
    description: "Practice switching between falling and rising motion.",
    syllables: [
      { thai: "ม้า", transcription: "maa", tone: "falling" },
      { thai: "ม๋า", transcription: "maa", tone: "rising" },
      { thai: "ม้า", transcription: "maa", tone: "falling" },
      { thai: "ม๋า", transcription: "maa", tone: "rising" },
    ],
  },
  {
    id: "low-high-switch",
    title: "Low and high switch",
    thai: "ม่า ม๊า ม่า ม๊า",
    transcription: "maa / maa / maa / maa",
    description: "Separate lower placement from higher placement.",
    syllables: [
      { thai: "ม่า", transcription: "maa", tone: "low" },
      { thai: "ม๊า", transcription: "maa", tone: "high" },
      { thai: "ม่า", transcription: "maa", tone: "low" },
      { thai: "ม๊า", transcription: "maa", tone: "high" },
    ],
  },
];
