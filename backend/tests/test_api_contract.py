import sys
import wave
from io import BytesIO
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.config import get_settings
from app.data import PRACTICE_WORDS
from app.schemas import ThaiTone


client = TestClient(app)


def _silent_wav_bytes() -> bytes:
    buffer = BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(16000)
        wav_file.writeframes(b"\x00\x00" * 16000)

    return buffer.getvalue()


def test_healthcheck():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_runtime_settings_are_safe_by_default():
    settings = get_settings()

    assert "*" not in settings.cors_origins
    assert settings.cors_origin_regex
    assert settings.max_audio_upload_bytes <= 8 * 1024 * 1024
    assert "audio/m4a" in settings.allowed_audio_content_types
    assert "audio/webm" in settings.allowed_audio_content_types
    assert "video/webm" in settings.allowed_audio_content_types


def test_list_practice_words():
    response = client.get("/api/practice-words")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["items"]) >= 25
    assert payload["items"][0]["id"]


def test_practice_word_catalog_quality():
    word_ids = [word.id for word in PRACTICE_WORDS]
    tones = {
        syllable.tone
        for word in PRACTICE_WORDS
        for syllable in word.syllables
    }

    assert len(PRACTICE_WORDS) >= 25
    assert len(word_ids) == len(set(word_ids))
    assert set(ThaiTone).issubset(tones)
    assert all(word.syllables for word in PRACTICE_WORDS)


def test_get_practice_word_detail():
    response = client.get("/api/practice-words/sawasdee")

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == "sawasdee"
    assert len(payload["syllables"]) == 3


def test_analyze_known_word():
    response = client.post(
        "/api/analyze",
        json={"word_id": "sawasdee", "recording_duration_ms": 1700},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["word_id"] == "sawasdee"
    assert payload["overall_accuracy"] > 0
    assert len(payload["syllables"]) == 3
    assert payload["analysis_mode"] in {"pitch", "fallback"}
    assert 0 <= payload["confidence"] <= 1
    assert payload["diagnostics"]


def test_analyze_unknown_word():
    response = client.post(
        "/api/analyze",
        json={"word_id": "missing-word", "recording_duration_ms": 1700},
    )

    assert response.status_code == 404


def test_analyze_audio_known_word():
    response = client.post(
        "/api/analyze-audio",
        data={"word_id": "sawasdee", "recording_duration_ms": "1700"},
        files={"audio": ("recording.wav", _silent_wav_bytes(), "audio/wav")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["word_id"] == "sawasdee"
    assert payload["overall_accuracy"] > 0
    assert len(payload["syllables"]) == 3
    assert payload["analysis_mode"] in {"pitch", "fallback"}
    assert 0 <= payload["confidence"] <= 1
    assert payload["diagnostics"]


def test_analyze_audio_rejects_empty_file():
    response = client.post(
        "/api/analyze-audio",
        data={"word_id": "sawasdee", "recording_duration_ms": "1700"},
        files={"audio": ("recording.m4a", b"", "audio/m4a")},
    )

    assert response.status_code == 400


def test_analyze_audio_accepts_browser_webm_content_type():
    response = client.post(
        "/api/analyze-audio",
        data={"word_id": "sawasdee", "recording_duration_ms": "1700"},
        files={"audio": ("recording.webm", _silent_wav_bytes(), "audio/webm")},
    )

    assert response.status_code == 200


def test_analyze_audio_rejects_unsupported_content_type():
    response = client.post(
        "/api/analyze-audio",
        data={"word_id": "sawasdee", "recording_duration_ms": "1700"},
        files={"audio": ("recording.txt", b"not-audio", "text/plain")},
    )

    assert response.status_code == 415


def test_analyze_audio_rejects_large_file():
    settings = get_settings()
    response = client.post(
        "/api/analyze-audio",
        data={"word_id": "sawasdee", "recording_duration_ms": "1700"},
        files={
            "audio": (
                "recording.m4a",
                b"0" * (settings.max_audio_upload_bytes + 1),
                "audio/m4a",
            )
        },
    )

    assert response.status_code == 413
