# Partner mobile refinements — production release

27 October 2026. **DEPLOYED & VERIFIED** at https://app.movrr.nl.

Application SHA: `9fca7ec7d6001f418b263d04528c3b350f1cc39e`.
Deployment: `dpl_GeJ4yM6hFZXjRGyNeY9EQuQn5KA7` (Ready, production domain assigned).

The authorized normal main push was followed by the established explicit Git-source
production deployment through the existing signed-in `ops@movrr.nl` Vercel account.
No CLI credential dependency, credentials, project configuration, permissions or
Git auto-deployment settings were introduced. The prior Ready deployment
`dpl_3Jvidhzu4WvdZiZJ9UWd6RAnrUqN` remains preserved for rollback.

## Production acceptance

- 21 public checks pass, including protected Partner routes, correct MOVRR Partner
  standalone manifest, exact deployed icon/assets and anonymous canonical API denial.
- Existing signed-in Partner session: desktop workspace and phone QR handoff remain
  available; dedicated mobile Home, Activity, Scan, Rewards and Account render with
  real authorized data. Catalog FAB, single headers and loading replacement verified.
- English/Dutch switches work; English restored. Browser Back dismisses the language
  sheet while retaining Account. Notifications load and dismiss with Escape.
- Workspace chooser exposes the existing authorized workspace; selecting it returns
  to authenticated Home. A separate existing advertiser session remains scoped to
  its authorized workspace. No credentials were extracted or copied.
- Anonymous live browser offline/recovery checks pass: exactly offline HTML and two
  public fonts cached, no private records or forms, Dutch fallback, discarded retry
  query and protected sign-in recovery. No runtime errors.
- SELECT-only before/after checks, repeated after the signed-in walkthrough: Shop
  **Disabled**, version 0, redemption false; all 14 financial/catalog/inventory
  fingerprints, function definitions, RLS/grants and migration journal unchanged.
  Migration 085 matches the approved checksum. All four health counts remain zero.

## Source and desktop regression evidence

[Source acceptance](../partner-mobile-finish-20261027/README.md) records 185 tests in
35 suites, 419 browser checks, TypeScript, changed-source lint and production build
passing. Eight desktop views remain pixel identical. The 16 inherited repository
lint errors were previously dispositioned and were not reopened. Vercel production
build succeeded. Admin and Rider Mobile were not modified or deployed; no migrations
or production financial/catalog/inventory commands ran.

## Acceptance limits and status

Controlled production release: **GO; deployed**. Browser production acceptance:
**PASS within the checks above**. Authenticated mobile walkthrough used browser
emulation at 360×800; anonymous offline acceptance used 390×844. Source acceptance
also covers 414×896 and 412×915; those are not physical-device claims.

Physical iOS/Android installation, standalone launch and real camera scanning remain
separate operational acceptance. No production token validation or fulfilment was
performed. Session/chooser checks and unchanged authorization fingerprints do not
claim a fresh adversarial tenant-isolation penetration test. No genuine deployment
or financial-integrity blocker was found in these checks.

See [deployment](deployment.json), [signed-in checks](authenticated-acceptance.json),
[public checks](public-acceptance.json), [offline checks](pwa-browser-acceptance.json)
and [financial integrity](financial-integrity.json). Merchant records, identity details,
private screenshots and per-table private fingerprints are excluded from this report.
Any following commit containing this report is documentation only; the deployed
application revision above is unchanged.
