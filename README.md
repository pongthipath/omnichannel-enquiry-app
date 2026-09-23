# omnichannel-enquiry-app

One Expo codebase for **iOS, Android and Web** — the customer app (offline-first) and the staff console of the Omnichannel Customer Enquiry system.

- API: [`omnichannel-enquiry-api`](../omnichannel-enquiry-api) (design docs in its `docs/`) · Infra: [`omnichannel-enquiry-infra`](../omnichannel-enquiry-infra)
- Stack: Expo SDK 57 · Expo Router · React Native + react-native-web · TanStack Query · i18next (th/en) · expo-sqlite (offline outbox) · socket.io-client · Noto Sans Thai Looped

> **Status:** ใช้งานได้ครบทั้งฝั่งลูกค้าและฝั่งพนักงาน — เข้าสู่ระบบ, แจ้งเรื่อง, บทสนทนาแบบ realtime, ไฟล์แนบ,
> ข้อมูลของฉัน + คำสั่งซื้อ, กล่องงาน 3 ช่อง, แดชบอร์ด, ลูกค้า, สินค้า, แท็ก, ตั้งค่า SLA, หน้าจำลองช่องทาง,
> outbox ออฟไลน์บน SQLite พร้อม sync engine · ตรวจบน Android จริงแล้ว (Expo Go) และบนเว็บ · ยังไม่ได้ตรวจบน iOS
>
> เอกสารส่งมอบฉบับเต็ม: [`../omnichannel-enquiry-api/docs/submission.md`](../omnichannel-enquiry-api/docs/submission.md)

## Run

```bash
npm install
cp .env.example .env
npm start          # then press w (web), a (Android), i (iOS) — or scan the QR code with Expo Go
npm run typecheck
npm run export:web # static web build in dist/
```

Libraries with native code (expo-sqlite, expo-secure-store, NetInfo) work in Expo Go; anything added later that isn't bundled with Expo Go needs a development build (`npx eas-cli@latest build --profile development`).

Always add packages with `npx expo install <pkg>` so versions match the Expo SDK (see `AGENTS.md`).

## Structure

```
src/
├─ app/                    # routes only (expo-router) — (auth)/login.tsx, (customer)/…, (staff)/…
├─ components/common/      # shared UI: ConfirmModal, StatusBadge, SlaTimer, ChannelBadge, …
├─ services/               # http-client.ts + one file per API module, one function per endpoint
├─ hooks/queries/          # TanStack Query hooks wrapping services
├─ offline/                # LocalStore interface, SQLite/IndexedDB stores, sync engine, backoff
├─ constants/              # enums (permissions, statuses, channels), query keys
├─ utils/                  # generic pure functions
├─ helpers/                # app/business logic helpers (permissions, error → message)
├─ i18n/                   # i18next setup + locales/{th,en}/<namespace>.json
└─ theme/                  # tokens.ts (colors/spacing), typography.ts (fonts, sizes)
```

Data flow: **component → hook → service → http-client → API**. Components never call `fetch`. Every user-visible string comes from i18n.

## Deploy

- **Web**: `.github/workflows/deploy-web.yml` — `expo export --platform web` → S3 → CloudFront invalidation (`main` → dev, prod manual). GitHub variables: `AWS_REGION`, `AWS_DEPLOY_ROLE_ARN`, `WEB_BUCKET`, `WEB_DISTRIBUTION_ID`, `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SOCKET_URL` (from the infra repo's `terraform output deploy`).
- **Mobile**: EAS Build/Submit (`eas.json` profiles: development, preview, production).

## Known gaps

- Tailwind/NativeWind styling is not set up yet (tokens are applied through `useTheme()` + StyleSheet for now).
- No unit-test runner yet (jest-expo) — the pure modules (`offline/backoff.ts`, `helpers/permission.helper.ts`) are ready to test.
- `constants/permissions.ts` is copied from the API enum; it should be generated from the API.
