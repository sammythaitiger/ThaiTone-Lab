from typing import List, Optional

from app.schemas import (
    AnalysisMode,
    AnalyzeResponse,
    PracticeWord,
    SyllableFeedback,
    ThaiTone,
)
from app.services.pitch import PitchSyllableEstimate, estimate_syllable_tones


def _mock_detected_tone(index: int, expected: ThaiTone) -> ThaiTone:
    if index % 3 == 1:
        return ThaiTone.MID
    return expected


def _feedback_for_result(
    expected: ThaiTone,
    detected: ThaiTone,
    estimate: Optional[PitchSyllableEstimate],
) -> str:
    if detected == expected:
        return "Contour is close to the target tone."

    if estimate is None:
        return "Lower the pitch onset and keep the contour stable."

    if detected == ThaiTone.RISING:
        return "Your pitch rises more than the target contour."

    if detected == ThaiTone.FALLING:
        return "Your pitch falls more sharply than the target contour."

    if detected == ThaiTone.HIGH:
        return "Your pitch stays higher than the target contour."

    if detected == ThaiTone.LOW:
        return "Your pitch sits lower than the target contour."

    return "Keep the pitch movement closer to the target contour."


def analyze_pronunciation(
    word: PracticeWord,
    recording_duration_ms: int,
    audio_bytes: bytes = b"",
    audio_suffix: str = ".m4a",
) -> AnalyzeResponse:
    syllable_feedback: List[SyllableFeedback] = []
    pitch_result = (
        estimate_syllable_tones(audio_bytes, len(word.syllables), suffix=audio_suffix)
        if audio_bytes
        else None
    )
    pitch_estimates = pitch_result.estimates if pitch_result else None

    for index, syllable in enumerate(word.syllables):
        estimate = pitch_estimates[index] if pitch_estimates else None
        detected_tone = (
            estimate.detected_tone
            if estimate is not None
            else _mock_detected_tone(index, syllable.tone)
        )
        if detected_tone == syllable.tone:
            accuracy = round(86 + ((estimate.confidence if estimate else 0.6) * 10))
        else:
            accuracy = round(58 + ((estimate.confidence if estimate else 0.5) * 20))
        feedback = _feedback_for_result(syllable.tone, detected_tone, estimate)
        syllable_feedback.append(
            SyllableFeedback(
                syllable=syllable.thai,
                expected_tone=syllable.tone,
                detected_tone=detected_tone,
                accuracy=accuracy,
                feedback=feedback,
            )
        )

    overall_accuracy = round(
        sum(item.accuracy for item in syllable_feedback) / len(syllable_feedback)
    )
    duration_delta = abs(recording_duration_ms - (len(word.syllables) * 650))
    timing_score = max(55, min(96, 96 - duration_delta // 20))
    next_step = (
        f"Repeat the word and focus on syllable {syllable_feedback[1].syllable}."
        if len(syllable_feedback) > 1 and syllable_feedback[1].accuracy < 80
        else "Move to the next word or record again for a cleaner sample."
    )
    confidence = (
        round(sum(estimate.confidence for estimate in pitch_estimates) / len(pitch_estimates), 2)
        if pitch_estimates
        else 0.45
    )
    diagnostics = (
        pitch_result.diagnostics
        if pitch_result
        else ["analysis=fallback", "reason=pitch_extraction_unavailable"]
    )

    return AnalyzeResponse(
        word_id=word.id,
        overall_accuracy=overall_accuracy,
        timing_score=timing_score,
        syllables=syllable_feedback,
        next_step=next_step,
        analysis_mode=AnalysisMode.PITCH if pitch_result else AnalysisMode.FALLBACK,
        confidence=confidence,
        diagnostics=diagnostics,
    )
