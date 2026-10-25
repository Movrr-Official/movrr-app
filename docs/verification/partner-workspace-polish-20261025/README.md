# Partner Workspace polish ? 25 October 2026

Follow-up to deployed Partner `97da8f1528f1cba7a8dd5474808b05b8388efa61` and Admin source `74f0738825d4b6f067eca3ff6a522679e809cee0` (current documentation baseline `fa808a02fdfcce392f6ce300e46ded459bd1bee8`). These changes have not been deployed.

## Changes

- Partner body uses a full-viewport flex column. The footer reaches the bottom of short desktop pages and follows long content without covering forms. Mobile bottom navigation retains its existing behavior.
- Input/Textarea already matched Admin primitives. Removed Partner appearance overrides; desktop fields retain Admin tokens, radius, font, borders, focus/error/disabled states. Phone fields retain 48px touch targets and 16px text. Dropdowns use the shared Radix menu with Admin-compatible popper positioning, border, padding and state styling. Migrated Partner language, reward status and inventory pool controls; cancellation reason uses Input. Native Radix form integration preserves required/disabled behavior and one submitted value.
- Inventory rows show a 48px rounded square beside the name, cover-cropped from the linked catalog thumbnail. Missing, invalid and failed URLs show a decorative placeholder. Cached image failures before hydration are handled. No image upload or merchant data is created.
- Workspace selection uses spacious, responsive cards with workspace type, name, role, current-workspace status, keyboard focus and pending feedback. Uses the existing brand mark, tokens and real membership source. English/Dutch copy includes profile-free account guidance. Partner links carry only the presentation language; the server still re-reads membership before setting the existing HttpOnly workspace cookie.
- Admin changes are an additive read field only: inventory ? catalog ? merchant organisation. The image is withheld if the linked catalog belongs to another merchant. Admin visual design and financial commands are untouched.

## Verification

- App: 23 suites / 141 tests passed; TypeScript and production build passed; changed-file ESLint passed.
- Admin: 4 affected suites / 73 tests passed (inventory image scope, Partner reads, Platform ingress and API client); TypeScript and production build passed.
- Production Supabase schema: authenticated zero-row SELECT returned HTTP 200 for the canonical catalog/merchant relationship. No production records were returned or mutated.
- Browser: 16 before/after route captures across 1440?1000 desktop and 390?844 mobile emulation. All eight final route/viewport cases have zero horizontal overflow, runtime errors or axe WCAG A/AA violations. Dropdown selection submits the correct resource ID; keyboard opening/Escape restores focus. Images loaded or fell back correctly. Additional menu and dark-field screenshots retained.
- Footer geometry passed at 1920?1080 and 1440?650; tablet 820?1180 retains mobile navigation. Long-form document height 897px at a 650px viewport, footer starts below the form. Dutch workspace and settled dark-mode accessibility checks passed.
- Whole-repository App lint remains red on unchanged files: `app/account/deletion-receipt/page.tsx` (existing Date.now/purity rule) and existing CommonJS capture tools (no-require-imports). Their content is unchanged from the deployed baseline. Do not describe whole-repository lint as green. Existing Rider icon-quality test warnings also remain unchanged.

## Visual evidence

| Page | Desktop before / after | Mobile before / after |
|---|---|---|
| Workspace selection | [Before](before-workspaces-desktop.png) / [After](after-workspaces-desktop.png) | [Before](before-workspaces-mobile.png) / [After](after-workspaces-mobile.png) |
| Inventory | [Before](before-inventory-desktop.png) / [After](after-inventory-desktop.png) | [Before](before-inventory-mobile.png) / [After](after-inventory-mobile.png) |
| Reward fields | [Before](before-fields-desktop.png) / [After](after-fields-desktop.png) | [Before](before-fields-mobile.png) / [After](after-fields-mobile.png) |
| Collections footer | [Before](before-collections-desktop.png) / [After](after-collections-desktop.png) | [Unchanged](after-collections-mobile.png) (captures identical) |

## Evidence boundary and reproduction

These are actual Next routes, components and form actions rendered with isolated session, notification and read-transport fixtures. Business commands reject; no production merchant, inventory, role, voucher or financial record is created. Fixture inventory names/images are explicitly layout samples, not merchant supply. This is Chromium emulation, not physical-device camera/PWA acceptance or signed-in production acceptance of this revision.

Run from the App repository. Build once to make the approved Manrope asset available. `node docs/verification/partner-workspace-polish-20261025/prepare.mjs before` and `.../prepare.mjs after` create isolated checkouts under `.tmp/partner-footer-20261025`. The preparer refuses to overwrite existing scratch. Start each checkout with Next webpack on 127.0.0.1 ports 3317 and 3318 respectively. Provide `MOVRR_PLAYWRIGHT_MODULE` as a separately available playwright-core module path (Chromium installed), and `MOVRR_AXE_SCRIPT` as an axe-core script path. Run `node docs/verification/partner-workspace-polish-20261025/capture.mjs`. Both versions use the same cached production Manrope asset, hash recorded in results; external network requests are blocked in primary captures.

After preserving evidence, stop only those two servers, remove their node_modules junctions without recursion, then remove only this task's scratch directories. Never remove shared dependencies or recovery backups.

## Rollout boundary

Deploy only after approval of the exact new commits. Order: Admin additive thumbnail read first, then Partner. No migration is needed; migration 085 remains deployed and unchanged. Verify signed-in Inventory (including missing image), workspace selection/locale, short and long footer layouts, required dropdown submission, and mobile scanner/phone handoff after deployment. Roll back the affected application alias if inventory reads fail, workspace selection denies valid membership or accepts invalid membership, fields submit incorrect values, or rendering regresses. Existing approved deployments remain the rollback targets; never replay 085.

Public Shop redemption stays Disabled. No production financial checks with mutations, merchant creation, role changes, native builds, OTA updates or Community Safety changes are authorized by this follow-up. Physical-device QR/PWA and real merchant supply/launch attestations remain separate public-redemption gates.
