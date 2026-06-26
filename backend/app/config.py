import os
from functools import lru_cache
from typing import List


def _split_csv(value: str) -> List[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


class Settings:
    def __init__(self) -> None:
        self.environment = os.getenv("THAI_TONES_ENV", "development")
        self.cors_origins = _split_csv(
            os.getenv(
                "THAI_TONES_CORS_ORIGINS",
                "http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006",
            )
        )
        self.cors_origin_regex = os.getenv(
            "THAI_TONES_CORS_ORIGIN_REGEX",
            r"http://(localhost|127\.0\.0\.1):[0-9]+",
        )
        self.max_audio_upload_bytes = int(
            os.getenv("THAI_TONES_MAX_AUDIO_UPLOAD_BYTES", str(8 * 1024 * 1024))
        )
        self.allowed_audio_content_types = _split_csv(
            os.getenv(
                "THAI_TONES_ALLOWED_AUDIO_CONTENT_TYPES",
                "audio/m4a,audio/mp4,audio/mpeg,audio/wav,audio/x-wav,audio/aac,audio/webm,audio/ogg,video/webm,application/octet-stream",
            )
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
