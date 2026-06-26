from enum import Enum
from typing import List

from pydantic import BaseModel, Field


class ThaiTone(str, Enum):
    MID = "mid"
    LOW = "low"
    FALLING = "falling"
    HIGH = "high"
    RISING = "rising"


class AnalysisMode(str, Enum):
    PITCH = "pitch"
    FALLBACK = "fallback"


class WordSyllable(BaseModel):
    thai: str
    transcription: str
    tone: ThaiTone


class PracticeWord(BaseModel):
    id: str
    thai: str
    transcription: str
    english: str
    syllables: List[WordSyllable]


class PracticeWordSummary(BaseModel):
    id: str
    thai: str
    transcription: str
    english: str
    syllable_count: int


class AnalyzeRequest(BaseModel):
    word_id: str = Field(description="Selected practice word identifier.")
    recording_duration_ms: int = Field(
        default=1800,
        ge=250,
        le=15000,
        description="Approximate recording duration used for mock scoring.",
    )


class SyllableFeedback(BaseModel):
    syllable: str
    expected_tone: ThaiTone
    detected_tone: ThaiTone
    accuracy: int = Field(ge=0, le=100)
    feedback: str


class AnalyzeResponse(BaseModel):
    word_id: str
    overall_accuracy: int = Field(ge=0, le=100)
    timing_score: int = Field(ge=0, le=100)
    syllables: List[SyllableFeedback]
    next_step: str
    analysis_mode: AnalysisMode = Field(
        default=AnalysisMode.FALLBACK,
        description="Whether the result used pitch extraction or deterministic fallback scoring.",
    )
    confidence: float = Field(
        default=0.45,
        ge=0,
        le=1,
        description="Overall confidence in the analysis result.",
    )
    diagnostics: List[str] = Field(default_factory=list)


class HealthResponse(BaseModel):
    status: str
    service: str
