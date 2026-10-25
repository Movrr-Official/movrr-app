# Dedicated Partner Mobile PWA — production closure

**DEPLOYED & VERIFIED.** The dedicated mobile PWA is live at
https://app.movrr.nl alongside the preserved desktop Partner Workspace.

- Exact deployed source: `9f1660c24ad8d03fceef40d3f4a67f0dfa0857e6`.
- Deployment: `dpl_B7zLyuPVEtABToomS2Ygb6tJ2xLX`, READY, production, fra1.
- Immutable URL: https://movrr-ocfjv8ysr-movrrops-projects.vercel.app.
- Previous production retained READY for rollback:
  `dpl_2LvsRMQYFMQHGrzGCjQ2wtLmBY7t`, source
  `b33e34dec03fcc757a7e4423989d49b065abacce`.
- The documentation-only follow-up `ab5dcde` was not substituted for the approved
  application revision. This closure adds documentation only and is not a second
  application deployment.

## Established deployment mechanism

The recorded successful Partner runs create deployments through Vercel REST
`POST /v13/deployments`, with the existing project, `target: production`, and an
exact GitHub `gitSource.ref`. They then poll `GET /v13/deployments/{id}` and verify
READY, the Git SHA, and `GET /v4/aliases/app.movrr.nl`. The existing project assigns
its production domain on readiness. No local CLI build or automatic Git deployment
is required.

The earlier direct saved-token check was insufficient evidence of lost access.
The existing managed Vercel API session successfully accessed the project without
a new login, credential, permission grant or configuration change. The same REST
deployment process was then reused. No alternate deployment account was created.

GitHub did not yet contain the approved application commit. After the owner's
explicit additional approval, `main` was fast-forwarded from `add3f66` to `9f1660c`,
with no history rewrite. Git auto-deployment stayed disabled. Production creation
was an explicit REST request pinned to `9f1660c`, following fresh configuration,
concurrency, Shop Disabled and read-only financial checks.

The prior [stopped checkpoint](stopped.json) and
[resume preflight](resume-preflight.json) are retained as historical execution
evidence and are superseded by this closure and [deployment record](deployment.json).

## Targeted production acceptance

| Area | Result |
| --- | --- |
| Source/domain/rollback | Exact SHA, READY deployment, production alias and retained READY rollback verified through Vercel API |
| Desktop | Existing signed-in session loaded overview, catalog, inventory, team, settings, analytics, pending/history collections and scanner handoff; approved rail, typography, surfaces and management compositions retained |
| Mobile | Actual authenticated Home, Activity, Scan, Rewards and Account screens rendered in Chrome 390×844 phone emulation; dedicated headers and five tabs, with no desktop sidebar |
| Navigation | Tabs, browser Back between destinations, Back dismissal of language overlay while remaining on Scan, notification deep link and Home return path passed |
| Language/design | English/Dutch, light/dark presentation observed; Dutch preserved through canonical workspace chooser and re-entry |
| Identity/workspaces | Existing identity retained, only its existing authorized workspace offered, canonical selection and re-entry succeeded; no account or membership changes |
| Scanner/handoff | Desktop Continue on your phone and canonical production scanner URL retained; mobile camera-first guidance/manual fallback present; no camera request, voucher entry, validation or handover submitted |
| PWA assets | Partner manifest serves MOVRR Partner, standalone display, existing `/` installation id/scope and `/dashboard` launch; any/maskable icons, flags, SW and offline assets served; approved asset bytes verified |
| Offline/recovery | Isolated anonymous production Chromium confirmed SW control, exact three-public-asset cache, no offline forms/private cache, Dutch fallback, discarded query and recovery to protected sign-in |
| Authorization | Anonymous Partner routes redirect to sign-in; read-only Admin API requests return application-level 401; a SELECT-verified existing foreign-organisation reward edit URL returned Page not found without reward details |
| Restoration | Original English, dark theme, desktop viewport and scanner route restored; temporary DevTools closed |

Authenticated checks used the existing Chrome profile directly. No cookie, bearer
token or authenticated storage was copied into an automation browser. Raw native
UI observations stay in task-specific ignored storage rather than publishing
identities or unrelated browser tabs. No notification preference or read-state
command was submitted.

The prior [source readiness evidence](../partner-release-readiness-20261025/README.md)
remains the test/build and desktop pixel-comparison evidence. Completed lint and
implementation audits were not reopened during this deployment.

## Integrity and operating boundaries

[Before/after integrity](financial-integrity.json) proves all 14 existing
financial/catalog/inventory table fingerprints unchanged; zero wallet mismatches,
unpaired paid claims, pending deliveries or delivery failures; unchanged function
bodies/owners/grants, RLS/policies/table grants and migration journal.

Migration 085 remains journal `20261025150000`, checksum
`c45e511cc771382b34dec6d3306343e17a9e66a22f33c415299ccb961896fb24`.
No migration ran. Admin remains deployment `dpl_n2M4CuqU8hCcv4Na3nKZJQJiDqCJ`,
source `19790c43a92b9ba11996a8e23bd8cb091397855c`; it was not redeployed.
Existing production environment bindings and project/security settings match the
preflight baseline; see [final platform verification](platform-verification.json).

**Shop remains Disabled**, version 0, `redemption_enabled=false`.
No production reward, merchant, account, inventory, redemption, refund, points,
membership or financial record was created or changed. Rider Mobile and Admin
source are unchanged. No EAS build, OTA update or store submission ran.

## Final status

The controlled Partner Mobile PWA deployment is complete, with no remaining
software deployment blocker found. Desktop Partner remains intact. Public Shop
redemption remains **NO-GO / Disabled**.

Physical iOS/Android installation, launcher/splash/status-bar/safe-area behavior,
camera focus and permission revoke, background/resume, real interrupted-network
handover, keyboard/file picker and assistive-technology acceptance remain separate
operational checks. Browser emulation does not establish those outcomes. No
physical-device acceptance or live redemption journey is claimed.

Evidence: [deployment](deployment.json), [authenticated acceptance](authenticated-acceptance.json),
[Partner routes/assets](partner-acceptance.json), [unchanged Admin](admin-acceptance.json),
[production offline browser](pwa-browser-acceptance.json),
[integrity](financial-integrity.json), [platform/rollback](platform-verification.json).
