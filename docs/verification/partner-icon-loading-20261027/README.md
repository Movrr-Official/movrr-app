# Partner installation icon and content loading

Local source review against `750a997`. Not a production deployment or physical-device acceptance.

## Changes

- Installation assets reuse a checked-in copy of the original Rider Android artwork, keeping its full canvas and optical proportions. The outline is green `#23b245` on one opaque dark green `#123c2c` canvas. There is no inset square. The transparent header mark is preserved separately, byte-for-byte.
- Thirteen Partner mobile route boundaries have content-shaped initial skeletons: Home, Activity, Scan, Rewards, Account, inventory, team, settings, performance, notifications, collection details, reward creation and reward editing.
- Skeletons follow Rider's documented loading principles: bounded decorative blocks, one localized polite busy announcement, persistent navigation, no interactive placeholder controls or invented data, restrained 2.4-second pulse, and static reduced-motion rendering. Existing loaded content and background refresh logic are unchanged.
- Desktop and other-role fallback elements remain the existing elements. Authentication, authorization, scanner/fulfilment commands, service worker, manifest identity and financial controls are unchanged. No Rider or Admin files were edited.

## Verification

- All 178 unit tests across 34 suites pass, including route selection, localized accessible placeholders, desktop fallback preservation and icon pixel/proportion checks.
- Changed-source lint passes. Production build and TypeScript pass (37 pages). Previously dispositioned repository lint findings were not reopened.
- Standard isolated browser regression: 127 checks, 66 mobile renders, no runtime errors. Desktop Home, Rewards and Scan screenshots are pixel-identical to the baseline. Includes normal browser/standalone simulation, English/Dutch, Back, overlays, workspace navigation and public-only offline checks.
- Delayed-boundary browser verification: 78 actual loading renders, 13 routes, English/Dutch, 320 x 740, iPhone XR 414 x 896 and Samsung S23 Ultra 412 x 915 viewports. Tests assert screen identity, persistent navigation, noninteractive placeholders, no overflow, live reduced-motion changes and replacement by real content. Full result counts are in `verification.json`.

`review.png` pairs actual loading and ready renders for the five main destinations and compares the approved Rider artwork with the corrected Partner icon. Ready content uses the existing explicitly labelled read-only test fixture, not merchant records. Supporting captures are disposable.

## Reproduction

Use `scripts/prepare-partner-mobile.mjs` for baseline/current copies and `scripts/verify-partner-mobile.mjs` for standard acceptance. For delayed loading, set `MOVRR_PARTNER_VISUAL_READ_FIXTURE=__tests__/fixtures/partner-mobile-read-models.json`, prepare a fresh task-specific copy with `scripts/prepare-partner-loading.mjs`, start that copy on localhost:3383, then run `scripts/verify-partner-loading.mjs`. The artificial three-second delay is inserted only into copied pages in ignored `.tmp/` storage. Set `MOVRR_PLAYWRIGHT_MODULE` to the existing Playwright installation and `MOVRR_PARTNER_VISUAL_OUT` to the task-specific evidence directory. Run the adjacent `render-review.mjs` to regenerate the contact sheet.

Physical iOS/Android home-screen icon refresh, installation and camera acceptance remain operational checks. Installed launchers can retain previous icon assets until the OS refreshes the installation. No claim of device acceptance is made from browser rendering.
