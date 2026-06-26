import { useEffect, useMemo } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

import { PlaybackStatus } from "./useMockPlayback";

function mapPlaybackStatus(
  hasSource: boolean,
  isBuffering: boolean,
  playing: boolean
): PlaybackStatus {
  if (!hasSource) {
    return "idle";
  }

  if (isBuffering) {
    return "loading";
  }

  if (playing) {
    return "playing";
  }

  return "idle";
}

export function useRecordingPlayback(recordingUri: string) {
  const player = useAudioPlayer(recordingUri ? { uri: recordingUri } : null, {
    updateInterval: 100,
  });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!recordingUri) {
      return;
    }

    player.replace({ uri: recordingUri });
  }, [player, recordingUri]);

  const playbackStatus = mapPlaybackStatus(
    Boolean(recordingUri),
    status.isBuffering,
    status.playing
  );
  const progress =
    status.duration > 0
      ? Math.min(status.currentTime / status.duration, 1)
      : 0;

  function toggle() {
    if (!recordingUri) {
      return;
    }

    if (status.playing) {
      player.pause();
      return;
    }

    if (status.didJustFinish || progress >= 0.99) {
      void player.seekTo(0).then(() => {
        player.play();
      });
      return;
    }

    player.play();
  }

  return useMemo(
    () => ({
      progress,
      status: playbackStatus,
      toggle,
    }),
    [playbackStatus, progress, recordingUri, status.didJustFinish, status.playing]
  );
}
