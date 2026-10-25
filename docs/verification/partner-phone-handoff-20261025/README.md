# Continue on your phone - reviewed follow-up candidate

25 October 2026. Implemented after the owner requested a desktop-to-phone scanner experience during production acceptance. This is a separate candidate from deployed Partner `28e01614d3ec9d2ee75bf5a87c12be9bc8e369ee`. It is not deployed by the original release authorization.

## Research and decision

- [Persona device handoff](https://help.withpersona.com/articles/1eWai1tzBuIZ8fA3QknyBd/) pairs a QR code with a copyable link for continuing on a phone.
- [Entrust's current Web SDK](https://documentation.identity.entrust.com/sdk/web) supports forced mobile capture and QR/copy-link alternatives; its connected/confirmation screens rely on an actual cross-device session.
- [Plaid Identity Verification](https://plaid.com/docs/identity-verification/) moves camera-dependent desktop tasks to a phone and returns users to their originating journey.
- [US Section 508 QR guidance](https://www.section508.gov/blog/accessibility-bytes/qr-codes/) calls for a descriptive destination, useful alternative text and an adjacent accessible link.

MOVRR applies the navigation pattern: desktop shows Continue on your phone, a high-contrast QR with a quiet zone, three clear steps and a selectable/copyable URL. Desktop does not render a webcam, token form or validation action. Narrow desktop windows retain the phone panel. Mobile touch devices retain camera-first scanning and manual fallback. Primary coarse pointer, no hover and a viewport up to 1023px select that presentation; this is a UX capability check, not a server authorization boundary or tamper-proof device attestation.

The QR contains only the configured application origin plus /dashboard/validate, with no voucher, identity, organization, session credential or financial data. Normal phone sign-in and merchant membership/capability checks remain required. A signed-out scanner deep link preserves only the fixed known scanner path through existing sign-in. Multi-workspace accounts still choose an authorized workspace and can tap Scan a reward. No role is transferred from the desktop.

A navigation URL has no privileged session to expire. There is no paired session or phone-completion channel, so this candidate does not display fabricated Waiting/Connected/Completed states. Adding automatic pairing would require a separately reviewed short-lived, scoped, one-time handoff protocol and server-confirmed status; copying KYC session-transfer mechanics would change the current architecture unnecessarily. No SMS or email is sent, no vendor or dependency is added, and no business command changes.

## Evidence

[Before desktop](before-desktop.png), [after desktop](after-desktop.png), [narrow desktop](after-narrow-desktop.png), [phone](after-phone.png), [Dutch desktop](after-desktop-nl.png).

[Visual results](visual-results.json): actual Next routes/components, one baseline plus six final states; desktop/narrow desktop make zero camera requests, QR pixels decode to the actual scanner URL, mobile portrait/landscape keep scanning, viewers receive no handoff, no overflow/runtime errors or detected WCAG A/AA violations in final states. The phone camera is deliberately denied in the fixture, not a physical-device test. Localhost appears in the captures because the fixture has a local APP_URL; production uses the existing configured https://app.movrr.nl origin.

All 23 Partner suites / 136 tests passed, changed-source lint passed, TypeScript and production build passed. Focused cases cover desktop camera/token exclusion, clipboard failure fallback, EN/NL, camera cleanup on capability changes, preserved normal phone session, fixed-path sign-in return and exclusion of token/external redirect query parameters. [Source hashes](source-manifest.json) identify the verified files. Canonical financial and authorization sources are unchanged.

## Reproduction

From the repository root, run `node docs/verification/partner-phone-handoff-20261025/prepare.mjs before` and the same command with `after`. The preparer uses the existing documented isolated visual boundaries, copies no production .env, and refuses overwrite. Start Next from each generated checkout using `node ../../../node_modules/next/dist/bin/next dev --webpack -H 127.0.0.1 -p 3317` (3318 for after). Build the root app first for its cached approved Manrope font. Set MOVRR_PLAYWRIGHT_MODULE to playwright-core 1.62.1 and MOVRR_AXE_SCRIPT to axe-core 4.11.0's axe.min.js, then run `node docs/verification/partner-phone-handoff-20261025/capture.cjs`. These are verification tools, not app dependencies. Remove each node_modules junction before cleaning only task storage.
