import { Platform } from "react-native";

type DecodedAudioBuffer = {
  getChannelData: (channel: number) => Float32Array;
  sampleRate: number;
};

type WebAudioContext = {
  decodeAudioData: (audioData: ArrayBuffer) => Promise<DecodedAudioBuffer>;
  close: () => Promise<void>;
};

type WebAudioContextConstructor = new () => WebAudioContext;

type GlobalWithAudioContext = typeof globalThis & {
  AudioContext?: WebAudioContextConstructor;
  webkitAudioContext?: WebAudioContextConstructor;
};

const MIN_PITCH_HZ = 70;
const MAX_PITCH_HZ = 520;
const FRAME_SIZE = 2048;
const MIN_RMS = 0.015;
const MIN_CORRELATION = 0.58;

function getRms(samples: Float32Array) {
  const sum = samples.reduce((total, sample) => total + sample * sample, 0);
  return Math.sqrt(sum / samples.length);
}

function estimatePitchHz(frame: Float32Array, sampleRate: number) {
  if (getRms(frame) < MIN_RMS) {
    return null;
  }

  const minLag = Math.floor(sampleRate / MAX_PITCH_HZ);
  const maxLag = Math.min(
    Math.floor(sampleRate / MIN_PITCH_HZ),
    frame.length - 1
  );
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    let leftEnergy = 0;
    let rightEnergy = 0;

    for (let index = 0; index < frame.length - lag; index += 1) {
      const left = frame[index];
      const right = frame[index + lag];
      correlation += left * right;
      leftEnergy += left * left;
      rightEnergy += right * right;
    }

    const normalized =
      correlation / Math.sqrt(Math.max(leftEnergy * rightEnergy, 0.000001));

    if (normalized > bestCorrelation) {
      bestCorrelation = normalized;
      bestLag = lag;
    }
  }

  if (bestLag <= 0 || bestCorrelation < MIN_CORRELATION) {
    return null;
  }

  return sampleRate / bestLag;
}

function interpolateMissingPitchValues(values: Array<number | null>) {
  const firstVoicedIndex = values.findIndex((value) => value !== null);

  if (firstVoicedIndex === -1) {
    return [];
  }

  const result = [...values];
  let lastVoicedIndex = firstVoicedIndex;

  for (let index = 0; index < firstVoicedIndex; index += 1) {
    result[index] = result[firstVoicedIndex];
  }

  for (let index = firstVoicedIndex + 1; index < result.length; index += 1) {
    if (result[index] === null) {
      continue;
    }

    const start = result[lastVoicedIndex] ?? result[index] ?? MIN_PITCH_HZ;
    const end = result[index] ?? start;
    const distance = index - lastVoicedIndex;

    for (let fillIndex = lastVoicedIndex + 1; fillIndex < index; fillIndex += 1) {
      const progress = (fillIndex - lastVoicedIndex) / distance;
      result[fillIndex] = start + (end - start) * progress;
    }

    lastVoicedIndex = index;
  }

  for (let index = lastVoicedIndex + 1; index < result.length; index += 1) {
    result[index] = result[lastVoicedIndex];
  }

  return result.filter((value): value is number => value !== null);
}

function normalizePitchContour(pitches: number[], targetPoints: number) {
  if (pitches.length < 3) {
    return [];
  }

  const logs = pitches.map((pitch) => Math.log2(pitch));
  const min = Math.min(...logs);
  const max = Math.max(...logs);
  const span = Math.max(max - min, 0.08);
  const normalized = logs.map((pitch) =>
    Math.min(0.92, Math.max(0.08, 0.16 + ((pitch - min) / span) * 0.76))
  );

  if (normalized.length === targetPoints) {
    return normalized;
  }

  return Array.from({ length: targetPoints }, (_, index) => {
    const sourceIndex =
      (index / Math.max(targetPoints - 1, 1)) * (normalized.length - 1);
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(leftIndex + 1, normalized.length - 1);
    const progress = sourceIndex - leftIndex;
    const left = normalized[leftIndex];
    const right = normalized[rightIndex];
    return left + (right - left) * progress;
  });
}

function normalizeSamples(samples: number[], targetPoints: number) {
  if (samples.length === 0) {
    return [];
  }

  const bucketSize = Math.max(1, Math.floor(samples.length / targetPoints));
  const points: number[] = [];

  for (let index = 0; index < samples.length; index += bucketSize) {
    const bucket = samples.slice(index, index + bucketSize);
    const rms = Math.sqrt(
      bucket.reduce((sum, sample) => sum + sample * sample, 0) / bucket.length
    );
    points.push(rms);
  }

  const max = Math.max(...points, 0.001);
  return points.slice(0, targetPoints).map((point) => {
    const normalized = point / max;
    return Math.min(0.92, Math.max(0.08, 0.18 + normalized * 0.74));
  });
}

export async function extractWaveformPoints(uri: string, targetPoints = 96) {
  if (Platform.OS !== "web") {
    return [];
  }

  const audioResponse = await fetch(uri);
  const arrayBuffer = await audioResponse.arrayBuffer();
  const webGlobal = globalThis as GlobalWithAudioContext;
  const AudioContextCtor =
    webGlobal.AudioContext ?? webGlobal.webkitAudioContext;

  if (!AudioContextCtor) {
    return [];
  }

  const audioContext = new AudioContextCtor();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channel = audioBuffer.getChannelData(0);
    return normalizeSamples(Array.from(channel), targetPoints);
  } finally {
    await audioContext.close();
  }
}

export async function extractPitchContourPoints(uri: string, targetPoints = 96) {
  if (Platform.OS !== "web") {
    return [];
  }

  const audioResponse = await fetch(uri);
  const arrayBuffer = await audioResponse.arrayBuffer();
  const webGlobal = globalThis as GlobalWithAudioContext;
  const AudioContextCtor =
    webGlobal.AudioContext ?? webGlobal.webkitAudioContext;

  if (!AudioContextCtor) {
    return [];
  }

  const audioContext = new AudioContextCtor();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channel = audioBuffer.getChannelData(0);
    const hopSize = Math.max(
      256,
      Math.floor((channel.length - FRAME_SIZE) / Math.max(targetPoints - 1, 1))
    );
    const pitches: Array<number | null> = [];

    for (
      let start = 0;
      start + FRAME_SIZE <= channel.length;
      start += hopSize
    ) {
      const frame = channel.slice(start, start + FRAME_SIZE);
      pitches.push(estimatePitchHz(frame, audioBuffer.sampleRate));
    }

    return normalizePitchContour(
      interpolateMissingPitchValues(pitches),
      targetPoints
    );
  } finally {
    await audioContext.close();
  }
}
