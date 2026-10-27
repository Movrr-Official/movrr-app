# Single Partner mobile header and Rewards FAB

Source baseline: `c64b8a6ff8d282769080b887d6592d72c7166359`. Local verification only; no push, deployment or production commands.

## Design and scope

The mobile shell now owns the screen heading. Home keeps a restrained MOVRR brand mark and name. Activity, Rewards and Account have a clear title and unboxed notification action. Scan has only its title. Supporting screens have a back arrow and a precise title, including Create reward and Edit reward. Collection detail uses the neutral Reward collection title so the shell never implies a financial state. The separate mobile eyebrow/title blocks are removed; shared desktop PageHeader copy is hidden only inside the mobile shell. The duplicate Back to collections action is hidden on mobile because its header already provides that route.

Headers remain visible while scrolling and retain safe-area padding, 44px touch targets, route focus management and existing navigation semantics. Existing notification overlays keep their canonical implementation. Loading boundaries use the same persistent header rather than repeating the screen title.

Rewards creation is a labelled 56px floating action at the bottom right, above the tab bar and device inset, with enough scroll clearance for the last card. Existing manager permissions and create route remain authoritative. Empty catalogs keep the existing first-reward call to action. The FAB is hidden with the existing software-keyboard state and restored on dismissal.

Public Mobbin references consulted: [screen gallery and App Layout examples](https://mobbin.com/explore/mobile/screens), including Play's single Home title with notification action and Craft's contextual back/action treatment; [UI element gallery](https://mobbin.com/explore/mobile/ui-elements). These informed hierarchy and action restraint; their layouts, blur treatments and content were not copied. The Rider Community implementation was inspected read-only for the FAB's bottom-tab offset and scroll clearance. Native action hierarchy is also consistent with [Android layout guidance](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns).

Desktop shell, management pages, shared PageHeader source, business services, scanner validation, financial commands, manifest, icons and service worker remain unchanged. No Rider or Admin files were edited.

## Verification

See `verification.json` for final counts. The full unit suite, changed-source lint, TypeScript and production build pass. The build uses a process-scoped inert HTTPS Platform API origin (`https://platform-build.invalid/api`); no environment files or production configuration were changed. The initial build correctly rejected the existing local development API origin in production mode.

Browser checks use isolated invalid identities and the existing labelled read-only fixture; all transport mutations are rejected. They cover narrow 320 x 740, iPhone XR 414 x 896 and Samsung S23 Ultra 412 x 915 layouts in English/Dutch, one visible h1 in one header on thirteen routes, translated titles, sticky scrolling, FAB/tab/card clearance, canonical create navigation, browser Back and keyboard dismissal. Existing tests also cover notifications, Account preferences, viewer permissions, scan/handover guards, public-only offline cache and recovery. Desktop Home, Scan and Rewards are pixel-identical to the baseline when given the same fixture.

`review.png` contains actual local renders of the five main screens. Reproduce with the existing `prepare-partner-mobile.mjs` before/after harness, the same optional read fixture for both copies, `verify-partner-mobile.mjs`, `verify-partner-mobile-operations.mjs`, and `verify-partner-mobile-headers.mjs`. Set local origins and `MOVRR_PLAYWRIGHT_MODULE`; render the contact sheet with the adjacent script. Disposable captures and downloaded reference images stay in ignored task storage.

Physical installation, camera acceptance and OS safe-area behavior remain separate device checks.
