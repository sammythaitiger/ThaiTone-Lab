from typing import List, Optional

from app.schemas import PracticeWord, PracticeWordSummary, ThaiTone, WordSyllable


def _syllable(thai: str, transcription: str, tone: ThaiTone) -> WordSyllable:
    return WordSyllable(thai=thai, transcription=transcription, tone=tone)


def _word(
    word_id: str,
    thai: str,
    transcription: str,
    english: str,
    syllables: List[WordSyllable],
) -> PracticeWord:
    return PracticeWord(
        id=word_id,
        thai=thai,
        transcription=transcription,
        english=english,
        syllables=syllables,
    )


PRACTICE_WORDS: List[PracticeWord] = [
    _word(
        "tone-drill-gaa-mid",
        "กา",
        "gaa",
        "tone drill: mid tone",
        [_syllable("กา", "gaa", ThaiTone.MID)],
    ),
    _word(
        "tone-drill-gaa-low",
        "ก่า",
        "gaa",
        "tone drill: low tone",
        [_syllable("ก่า", "gaa", ThaiTone.LOW)],
    ),
    _word(
        "tone-drill-gaa-falling",
        "ก้า",
        "gaa",
        "tone drill: falling tone",
        [_syllable("ก้า", "gaa", ThaiTone.FALLING)],
    ),
    _word(
        "tone-drill-gaa-high",
        "ก๊า",
        "gaa",
        "tone drill: high tone",
        [_syllable("ก๊า", "gaa", ThaiTone.HIGH)],
    ),
    _word(
        "tone-drill-gaa-rising",
        "ก๋า",
        "gaa",
        "tone drill: rising tone",
        [_syllable("ก๋า", "gaa", ThaiTone.RISING)],
    ),
    _word(
        "maa",
        "มา",
        "maa",
        "to come",
        [_syllable("มา", "maa", ThaiTone.MID)],
    ),
    _word(
        "mai-no",
        "ไม่",
        "mai",
        "no / not",
        [_syllable("ไม่", "mai", ThaiTone.FALLING)],
    ),
    _word(
        "mai-question",
        "ไหม",
        "mai",
        "question particle",
        [_syllable("ไหม", "mai", ThaiTone.RISING)],
    ),
    _word(
        "mai-new",
        "ใหม่",
        "mai",
        "new",
        [_syllable("ใหม่", "mai", ThaiTone.LOW)],
    ),
    _word(
        "mai-wood",
        "ไม้",
        "mai",
        "wood / stick",
        [_syllable("ไม้", "mai", ThaiTone.HIGH)],
    ),
    _word(
        "baan",
        "บ้าน",
        "baan",
        "house",
        [_syllable("บ้าน", "baan", ThaiTone.FALLING)],
    ),
    _word(
        "naam",
        "น้ำ",
        "naam",
        "water",
        [_syllable("น้ำ", "naam", ThaiTone.HIGH)],
    ),
    _word(
        "gin",
        "กิน",
        "gin",
        "to eat",
        [_syllable("กิน", "gin", ThaiTone.MID)],
    ),
    _word(
        "dii",
        "ดี",
        "dii",
        "good",
        [_syllable("ดี", "dii", ThaiTone.MID)],
    ),
    _word(
        "duu",
        "ดู",
        "duu",
        "to look / watch",
        [_syllable("ดู", "duu", ThaiTone.MID)],
    ),
    _word(
        "pai",
        "ไป",
        "pai",
        "to go",
        [_syllable("ไป", "pai", ThaiTone.MID)],
    ),
    _word(
        "rak",
        "รัก",
        "rak",
        "to love",
        [_syllable("รัก", "rak", ThaiTone.HIGH)],
    ),
    _word(
        "maak",
        "มาก",
        "maak",
        "very / much",
        [_syllable("มาก", "maak", ThaiTone.FALLING)],
    ),
    _word(
        "suay",
        "สวย",
        "suay",
        "beautiful",
        [_syllable("สวย", "suay", ThaiTone.RISING)],
    ),
    _word(
        "ngai",
        "ง่าย",
        "ngaai",
        "easy",
        [_syllable("ง่าย", "ngaai", ThaiTone.FALLING)],
    ),
    _word(
        "ron",
        "ร้อน",
        "ron",
        "hot",
        [_syllable("ร้อน", "ron", ThaiTone.HIGH)],
    ),
    _word(
        "yen",
        "เย็น",
        "yen",
        "cool / cold",
        [_syllable("เย็น", "yen", ThaiTone.MID)],
    ),
    _word(
        "gai-chicken",
        "ไก่",
        "gai",
        "chicken",
        [_syllable("ไก่", "gai", ThaiTone.LOW)],
    ),
    _word(
        "khai-egg",
        "ไข่",
        "khai",
        "egg",
        [_syllable("ไข่", "khai", ThaiTone.LOW)],
    ),
    _word(
        "glai-far",
        "ไกล",
        "glai",
        "far",
        [_syllable("ไกล", "glai", ThaiTone.MID)],
    ),
    _word(
        "glai-near",
        "ใกล้",
        "glai",
        "near",
        [_syllable("ใกล้", "glai", ThaiTone.FALLING)],
    ),
    _word(
        "sawasdee",
        "สวัสดี",
        "sa-wat-dii",
        "hello",
        [
            _syllable("ส", "sa", ThaiTone.MID),
            _syllable("วัส", "wat", ThaiTone.LOW),
            _syllable("ดี", "dii", ThaiTone.MID),
        ],
    ),
    _word(
        "khob-khun",
        "ขอบคุณ",
        "khop-khun",
        "thank you",
        [
            _syllable("ขอบ", "khop", ThaiTone.LOW),
            _syllable("คุณ", "khun", ThaiTone.HIGH),
        ],
    ),
    _word(
        "sabai-dii",
        "สบายดี",
        "sa-baai-dii",
        "well / fine",
        [
            _syllable("ส", "sa", ThaiTone.MID),
            _syllable("บาย", "baai", ThaiTone.MID),
            _syllable("ดี", "dii", ThaiTone.MID),
        ],
    ),
    _word(
        "aroi",
        "อร่อย",
        "a-roi",
        "delicious",
        [
            _syllable("อ", "a", ThaiTone.MID),
            _syllable("ร่อย", "roi", ThaiTone.LOW),
        ],
    ),
]


def list_word_summaries() -> List[PracticeWordSummary]:
    return [
        PracticeWordSummary(
            id=word.id,
            thai=word.thai,
            transcription=word.transcription,
            english=word.english,
            syllable_count=len(word.syllables),
        )
        for word in PRACTICE_WORDS
    ]


def get_word_by_id(word_id: str) -> Optional[PracticeWord]:
    return next((word for word in PRACTICE_WORDS if word.id == word_id), None)
