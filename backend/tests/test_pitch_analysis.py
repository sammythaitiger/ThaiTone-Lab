import math
import sys
import wave
from io import BytesIO
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.schemas import ThaiTone
from app.services.pitch import estimate_syllable_tones


def _tone_wav_bytes(start_hz: float, end_hz: float, duration_seconds: float = 1.2) -> bytes:
    sample_rate = 16000
    total_samples = int(sample_rate * duration_seconds)
    frames = bytearray()

    phase = 0.0
    for index in range(total_samples):
        t = index / max(total_samples - 1, 1)
        frequency = start_hz + (end_hz - start_hz) * t
        phase += 2 * math.pi * frequency / sample_rate
        sample = int(math.sin(phase) * 12000)
        frames.extend(sample.to_bytes(2, byteorder="little", signed=True))

    buffer = BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(bytes(frames))

    return buffer.getvalue()


def test_pitch_analysis_detects_rising_tone_shape():
    pytest.importorskip("librosa")

    result = estimate_syllable_tones(_tone_wav_bytes(170, 260), 1, suffix=".wav")

    assert result is not None
    assert result.estimates[0].detected_tone in {ThaiTone.RISING, ThaiTone.HIGH}
    assert result.estimates[0].confidence > 0.5
    assert "pitch_extraction=librosa.pyin" in result.diagnostics


def test_pitch_analysis_detects_falling_tone_shape():
    pytest.importorskip("librosa")

    result = estimate_syllable_tones(_tone_wav_bytes(260, 170), 1, suffix=".wav")

    assert result is not None
    assert result.estimates[0].detected_tone == ThaiTone.FALLING
    assert result.estimates[0].confidence > 0.5
