# Partner mobile polish production release

27 October 2026. **Live at https://app.movrr.nl.**

Deployed source: `3fb2906519f7a4c021cc16a654936d17e8fc2cc3`.
Deployment: `dpl_3Jvidhzu4WvdZiZJ9UWd6RAnrUqN`, Ready, Current, production.
The existing Vercel account email was visibly verified as `ops@movrr.nl`.

The earlier push did not trigger a deployment. An explicit Git-source production
build was created in the signed-in Vercel project, with main resolved to the exact
commit. No CLI authentication, new credentials, permission grants, Git auto-deploy
changes or project configuration changes were introduced.

The first build of `e5dc71e` failed because the icon test imported `sharp` without
an explicit dependency. Local npm hoisting had hidden this; Vercel pnpm exposed it.
The correction declares the existing `sharp` 0.35.5 tooling dependency. The affected
five tests and production build/TypeScript pass; Vercel then built successfully.
The release retains the approved Partner mobile UI and the separately authorized
Rider web contract changes. Prepared SQL files were published as source only.
No SQL, migration, gate activation or production financial command was executed.

## Verified production checks

- Vercel detail shows exact source, Ready/Current and `app.movrr.nl` domain assignment.
- 21 public checks: protected routes, Partner manifest identity, exact source icon,
  flag, service-worker and offline assets; anonymous Admin API reads denied.
- Isolated anonymous browser: service worker controls navigation; only offline HTML
  and two public fonts cached; no forms or private cache; Dutch offline screen,
  discarded retry query and protected sign-in recovery pass, without runtime errors.
- SELECT-only before/after checks: Shop Disabled/version 0, migration 085 checksum,
  14 financial/catalog/inventory fingerprints, functions, RLS/grants and migration
  journal unchanged. All four financial-health counts remain zero.
- Previous `9f1660c` production deployment remains Ready for rollback.

## Limits

The prior [source verification](../partner-mobile-distinct-20261027/README.md)
records 175 tests, 236 browser checks, source lint, TypeScript/build and desktop
pixel preservation. This release did not repeat a fresh signed-in production
mobile/desktop walkthrough: native browser interaction encountered minimized-window
and concurrent-user-input interruptions. No session credentials were extracted or
copied. That walkthrough remains separate from the successful public production
checks. Physical installation and camera acceptance on iOS/Android remain pending.
Admin was not redeployed; Rider Mobile was not modified or built.

See [deployment](deployment.json), [public checks](public-acceptance.json),
[offline browser acceptance](pwa-browser-acceptance.json) and
[financial integrity](financial-integrity.json).
