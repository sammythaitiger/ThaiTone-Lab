# Thai Tones Release Checklist

## Local Gates
- [ ] `scripts/release-smoke.sh` passes.
- [ ] `scripts/api-smoke.sh http://127.0.0.1:8000` passes while backend is running.
- [ ] `scripts/check-release-env.sh` passes for preview and production envs.
- [ ] Backend starts with production-like CORS:
  `THAI_TONES_CORS_ORIGINS=https://your-app.example uvicorn app.main:app --app-dir backend`
- [ ] Mobile uses a real API host through `EXPO_PUBLIC_API_BASE_URL`.
- [ ] Audio recording is tested on a physical iOS device.
- [ ] Audio recording is tested on a physical Android device.
- [ ] `RELEASE_QA_MATRIX.md` device checks are completed.

## Product Gates
- [ ] Replace placeholder icon and splash with final brand assets.
- [ ] Replace mock/fallback pronunciation scoring with validated MFA segmentation.
- [ ] Validate tone scoring against real Thai speaker samples.
- [ ] Add enough practice words for the first release cohort.
- [ ] Add real native reference audio for every practice word.

## Store Gates
- [ ] Confirm bundle id/package name ownership: `com.thaitones.app`.
- [ ] Create App Store privacy policy and microphone usage copy.
- [ ] Configure EAS project and credentials.
- [ ] Build internal preview with `eas build --profile preview`.
- [ ] Run TestFlight/Play internal testing before public submission.

## Backend Gates
- [ ] Deploy API behind HTTPS.
- [ ] Set explicit CORS origins.
- [ ] Set upload size limits appropriate for production.
- [ ] Add logs/metrics for analyze failures and latency.
- [ ] Add persistent storage only after the scoring pipeline is validated.
