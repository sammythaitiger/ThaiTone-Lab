import { Platform } from "react-native";

import {
  AnalyzeResponse,
  PracticeWord,
  PracticeWordSummary,
} from "../types/practice";

function getApiBaseUrl() {
  const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (envBaseUrl) {
    return normalizeBaseUrl(envBaseUrl);
  }

  if (Platform.OS === "web") {
    return normalizeBaseUrl("http://127.0.0.1:8000");
  }

  if (Platform.OS === "android") {
    return normalizeBaseUrl("http://10.0.2.2:8000");
  }

  if (Platform.OS === "ios") {
    return normalizeBaseUrl("http://127.0.0.1:8000");
  }

  return normalizeBaseUrl("http://127.0.0.1:8000");
}

const API_BASE_URL = getApiBaseUrl();

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

function getNetworkFailureMessage(error: unknown) {
  const reason = error instanceof Error ? error.message : "Network request failed";
  return `Cannot reach Thai Tones API at ${API_BASE_URL}. ${reason}`;
}

async function getResponseError(response: Response) {
  const body = await response.text().catch(() => "");

  if (!body) {
    return `Request failed with status ${response.status}`;
  }

  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    if (typeof parsed.detail === "string") {
      return parsed.detail;
    }

    if (Array.isArray(parsed.detail)) {
      const firstError = parsed.detail[0];
      if (
        firstError &&
        typeof firstError === "object" &&
        "msg" in firstError
      ) {
        return String(firstError.msg);
      }
    }
  } catch {
    return body;
  }

  return body;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    throw new Error(getNetworkFailureMessage(error));
  }

  if (!response.ok) {
    throw new Error(await getResponseError(response));
  }

  return response.json() as Promise<T>;
}

export async function fetchPracticeWords() {
  return requestJson<{ items: PracticeWordSummary[] }>("/api/practice-words");
}

export async function fetchPracticeWord(wordId: string) {
  return requestJson<PracticeWord>(`/api/practice-words/${wordId}`);
}

export async function analyzeWord(wordId: string, recordingDurationMs = 1800) {
  return requestJson<AnalyzeResponse>("/api/analyze", {
    method: "POST",
    body: JSON.stringify({
      word_id: wordId,
      recording_duration_ms: recordingDurationMs,
    }),
  });
}

export type RecordingUpload = {
  uri?: string | null;
  durationMs?: number;
  mimeType?: string;
};

async function appendRecordingToFormData(
  formData: FormData,
  wordId: string,
  recording: RecordingUpload & { uri: string }
) {
  if (Platform.OS === "web") {
    const audioResponse = await fetch(recording.uri).catch((error) => {
      throw new Error(
        `Unable to read the recorded audio before upload. ${
          error instanceof Error ? error.message : "Recording fetch failed."
        }`
      );
    });
    const audioBlob = await audioResponse.blob();
    const mimeType = audioBlob.type || recording.mimeType || "audio/webm";
    const filename = `${wordId}-recording.${getAudioExtension(mimeType)}`;
    (formData.append as unknown as (
      name: string,
      value: Blob,
      fileName: string
    ) => void)("audio", audioBlob, filename);
    return;
  }

  const mimeType = recording.mimeType ?? "audio/m4a";
  const filename = `${wordId}-recording.${getAudioExtension(mimeType)}`;
  formData.append("audio", {
    uri: recording.uri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);
}

function getAudioExtension(mimeType: string) {
  if (mimeType.includes("wav")) {
    return "wav";
  }

  if (mimeType.includes("webm")) {
    return "webm";
  }

  if (mimeType.includes("ogg")) {
    return "ogg";
  }

  if (mimeType.includes("mpeg")) {
    return "mp3";
  }

  return "m4a";
}

export async function analyzeRecording(
  wordId: string,
  recording: RecordingUpload & { uri: string }
) {
  const formData = new FormData();
  formData.append("word_id", wordId);
  formData.append(
    "recording_duration_ms",
    String(recording.durationMs ?? 1800)
  );
  await appendRecordingToFormData(formData, wordId, recording);

  let response: Response;

  try {
    response = await fetch(buildApiUrl("/api/analyze-audio"), {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    throw new Error(getNetworkFailureMessage(error));
  }

  if (!response.ok) {
    throw new Error(await getResponseError(response));
  }

  return response.json() as Promise<AnalyzeResponse>;
}
