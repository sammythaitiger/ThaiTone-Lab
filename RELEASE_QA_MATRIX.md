# Thai Tones Release QA Matrix

Use this checklist before every preview or production build.

## Automated Gates

| Gate | Command | Pass Criteria |
| --- | --- | --- |
| Full local smoke | `./scripts/release-smoke.sh` | TypeScript, web export, Expo Doctor, backend tests, and local API smoke pass. |
| API smoke | `./scripts/api-smoke.sh http://127.0.0.1:8000` | Health, catalog, and analyze endpoints pass. |
| Preview env | `THAI_TONES_ENV=preview ./scripts/check-release-env.sh` | HTTPS API URL and explicit CORS are configured. |
| Production env | `THAI_TONES_ENV=production ./scripts/check-release-env.sh` | No localhost API, no wildcard CORS, HTTPS only. |

## Manual Device QA

| Area | iOS Simulator | iOS Device | Android Emulator | Android Device | Expected Result |
| --- | --- | --- | --- | --- | --- |
| App launch | Required | Required | Required | Required | No blank screen. Main word list appears. |
| Practice catalog | Required | Required | Required | Required | At least 25 words, filters work, search works. |
| Backend unavailable | Required | Required | Required | Required | Built-in library loads and result mode shows guided estimate. |
| Microphone permission | Optional | Required | Optional | Required | Permission prompt appears once and denied state is recoverable. |
| Recording start/stop | Optional | Required | Optional | Required | Countdown, recording, stop, analyzing, results all work. |
| Audio upload | Optional | Required | Optional | Required | Result mode shows pitch when backend can decode audio. |
| Recording replay | Optional | Required | Optional | Required | "Play yours" plays the latest recording. |
| Error recovery | Required | Required | Required | Required | Retry actions recover without app restart. |
| History | Required | Required | Required | Required | Attempts are added and clearing history works. |

## Product QA

| Area | Check | Release Bar |
| --- | --- | --- |
| Thai content | Verify words, transliteration, meanings, and tone labels. | Reviewed by Thai speaker or teacher. |
| Feedback honesty | Compare pitch vs guided fallback display. | App never presents fallback as precise analysis. |
| Reference audio | Check native reference playback for each word. | Required before public learning release. |
| Accessibility | Text sizes, tap targets, color contrast. | Usable on small phones. |
| Privacy | Microphone copy and privacy policy. | Ready before store submission. |

## Known Release Risks

- Tone labels and transliterations need human linguistic review before public launch.
- Pitch extraction depends on backend decoding support and real device audio formats.
- Local fallback is useful for resilience, but it is not a substitute for validated pronunciation scoring.
- Native reference audio is still the biggest product-quality gap.
