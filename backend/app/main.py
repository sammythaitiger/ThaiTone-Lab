from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.data import PRACTICE_WORDS, get_word_by_id, list_word_summaries
from app.schemas import AnalyzeRequest, AnalyzeResponse, HealthResponse, PracticeWord
from app.services.pronunciation import analyze_pronunciation

settings = get_settings()


def _audio_suffix(filename: Optional[str]) -> str:
    suffix = Path(filename or "").suffix.lower()
    return suffix if suffix else ".m4a"

app = FastAPI(
    title="Thai Tones API",
    version="0.1.0",
    description="MVP API for Thai tone practice and syllable-aware feedback.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(status="ok", service="thai-tones-api")


@app.get("/api/practice-words")
def practice_words() -> Dict[str, Any]:
    return {"items": list_word_summaries()}


@app.get("/api/practice-words/{word_id}", response_model=PracticeWord)
def practice_word_detail(word_id: str) -> PracticeWord:
    word = get_word_by_id(word_id)
    if word is None:
        raise HTTPException(status_code=404, detail="Word not found")

    return word


@app.get("/api/practice-words-full", response_model=List[PracticeWord])
def practice_words_full() -> List[PracticeWord]:
    return PRACTICE_WORDS


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    word = get_word_by_id(request.word_id)
    if word is None:
        raise HTTPException(status_code=404, detail="Word not found")

    return analyze_pronunciation(word=word, recording_duration_ms=request.recording_duration_ms)


@app.post("/api/analyze-audio", response_model=AnalyzeResponse)
async def analyze_audio(
    word_id: str = Form(...),
    recording_duration_ms: int = Form(1800),
    audio: UploadFile = File(...),
) -> AnalyzeResponse:
    word = get_word_by_id(word_id)
    if word is None:
        raise HTTPException(status_code=404, detail="Word not found")

    if (
        audio.content_type
        and audio.content_type not in settings.allowed_audio_content_types
    ):
        raise HTTPException(status_code=415, detail="Unsupported audio content type")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    if len(audio_bytes) > settings.max_audio_upload_bytes:
        raise HTTPException(status_code=413, detail="Audio file is too large")

    return analyze_pronunciation(
        word=word,
        recording_duration_ms=recording_duration_ms,
        audio_bytes=audio_bytes,
        audio_suffix=_audio_suffix(audio.filename),
    )
