import { Platform } from "react-native";

type MediaTrack = {
  stop: () => void;
};

type MediaStreamLike = {
  getTracks: () => MediaTrack[];
};

type MediaDevicesLike = {
  getUserMedia: (constraints: { audio: boolean }) => Promise<MediaStreamLike>;
};

type NavigatorWithMedia = {
  mediaDevices?: MediaDevicesLike;
};

type AnalyserNodeLike = {
  fftSize: number;
  getFloatTimeDomainData: (array: Float32Array) => void;
};

type MediaStreamSourceLike = {
  connect: (node: AnalyserNodeLike) => void;
  disconnect: () => void;
};

type LiveAudioContext = {
  sampleRate: number;
  createAnalyser: () => AnalyserNodeLike;
  createMediaStreamSource: (stream: MediaStreamLike) => MediaStreamSourceLike;
  close: () => Promise<void>;
};

type LiveAudioContextConstructor = new () => LiveAudioContext;

type GlobalWithLiveAudio = typeof globalThis & {
  AudioContext?: LiveAudioContextConstructor;
  webkitAudioContext?: LiveAudioContextConstructor;
  navigator?: NavigatorWithMedia;
};

const FRAME_SIZE = 2048;
const MIN_PITCH_HZ = 70;
const MAX_PITCH_HZ = 520;
const MIN_RMS = 0.015;
const MIN_CORRELATION = 0.58;
const UPDATE_MS = 120;

function getRms(samples: Float32Array) {
  let sum = 0;

  for (let index = 0; index < samples.length; index += 1) {
    sum += samples[index] * samples[index];
  }

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

function normalizeLivePitch(pitches: number[], targetPoints: number) {
  if (pitches.length < 2) {
    return [];
  }

  const visible =
    pitches.length > targetPoints ? pitches.slice(-targetPoints) : pitches;
  const logs = visible.map((pitch) => Math.log2(pitch));
  const min = Math.min(...logs);
  const max = Math.max(...logs);
  const span = Math.max(max - min, 0.08);
  const normalized = logs.map((pitch) =>
    Math.min(0.92, Math.max(0.08, 0.16 + ((pitch - min) / span) * 0.76))
  );
  const lastPoint = normalized[normalized.length - 1] ?? 0.5;
  const paddedTail = Array.from(
    { length: Math.max(0, targetPoints - normalized.length) },
    () => lastPoint
  );

  return [...normalized, ...paddedTail];
}

export async function startLivePitchMonitor(
  targetPoints: number,
  onCurve: (points: number[]) => void
) {
  if (Platform.OS !== "web") {
    return () => undefined;
  }

  const webGlobal = globalThis as GlobalWithLiveAudio;
  const AudioContextCtor =
    webGlobal.AudioContext ?? webGlobal.webkitAudioContext;
  const mediaDevices = webGlobal.navigator?.mediaDevices;

  if (!AudioContextCtor || !mediaDevices) {
    return () => undefined;
  }

  const stream = await mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContextCtor();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  const frame = new Float32Array(FRAME_SIZE);
  const pitches: number[] = [];

  analyser.fftSize = FRAME_SIZE;
  source.connect(analyser);

  const interval = setInterval(() => {
    analyser.getFloatTimeDomainData(frame);
    const pitch = estimatePitchHz(frame, audioContext.sampleRate);

    if (!pitch) {
      return;
    }

    pitches.push(pitch);
    const curve = normalizeLivePitch(pitches, targetPoints);

    if (curve.length > 0) {
      onCurve(curve);
    }
  }, UPDATE_MS);

  return () => {
    clearInterval(interval);
    source.disconnect();
    stream.getTracks().forEach((track: MediaTrack) => track.stop());
    void audioContext.close();
  };
}
