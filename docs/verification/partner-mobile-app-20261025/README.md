# Dedicated MOVRR Partner mobile PWA — 25 October 2026

Implemented in `movrr-app`. No Rider Mobile or Admin source changes, deployment,
production mutation, account creation, inventory creation or dependency changes.
Baseline: `add3f66ed6fd4c7654239fb73ee99eaceef946c8`.

[Visual comparison](comparison.html) · [Browser evidence](browser-results.json)

## Presentation architecture

- `PartnerShell` selects separate `PartnerMobileShell` and `PartnerDesktopShell`
  components using a live `(max-width: 1023px)` media query. No user-agent checks,
  duplicate backend, alternate permissions or mobile-only financial commands.
- The original desktop shell is extracted without behavioral changes. Its
  responsive server-rendered markup remains the initial/hydration fallback.
  Phones receive the dedicated app after hydration, including normal browsers.
- Standalone mode retains the same mobile product, hides installation controls
  and applies safe-area/overscroll treatment. Wide installed windows retain
  desktop management UI. The scanner independently requires coarse primary
  input, no hover and a narrow viewport; a resized desktop keeps phone handoff.
- Existing `/dashboard` URLs, server guards, Platform services and actions remain
  canonical. No redirect loops or mobile URL namespace to break deep links.
- Shell state remounts on actor or partner organisation changes. Account switching
  uses the existing full-document workspace chooser and POST signout endpoint.

## Mobile product

Five tabs: **Home / Activity / Scan / Rewards / Account**, with a prominent central
Scan action. Account is a full route rather than the desktop sidebar in a sheet.
Headers provide contextual parent links; browser Back retains actual navigation
history. Main content receives focus after route changes. Existing transient
controls retain Back/Escape dismissal and focus restoration.

Home has a dedicated composition: scan launch card, pending/validated queue cards,
completed collection summary and permission-aware merchant shortcuts. Counts come
only from the existing dashboard model. Account shows the authenticated identity,
capability-filtered management links, appearance, workspace switching and signout.
Activity uses collection cards; rewards retain visual catalog items; inventory,
staff, settings and editors reuse their existing authorized mobile forms/cards.
These screens inherit the app shell without new table-based mobile interfaces.

Lexend headings, Plus Jakarta Sans copy, green/neutral surfaces, rounded 20–28px
cards, pill controls and layered navigation follow current Rider sources. The
comparison uses the existing actual Rider Button/ScreenHeader web-adapter render.
All seven Rider source hashes in the prior `source-hashes.json` were rechecked and
match; this is a design-reference render, not a native Rider or physical capture.

## Scanner and security

The canonical scanner and handover code are unchanged: camera permission/fallback,
rear-camera capture, server validation, stable retry identity, review link, explicit
physical handover acknowledgement, capability/version checks and canonical commands.
Desktop retains **Continue on your phone**, never token input or camera capture.
The API's existing unavailable outcome explicitly covers expired, cancelled,
refunded and already-used rewards without guessing which condition occurred.
Recipient display names are not supplied by the current fulfilment read model;
this change preserves the existing QR/rider review flow and does not invent names.

Partner dashboard metadata selects `/partner/manifest.webmanifest`, named **MOVRR
Partner**, using the existing MOVRR icons, standalone display, `/dashboard` launch
and `/` scope/id. Keeping the existing app id avoids a competing installation or
authentication authority. Other product metadata retains its existing identity.

Existing viewport-fit, safe areas, 16px inputs, keyboard-aware tab visibility,
session guards and public offline document are retained. Actual service-worker
cache inspection found exactly the offline page and two public fonts. No dashboard
HTML, merchant records, credentials, tokens, mutations or offline redemption queue
is cached. Offline retry drops the query and reconnects to the original route.
Notifications use existing in-app notification/deep-link behavior; no new push
subscription system is introduced. Shop configuration is untouched: this change
does not enable the previously Disabled redemption gate. No live state was queried.

## Verification

| Check | Result |
| --- | --- |
| Full App tests | 30 files, 161 tests passed |
| Platform financial/Partner/authorization regressions | 3 files, 34 tests passed |
| TypeScript | Passed |
| Production build | Passed, including explicit Partner manifest route |
| Lint of all changed TS/TSX/JS sources | Passed |
| Full repository lint | 16 existing errors, 2 warnings in unchanged files |
| Browser checks | 116 passed; 66 route/locale/viewport compositions; no runtime errors |
| Viewports | 320×740; iPhone XR 414×896; S23 Ultra emulation 412×915 |
| Desktop preservation | Home, Scan and Rewards pixel-identical at 1440×1000 |

Browser checks include English/Dutch, tab selection, contextual Back, route focus,
overlay Back dismissal, permission-denied camera fallback, offline/reconnection,
canonical switching/signout links, notification return navigation, touch targets,
reduced motion, dark Home/Scan/Account and 200% text scaling. Software keyboard and
standalone display are simulated, not physically accepted. Unit tests exercise
scanner/handover authorization, idempotency, read-only roles and session isolation.

Full lint failures are in unchanged `app/account/deletion-receipt/page.tsx`
(`react-hooks/purity`) and existing CommonJS verification scripts
(`no-require-imports`): `scripts/capture-partner-visual.cjs`,
`scripts/verify-partner-interactions.cjs`, and
`docs/verification/partner-phone-handoff-20261025/capture.cjs`. Warnings are in the
existing notification source and header/image verification script. They were not
silently suppressed or mixed into this presentation change.

Screens render actual route components with isolated test authentication, empty
read models and rejected mutations. No merchant records or positive commercial
metrics were fabricated. Google-hosted non-Partner fonts fall back in this local
harness; Partner's local Rider-aligned fonts load normally on both baseline and
candidate. Desktop comparison is against the same isolated environment.

## Reproduction and release decision

Set `MOVRR_PLAYWRIGHT_MODULE` to an installed Playwright module. Run
`node scripts/prepare-partner-mobile.mjs before` and `after` from this repository.
Start the isolated checkouts with the pinned Next CLI on localhost ports 3341 and
3342, then run `node scripts/verify-partner-mobile.mjs`. The preparer refuses to
overwrite existing scratch. On later commits, its baseline is the current HEAD;
use the recorded baseline above when reproducing the original comparison.
Run App `test`, `typecheck`, `lint`, and `build` separately; production builds need
the existing valid HTTPS Platform API configuration. This verification used a
non-routable `https://platform-build.invalid/api` build origin, not live commands.

**GO for source review. NO-GO for controlled production deployment in this report.**
Full-repository lint failures require explicit triage and physical-device acceptance
remains open. Separate deployment authorization is also required. No deployment
was attempted. Shop public redemption remains outside this release decision.

Physical acceptance still required on iOS Safari/Home Screen and Android Chrome:
installation/upgrade identity, icons/splash/status-bar/cutouts, camera focus and
permission revoke, background/resume, real network interruption and duplicate
handover, keyboard/file picker, assistive technology, and authenticated
actor/workspace switching with real authorized test memberships. The browser
checks and unit tests do not establish those operational outcomes.
