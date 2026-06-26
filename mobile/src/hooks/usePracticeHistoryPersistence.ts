import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import { PracticeAttempt } from "../types/practice";

const STORAGE_KEY = "thai-tones-practice-history";

type WebWindow = {
  localStorage?: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
};

type UsePracticeHistoryPersistenceProps = {
  history: PracticeAttempt[];
  onHydrate: (history: PracticeAttempt[]) => void;
};

function getWebStorage() {
  if (Platform.OS !== "web") {
    return null;
  }

  return (globalThis as WebWindow).localStorage ?? null;
}

function isPracticeAttempt(value: unknown): value is PracticeAttempt {
  if (!value || typeof value !== "object") {
    return false;
  }

  const attempt = value as PracticeAttempt;
  return (
    typeof attempt.id === "string" &&
    typeof attempt.wordId === "string" &&
    typeof attempt.thai === "string" &&
    typeof attempt.overallAccuracy === "number" &&
    typeof attempt.createdAt === "string"
  );
}

export function usePracticeHistoryPersistence({
  history,
  onHydrate,
}: UsePracticeHistoryPersistenceProps) {
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    const storage = getWebStorage();
    if (!storage) {
      hasHydratedRef.current = true;
      return;
    }

    const storedValue = storage.getItem(STORAGE_KEY);
    if (storedValue) {
      try {
        const parsed = JSON.parse(storedValue) as unknown;
        if (Array.isArray(parsed)) {
          onHydrate(parsed.filter(isPracticeAttempt));
        }
      } catch {
        storage.removeItem(STORAGE_KEY);
      }
    }

    hasHydratedRef.current = true;
  }, [onHydrate]);

  useEffect(() => {
    const storage = getWebStorage();
    if (!hasHydratedRef.current || !storage) {
      return;
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 25)));
  }, [history]);
}
