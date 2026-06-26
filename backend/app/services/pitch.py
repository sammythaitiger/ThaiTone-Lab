import os
import tempfile
from dataclasses import dataclass
from typing import List, Optional

from app.schemas import ThaiTone


@dataclass
class PitchSyllableEstimate:
    detected_tone: ThaiTone
    confidence: float


@dataclass
class PitchAnalysisResult:
    estimates: List[PitchSyllableEstimate]
    diagnostics: List[str]


def _tone_from_contour(points: List[float]) -> ThaiTone:
    if len(points) < 3:
        return ThaiTone.MID

    start = points[0]
    middle = points[len(points) // 2]
    end = points[-1]
    slope = end - start
    dip = min(points) - max(start, end)

    if slope > 0.16 and dip < -0.08:
        return ThaiTone.RISING

    if slope > 0.14:
        return ThaiTone.HIGH

    if slope < -0.14:
        return ThaiTone.FALLING

    if max(points) < 0.42:
        return ThaiTone.LOW

    return ThaiTone.MID


def _normalize(values: List[float]) -> List[float]:
    if not values:
        return []

    low = min(values)
    high = max(values)
    if high - low < 1e-6:
        return [0.5 for _ in values]

    return [(value - low) / (high - low) for value in values]


def estimate_syllable_tones(
    audio_bytes: bytes,
    syllable_count: int,
    suffix: str = ".m4a",
) -> Optional[PitchAnalysisResult]:
    if syllable_count <= 0:
        return None

    try:
        import librosa
        import numpy as np
    except ImportError:
        return None

    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name

        audio, sample_rate = librosa.load(temp_path, sr=16000, mono=True)
        if audio.size < sample_rate * 0.2:
            return None

        f0, _, _ = librosa.pyin(
            audio,
            fmin=librosa.note_to_hz("C2"),
            fmax=librosa.note_to_hz("C6"),
            sr=sample_rate,
        )
        voiced = f0[~np.isnan(f0)]
        if voiced.size < syllable_count * 2:
            return None

        normalized = _normalize([float(value) for value in voiced])
        chunk_size = max(1, len(normalized) // syllable_count)
        estimates: List[PitchSyllableEstimate] = []

        for index in range(syllable_count):
            start = index * chunk_size
            end = len(normalized) if index == syllable_count - 1 else start + chunk_size
            chunk = normalized[start:end]
            if not chunk:
                return None

            tone = _tone_from_contour(chunk)
            spread = max(chunk) - min(chunk)
            confidence = max(0.35, min(0.95, 0.55 + spread))
            estimates.append(PitchSyllableEstimate(tone, confidence))

        return PitchAnalysisResult(
            estimates=estimates,
            diagnostics=[
                "pitch_extraction=librosa.pyin",
                f"voiced_frames={int(voiced.size)}",
                "syllable_alignment=even_voiced_chunking",
            ],
        )
    except Exception:
        return None
    finally:
        if temp_path:
            try:
                os.remove(temp_path)
            except OSError:
                pass
