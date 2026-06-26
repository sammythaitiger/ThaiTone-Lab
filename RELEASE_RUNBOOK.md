# Thai Tones Release Runbook

## Local Development

Start backend:

```bash
./scripts/dev-backend.sh
```

Start mobile web:

```bash
./scripts/dev-mobile-web.sh
```

For Android emulator, use:

```bash
cd mobile
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000 npm run android
```

For a physical phone on the same Wi-Fi, use your Mac IP:

```bash
cd mobile
EXPO_PUBLIC_API_BASE_URL=http://YOUR_MAC_LAN_IP:8000 npm run start
```

## Preview Build

1. Deploy the backend behind HTTPS.
2. Set explicit backend CORS origins.
3. Export the API URL:

```bash
export THAI_TONES_ENV=preview
export EXPO_PUBLIC_API_BASE_URL=https://YOUR_PREVIEW_API_HOST
export THAI_TONES_CORS_ORIGINS=https://YOUR_PREVIEW_APP_ORIGIN
./scripts/check-release-env.sh
./scripts/api-smoke.sh "$EXPO_PUBLIC_API_BASE_URL"
```

4. Build internal preview:

```bash
cd mobile
EXPO_PUBLIC_API_BASE_URL=https://YOUR_PREVIEW_API_HOST eas build --profile preview
```

## Production Build

1. Confirm Thai content and tone labels are reviewed.
2. Confirm iOS and Android physical-device audio QA passed.
3. Confirm privacy policy and microphone copy are final.
4. Run:

```bash
export THAI_TONES_ENV=production
export EXPO_PUBLIC_API_BASE_URL=https://YOUR_PRODUCTION_API_HOST
export THAI_TONES_CORS_ORIGINS=https://YOUR_PRODUCTION_APP_ORIGIN
./scripts/check-release-env.sh
./scripts/api-smoke.sh "$EXPO_PUBLIC_API_BASE_URL"
./scripts/release-smoke.sh
```

5. Build:

```bash
cd mobile
EXPO_PUBLIC_API_BASE_URL=https://YOUR_PRODUCTION_API_HOST eas build --profile production
```
