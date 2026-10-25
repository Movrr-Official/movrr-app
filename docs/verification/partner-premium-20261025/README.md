# Partner Workspace visual acceptance - 25 October 2026

Open [the before/after gallery](index.html). The baseline is reviewed commit `2e544099e5a5e61376a24879f156a63c92212bd1`; the final implementation is the commit containing this evidence. [Source hashes](source-manifest.json) identify the exact implementation and regression inputs.

## What was rendered

The actual Next application routes, layouts, production components, server actions and Partner service adapters were copied into isolated local checkouts. Session identity, Platform transport and notification reads are explicit test boundaries. Read models are empty canonical responses; mutation adapters reject requests. No merchant identities, inventory, KPIs or business details were created in production or fabricated to decorate the UI. These are component/route acceptance fixtures, not signed-in production acceptance.

The reviewed before routes ran on localhost:3317 and final routes on localhost:3318. The same exact cached production Manrope font asset was injected into both captures because the isolated dev server cannot reach Google Fonts. The font hash is recorded in each matrix. No production credential is copied into these checkouts.

[Before matrix](before-route-matrix.json): 11 routes at 390x844, 820x1180 and 1440x1000. [Final matrix](after-route-matrix.json): the same routes plus collection history, 36 combinations. Final results: all HTTP 200, no horizontal overflow, no visible fixture UUIDs, no runtime/hydration errors and no detected WCAG 2 A/AA / 2.1 AA violations using axe-core 4.11.0. Automated checks do not establish full assistive-technology acceptance.

[Interaction results](interaction-results.json): 20 checks cover skip navigation, native modal opening/Escape/navigation, persisted actor-bound Dutch preference, menu closure after saving, camera-denial fallback, stable scan identity, rejection feedback, offline command controls, actual reward form action errors, viewer denials, dark theme and the service-worker offline document. Four state captures also have zero detected accessibility violations. Camera permission is deliberately denied by a test adapter; no physical camera/installation claim is made.

[Cross-browser smoke](cross-browser.json): mobile WebKit navigation/modal/overflow passed. Firefox automation failed at `browser.newPage` before loading MOVRR; it was not accepted. These are desktop browser engines, not physical iOS/Android devices.

The final gallery retains only useful before/after comparisons and final operational-state images; superseded captures remain disposable task files. Mobile images show a real viewport rather than stitching a fixed bottom bar into a long page.

## Changes represented

- A Partner-only shell with forest brand chrome, persistent desktop navigation, a thumb-accessible scan action, mobile tabs and an accessible native More dialog.
- A scan-led overview with compact real-data summaries and clear next actions.
- Reward cards, persistent form labels, clearer draft messaging, useful inventory empty states, readable team access forms, organization settings and quieter notifications/activity surfaces.
- Pending/history separation through the existing canonical fulfilment read authority; closed records remain viewable and do not invite another handover. No financial command or authorization authority was changed.
- Consistent English/Dutch presentation, deterministic theme hydration, accessible light/dark contrast, matching loading/error states and merchant-friendly offline copy. The offline cache version changed with that public document; no private response caching or offline redemption queue was added.

## Reproduction

Use the pinned repository dependencies and installed Playwright tools. Set `MOVRR_PLAYWRIGHT_MODULE` to the local `playwright-core` package directory and `MOVRR_AXE_SCRIPT` to axe-core 4.11.0's `axe.min.js`. These are verification tools, not new application dependencies. Build the Partner app first so its approved Manrope font asset is available.

```powershell
node scripts/prepare-partner-visual.mjs before
node scripts/prepare-partner-visual.mjs after
# In separate terminals, from each resulting checkout:
node ../../../node_modules/next/dist/bin/next dev --webpack -H 127.0.0.1 -p 3317
# Use port 3318 for the after checkout.
# From the repository root:
node scripts/capture-partner-visual.cjs before
node scripts/capture-partner-visual.cjs after
node scripts/verify-partner-interactions.cjs
```

The preparer refuses to overwrite an existing checkout. Each checkout uses a node_modules junction; remove only that junction before recursively cleaning task storage. Keep necessary accepted evidence, and preserve other sessions' files.

The coordinated release, migration checksum and production boundaries are in the [Admin runbook](../../../../movrr-admin/docs/operations/partner-workspace-release-candidate-2026-10-25.md). Physical iOS/Android install/camera/focus, real merchant/provider delivery and deployed signed-in acceptance remain operational gates before public redemption.
