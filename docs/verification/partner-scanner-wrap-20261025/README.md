# Scanner instruction containment — 25 October 2026

Production update: the owner-authorised correction is [deployed and verified](../partner-scanner-production-20261025/README.md). The source verification record below is retained as release history.

The owner reported Dutch instruction text extending beyond the inner scan frame on the deployed Phase 4 candidate. The idle guidance now participates in the frame's layout with padded, wrapping text. A grid spacer preserves a square at normal size while allowing the frame to grow when enlarged text needs additional height. The live camera overlay and validation/fulfilment commands are unchanged.

**Verified source correction; not deployed by this record.** Production remains on `48d32c361c6da7c8cd5a27d6bd02b1230ebce639` until separately authorised.

- Seven existing scanner behavior regressions pass, including camera cleanup, explicit validation, offline restrictions, viewer denial and desktop phone handoff.
- TypeScript, changed-source/tool lint and production build pass. No broad test/audit rerun or unrelated changes.
- [16 rendered layout assertions](results.json) pass: English/Dutch, widths 320/360/390/430, normal/doubled instruction text, text inside the visible padded frame and no horizontal page overflow. This specifically doubles the instruction text; it is not an OS font-scaling acceptance claim.
- Actual local Partner route and components are used with the established isolated visual session/empty read contracts. No production identity, camera or validation command is used. Language changes are confined to the isolated harness.
- Final screenshots: [390px](scanner-nl-390.png), [320px](scanner-nl-320.png). Physical-device acceptance is not claimed.

Reproduce with the existing `prepare-partner-visual.mjs` harness in an unused task directory (preserve other sessions), run its Next server at `127.0.0.1:3320`, set `MOVRR_PLAYWRIGHT_MODULE` to the installed Playwright module and run `node scripts/verify-partner-scanner-layout.mjs`. The verifier rejects a non-local origin. `MOVRR_PARTNER_LAYOUT_ORIGIN` can point to another isolated localhost port.
