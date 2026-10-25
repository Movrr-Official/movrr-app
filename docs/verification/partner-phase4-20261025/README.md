# Partner Phase 4 completion — 25 October 2026

**Software scope: COMPLETE. Browser mobile quality: PASS against the scoped MOVRR alignment and interaction gates. Real-device/merchant operational acceptance: still PARTIAL.** This is a verified source candidate, not a production deployment or public-redemption approval.

[Final screens](index.html) · [Current Rider/Partner comparison](comparison.html) · [Browser checks](results.json) · [Small-screen/keyboard checks](mobile-edges.json) · [Final mobile accessibility sweep](final-mobile.json) · [Source hashes](source-hashes.json)

## Audit finding disposition

| Finding | Resolution and evidence |
|---|---|
| F1 — active reward save contradicts approval | Partner editing offers Draft, Paused or Archived, never Active. Active items default to draft review and require explicit withdrawal acknowledgement in both UI and server action. Copy explains loss of availability and MOVRR reapproval. Forged Active saves are rejected before command dispatch. Canonical approval SQL and Admin authority are unchanged. Actual server-action and browser form journeys reached the actual Admin catalog command and canonical SQL in a disposable local database. |
| F2 — Back/menu/navigation | Shared Partner overlay history preserves Next state and consumes Back for More, language, installation, notifications, selections and confirmation dialogs. Navigation waits for history restoration before pushing its destination. Explicit close/Escape restores focus. Nested reward/collection pages have contextual parent links; tab reselection returns to the overview and scrolls to top. Route cleanup closes stale overlays. |
| F3 — mobile design coherence | Partner-scoped Lexend emphasis and Plus Jakarta Sans supporting text match Rider's actual fonts. Neutral light canvas, brand dark surfaces, 16/24/32 spacing, soft cards, pill actions, layered navigation, contextual headers and reduced-motion feedback replace the old flat dashboard treatments. Overview copy and scanner duplication are reduced. All existing Partner routes use the same foundation. Shared Admin Button implementation is retained; Admin and Rider source/design are unchanged. |
| F4 — compact actions | Partner form/action controls default to 48px; header controls remain at least 44px. Inputs use 16px text. Staff access revocation now has an explanatory, Back-dismissible confirmation without changing the membership command. Measured create controls are all 48px. |
| F5 — viewport/safe areas | viewport-fit=cover, dynamic viewport heights, top/bottom/side insets, scroll padding, bounded scrolling sheets and visualViewport keyboard adaptation are implemented. 320px portrait and short landscape checks pass. Keyboard geometry is simulated, not physical acceptance. |
| F6 — offline/standalone | Public offline screen uses the same local fonts, selected language and theme, reports reconnection and retries the original dashboard path without retaining its query. No private API response, credential, voucher or command is cached. Cache is exactly offline.html and two public fonts. Installed display mode hides redundant installation controls. A padded maskable icon is derived from the approved icon. |
| F7 — physical/merchant evidence | **Still open operationally.** Browser emulation, a simulated standalone media query and local canonical command tests do not establish physical camera, OS installation, provider delivery or merchant handover acceptance. See remaining gates below. |
| F8 — presentation/scope reconciliation | Role/status labels are merchant-facing; Activity naming is consistent. Blank workspace names have a generic organisation fallback. Stored merchant inventory names are preserved rather than silently renaming business records. The owner-approved pending/ready/completed overview is retained. The original conditional failure-rate placeholder had no dedicated canonical rate field; it is retired rather than inventing a denominator/window or KPI. Canonical state/count activity remains available. Organisation editing remains the documented Admin-owned replacement for the original unsupported Settings PATCH form. |

The recovered original programme has **Phase 2 Admin Operations** and **Phase 4 Partner Workspace**. No separate approved Partner Phase 2 was recovered; it remains NOT VERIFIABLE and is not counted as missing work. Original Plan 4 session, collection, QR, resources, rewards, staff and analytics scope is implemented; Settings uses its previously approved read-only replacement. Software journey evidence closes the catalog integration defect. Real-world Plan 4 end-to-end acceptance remains conditional on the operational gates, so an unqualified claim of complete merchant acceptance would still be incorrect.

## Functional and visual verification

- **156 App tests** pass in 28 files, including withdrawal consent/localization and Back/Forward/overlay history regressions. Existing account isolation, scanner, fulfilment, PWA, notification and role guards remain covered.
- **39 affected Admin tests** pass in 8 files: catalog preconditions, media concurrency/rollback, foreign-tenant denial, inventory/catalog image reads, readiness and invitations. No Admin source was changed.
- **10 direct canonical journey assertions** pass: actual Partner server actions → actual catalog adapter → actual Admin catalog command → captured canonical shop_save_catalog in a disposable PostgreSQL database. Checks cover create-as-draft, edit/save, acknowledged active withdrawal, forged Active denial, stale versions, unauthorized actor and no denied-write audit mutation.
- **126 browser assertions / 104 route-language-theme-viewport combinations** pass with zero detected axe WCAG 2 A/AA and 2.1 AA violations, zero horizontal overflow and no runtime errors. Includes actual create, image upload/edit/removal and active-to-draft form submission, menu/select/popover Back, notification navigation, text scaling, reduced motion, offline/reconnection and simulated standalone controls.
- **14 additional edge checks** pass at 320×720 and 844×390, including header control bounds, 48px form targets and simulated keyboard navigation removal.
- **20 final mobile route/theme checks** pass with zero detected accessibility violations after the final header/layout adjustments.
- **4 final state checks** pass after screenshot review: generated UUID references stay out of the visible field, an untouched reference is preserved on canonical save, the offline document makes no initial recovery claim, and explicit retry returns to the protected intended route. Browser network hints are not proof of server reachability; automatic online-event feedback was not observed in this emulated navigation, while explicit recovery succeeded.
- TypeScript and the production build pass. Build uses the real `https://admin.movrr.nl/api` origin required by the existing environment guard; this is a local build, not a deployment configuration replacement.
- Targeted lint passes for changed source, tests and reproducible tools. Full App lint was run and still reports **16 existing errors / 2 warnings** in unrelated deletion-receipt code, older CJS evidence scripts and the existing notifications parameter. These were not suppressed or changed. Existing test-only Next image-quality warnings also remain outside this change.

Automated accessibility checks do not establish complete assistive-technology acceptance. Browser reduced-motion/text-scaling and 48px control checks are separate evidence, not substitutes for it.

## Evidence boundaries

The visual harness copies actual routes, layouts, components and actions into an ignored isolated checkout. Session and notification reads are explicit fixtures. Catalog writes go to a localhost-only bridge using the actual Admin application commands and canonical captured SQL. Database transport and image storage are adapters; storage is an in-memory provider, not Supabase production storage. Test identities and contract-test rewards exist only inside the disposable local database and are not merchant supply or production records. Other operational reads are empty. No KPIs, testimonials or commercial inventory were fabricated to decorate the screens.

`rider-primitives-current.png` renders the **current** Rider Button and ScreenHeader through React Native Web, with declared Paper/font and Expo gradient adapters and no account/business data. It establishes source-based typography, geometry and action alignment, not native-device or full Rider-app acceptance. Mobile sources are unchanged; hashes identify the inputs. The earlier audit's historical Rider screenshot is not relabelled as a current build capture.

A narrow production **READ ONLY** check returned `activePartnerCatalogWriteDenied=true` and Shop `{state:"disabled",redemption_enabled:false}`. No balances or historical financial records were inspected or changed. No migration, deployment, account creation, live inventory change, refund, role change, EAS/OTA or store submission was performed. Account deletion and Community Safety source remain unchanged.

## Reproduction

Use pinned dependencies in sibling `movrr-app`, `movrr-admin` and read-only `movrr-mobile` checkouts. Set `MOVRR_PLAYWRIGHT_MODULE`, `MOVRR_AXE_SCRIPT` and `MOVRR_ESBUILD_MODULE` to installed local verification tools; no new runtime dependency is introduced.

1. Start a **disposable** PostgreSQL 17 instance bound only to `127.0.0.1:55443`, user postgres, password `isolated-local-test-only`. The verifier hardcodes localhost and never reads .env. It creates its own process-named database from Admin's existing captured catalog/schema fixtures.
2. Run `node scripts/verify-partner-catalog-flow.mjs --serve`. This runs the direct canonical journey then keeps its localhost bridge on port 3339.
3. Run `node scripts/prepare-partner-phase4.mjs after`. It refuses to overwrite an existing task checkout. From `.tmp/partner-phase4-20261025/after`, run the pinned Next dev server on 127.0.0.1:3318. Do not run the production application against a fixture API.
4. From the App repository run `node scripts/verify-partner-phase4.mjs`, `node scripts/verify-partner-mobile-edges.mjs`, `node scripts/verify-partner-final-states.mjs`, `node scripts/render-partner-rider-reference.mjs`, then `node scripts/finalize-partner-phase4-evidence.mjs`. The renderer reads actual Mobile sources without editing them.
5. Stop the test servers and remove only this task's disposable database/container. Keep source, fixture inputs and useful release evidence. Do not remove another session's checkout or scratch storage.

Do not run a root production build concurrently with the isolated Next dev compilation. The local production build needs an explicit valid HTTPS Platform API origin under the existing configuration guard.

Implementation references: `components/partner/{PartnerShell,PartnerSelect,RewardEditStatus,ConfirmSubmitButton,PartnerAppStatus}.tsx`, `lib/usePartnerOverlay.ts`, Partner actions, `app/partner.css`, `public/{sw.js,offline.html}`. Original plans and financial contracts remain authoritative in the Admin repository.

## Release and remaining gates

**Source candidate: GO for review and a separately authorised controlled Partner deployment. Not deployed by this task.** `vercel.json` keeps Git-triggered deployment of main disabled; pushing the verified source does not enable production rollout. No migration or Admin release is required for these Partner-only changes.

**Supervised merchant pilot: CONDITIONAL. Public redemption: NO-GO, Disabled.** Still required:

- Physical iOS Safari/home-screen and Android Chrome installation, launcher/splash/cutout/landscape checks, software keyboard/file picker/focus and assistive-technology acceptance.
- Actual camera allow/deny/revoke, rear-camera focus, background/resume, interrupted network/handover, duplicate scans and account/workspace switching on installed devices.
- Existing approved merchant identities, genuine voucher/provider supply, published collection locations where needed, trained staff, notification/invitation delivery and merchant operating attestations.
- Separately authorised production deployment and its targeted signed-in acceptance. Any live financial exercise requires its own explicit authorisation; these tests do not provide it.

No physical-device or commercial-readiness PASS is claimed.
