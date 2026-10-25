# Partner header, reward media and button follow-up ? 25 October 2026

This candidate follows Partner `9c2db98b3dad424757e0e08855862f77a0f86c58` and Admin `6c825a5ee4de1f57e842f9dace43d2553f1d4fd2`. Source and isolated acceptance only: this follow-up has not been deployed.

## Changes

- EN/NL language menu: locally served, MIT-licensed UK/NL SVG flags; flag-only trigger with an accessible language label; named menu choices and a selected check. Radix Popover provides outside-click dismissal, Escape and focus restoration. Existing actor-bound language action remains authoritative.
- Notification bell: five recent notifications from the same authenticated account inbox, read-only preview, localized loading/empty/error/retry/offline states and View all to the existing inbox. Opening does not mark items read. Late results are discarded after closing or unmounting.
- Partner text sizes: navigation/body support text increased modestly; narrow mobile header remains within the viewport. Form input text stays 16 px on mobile.
- App Button source matches Admin's actual `components/ui/button.tsx` after line-ending normalization. Default height 36 px, text 14 px. The owner subsequently requested white primary labels. Partner-scoped tokens blend existing MOVRR greens equally, producing RGB(4,119,53), with near-white RGB(252,252,252). Normal/focus contrast 5.54:1; `/90` hover remains at least 4.58:1 even against white. Admin's design and Rider Mobile sources are unchanged. Header/scanning controls retain their deliberate larger touch targets.
- Reward cards use the canonical image URL as a 16:6 banner with overlaid localized status. Missing/broken images use the existing image fallback.
- Create/Edit Reward now include an image chooser, preview, replace/remove controls and EN/NL copy. JPEG/PNG/WebP, maximum 3 MiB, keeps the complete multipart request below the existing production function limit. Server Actions are bounded to 4 MiB. Existing reward-catalog storage remains limited to 5 MiB; no policy/migration changes.
- Multipart uses the existing authenticated Platform client, bearer token, selected organisation and no-store behavior. Canonical capability checks run before parsing on Admin. The API validates byte signatures and size, resolves merchant ownership, checks the viewed catalog version before storage and writes through `shop_save_catalog`.
- Updates save metadata/image reference together under the existing optimistic concurrency contract. A failed canonical update removes only its new immutable upload. Existing images are retained because gallery references may share them. Create validates first, creates the normal draft, then attaches its image using the returned version; attachment failure returns that existing draft with an explicit retry warning. No duplicate creation is requested by the recovery flow.

## Verification

- App: TypeScript, 153 tests across 26 files, changed-source ESLint, production build with the real configured API origin `https://admin.movrr.nl/api`.
- Admin: TypeScript (also its configured lint gate), 27 targeted tests across five catalog/media suites, production build. Admin does not configure ESLint; no new lint tool was installed.
- Actual Create/Edit/Rewards components rendered in isolated checkouts: desktop 1440?1000, mobile 390?844; additional overflow/header/error/offline checks at 320, 360 and 820 px. Original baseline and candidate use the same isolated identity boundary.
- Preview selection, replacement/removal, invalid type, existing image, EN/NL presentation; dropdown outside dismissal, Escape/focus return, mutual exclusion; notification empty/loading/five-item/error/retry/offline/late-result states and View all navigation verified.
- Axe WCAG A/AA: zero violations on checked light EN/NL and dark create routes. Button normal/hover/focus white-label contrast and dimensions verified in both themes; see `button-results.json`.
- Existing non-blocking Rider Next Image quality warnings remain. Previously recorded full-repository ESLint debt in account deletion and an old CommonJS capture script is outside this change; changed-source ESLint passed.

These are browser-emulated viewports and isolated storage/provider tests, not physical-device camera/PWA acceptance or a production upload. No production merchant, catalog, storage or financial mutation was performed for this work. Shop activation, migration 085, roles, Community Safety and Mobile are untouched.

## Visual evidence

The generic fixture reward, icon and notification content are explicitly local test inputs; none is merchant inventory. Actual production components are rendered. The existing MOVRR mark is used only to exercise image preview, not as fabricated business photography. Mobile screenshots are viewport captures to avoid misleading full-page fixed-navigation stitching.

- `before-create-desktop.png` / `after-create-preview-desktop.png`
- `before-create-mobile.png` / `after-create-preview-mobile.png`
- `after-create-actions-mobile.png`: white primary labels and canonical button sizing
- `after-edit-mobile.png`, `after-create-nl-mobile.png`
- `after-rewards-desktop.png`, `after-rewards-mobile.png`
- `after-language-mobile.png`, `after-notifications-mobile.png`, `after-create-dark-320.png`

Reproduce from repository root: `node docs/verification/partner-header-and-images-20261025/prepare.mjs before` and `after`, then run Next dev in those ignored checkouts on 3317/3318. Set `MOVRR_PLAYWRIGHT_MODULE` to an installed playwright-core and `MOVRR_AXE_SCRIPT` to axe.min.js; run `verify-ui.mjs`, `verify-states.mjs` and `verify-buttons.mjs`. Build root once so the capture can use the exact compiled Manrope font. Fixtures replace session identity, proxy and data transport only; all business commands remain rejected. Binary transport and storage commands are verified with isolated providers in source tests. See `results.json` and `button-results.json`.

## Release and boundaries

Await approval of the exact resulting Admin and Partner commits. Deploy Admin first (additive media transport and catalog image read), then Partner to the existing projects/domains. Do not reapply 085. Keep Shop disabled. Reuse the existing runbook's production preflight and read-only financial/authorization checks.

Rollback on authorization/tenant leakage, catalog version protection regression, upload/save failures outside the documented recoverable image failure, broken authentication or material UI failure. Restore Partner to `9c2db98` before Admin to `6c825a5`; do not erase media/catalog records written by legitimate use, revert financial data or change roles. Existing clients still use JSON commands and remain compatible.

Notification preview follows [PatternFly notification guidelines](https://www.patternfly.org/components/notification-drawer/design-guidelines/). Keyboard dismissal follows [WAI-ARIA disclosure guidance](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/). Flag source/license/provenance is preserved in `public/flags/` from [flag-icons](https://github.com/lipis/flag-icons).
