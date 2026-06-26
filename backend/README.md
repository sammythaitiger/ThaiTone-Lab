# Thai Tones Backend MVP

## Purpose
This backend provides the first development API for tone practice.
It currently serves:

- `GET /health`
- `GET /api/practice-words`
- `GET /api/practice-words/{word_id}`
- `GET /api/practice-words-full`
- `POST /api/analyze`
- `POST /api/analyze-audio`

Audio analysis uses pitch extraction when possible and falls back to guided scoring
when pitch data is unavailable.

## Run locally
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --app-dir backend
```

## Smoke test
```bash
./scripts/api-smoke.sh http://127.0.0.1:8000
```

## Example request
```bash
curl -X POST http://127.0.0.1:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"word_id":"sawasdee","recording_duration_ms":1700}'
```

## Next implementation step
Harden `backend/app/services/pronunciation.py` with:

1. uploaded audio preprocessing
2. MFA alignment
3. pitch contour extraction
4. syllable-by-syllable scoring
5. validated scoring against Thai speaker samples
