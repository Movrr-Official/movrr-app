# Partner mobile refinement

Baseline: `791bdb3fc7389e80f13c1dbf70a15c542a775b3f`. Source implementation and isolated local browser acceptance only. No push, deployment, migrations or production mutations.

## Delivered

1. Bottom navigation uses one soft selection capsule and a stronger selected label. The competing indicator line and permanently filled Scan tab are removed. Destinations, active route calculation, touch targets and the Rewards FAB are unchanged.
2. Rewards use square thumbnails, decorative MOVRR fallbacks for missing/failed images, lighter unboxed statuses and a clearer name/value hierarchy. Existing provider images, real supplied values, manager permissions and edit/create routes remain authoritative. The shared thumbnail's desktop fallback remains its existing image icon.
3. Activity groups reward, outcome and fulfilment details, with quieter dates and inset separators. Recorded, closed and pending entries have appropriate icons derived from their supplied state. No state or date is inferred from missing records.
4. Scan has explicit pending feedback, neutral capture feedback and outcome-specific result presentation. A captured code never implies validation. Only the existing server response can offer collection review. Collection status is derived from its canonical record, physical handover remains a required acknowledgement, and secondary cancellation is collapsed on mobile. Completed records offer a return to Activity without a mutation form.
5. Reward create/edit and voucher import forms progressively add localized inline constraint errors, connected error descriptions, numeric keyboard hints and Enter progression. Unsaved edits are protected by a focus-trapped native sheet on links and Back; Escape, backdrop and Back dismiss it safely. A same-URL guard contains only an opaque editor marker, never field values. Browser unload uses its standard warning. Consuming the guard before submission preserves the original action, fields and submitter, and blocks rapid duplicate submission during that transition. Field values and voucher codes remain in memory only. Server validation and existing server error redirects are unchanged; there is no autosave or persistent draft store.
6. Cards, settings rows, buttons and tabs share restrained pressed/focus feedback. Brief content entry and checking feedback respect reduced motion. No new dependency is introduced.

The mobile form adapter renders the original form markup in desktop mode. Shared page edits only replace three form tags with that adapter. Desktop collection and scanner presentation retain their original branches. Financial services, canonical actions, authorization, tenant context, manifest, icons, service worker and Shop operating gate are unchanged. Rider and Admin were not edited.

## References

Public [Mobbin UI element examples](https://mobbin.com/explore/mobile/ui-elements) were visually inspected: MasterClass's restrained navigation and image/card hierarchy, Todoist's clear status explanation and action priority, and Lyft's separation of primary content and supporting account actions. [Mobbin screen examples](https://mobbin.com/explore/mobile/screens) and the previously inspected Rider loading/Community patterns provide ecosystem context. These inform hierarchy and interaction principles; no gallery assets, merchant content, fitness metrics or copied app layouts are shipped.

## Verification

Final counts and scope are recorded in `verification.json`. The full unit suite includes scanner capture/pending/server outcome, stable retry identity, camera cleanup, required physical acknowledgement, financial and authorization regressions, desktop form equivalence, localized inline errors, private in-memory edits and exactly-once action replay under rapid submit. TypeScript, changed-source lint and the production build pass. Build validation uses an inert process-scoped HTTPS Platform API origin; no environment file or production project configuration is changed. The inherited full-repository lint disposition remains outside this UI task.

Browser acceptance uses existing isolated invalid identities, labelled read fixtures, and a transport that rejects every mutation. The fixture now includes one explicitly labelled voucher pool solely to render and exercise the import editor. No record is written. Three viewports (320 x 740, iPhone XR 414 x 896, Samsung S23 Ultra 412 x 915), English/Dutch, normal and simulated installed browser modes, dark surfaces, reduced motion, 200% text, keyboard behavior, Back, overlays, permissions, handover, installation identity and public-only offline recovery are covered.

Desktop screenshots are pixel-identical to baseline on Home, Scan, Rewards, reward creation/editing, inventory, validated collection and completed collection. Five additional comparisons explicitly verify that mobile editing hooks are absent from desktop.

## Reproduction and remaining acceptance

Use `scripts/prepare-partner-mobile.mjs` with baseline above, a fresh task-specific ignored directory and `MOVRR_PARTNER_VISUAL_READ_FIXTURE=__tests__/fixtures/partner-mobile-read-models.json` for both before/after copies. Run copies locally, set `MOVRR_PLAYWRIGHT_MODULE` and the local before/after/populated origins, then run `verify-partner-mobile.mjs`, `verify-partner-mobile-operations.mjs` and `verify-partner-mobile-finish.mjs`. The adjacent renderer assembles actual screenshots into `review.png`. Disposable diagnostics and downloaded reference images remain outside Git and are cleaned after review.

Physical iOS/Android installation, camera, software keyboard, gesture navigation and safe-area acceptance are still operational checks. Browser emulation is not device acceptance. This source has not been deployed.
