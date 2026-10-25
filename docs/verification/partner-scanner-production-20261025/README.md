# Scanner correction production closure — 25 October 2026

**DEPLOYED & VERIFIED. Partner Phase 4 software: CLOSED.**

The owner explicitly authorised `b33e34dec03fcc757a7e4423989d49b065abacce`. It is READY in production as Vercel deployment `dpl_2LvsRMQYFMQHGrzGCjQ2wtLmBY7t`, assigned to https://app.movrr.nl. Immutable URL: https://movrr-3yghievct-movrrops-projects.vercel.app. Git source SHA and alias were verified through the production API. Previous deployment `dpl_2i8xoZ54YVFQwMY1DuDnCFivzrkf` remains available for rollback.

Existing production API, Supabase and domain bindings and project security were preserved. No concurrent deployment was present. Admin remains `dpl_n2M4CuqU8hCcv4Na3nKZJQJiDqCJ` on `19790c43a92b9ba11996a8e23bd8cb091397855c`; it was not redeployed.

## Live acceptance

- Existing signed-in Partner session retained access. Dutch guidance wrapped inside the visible scanner frame at 390×844 and 320×844 in Chrome mobile emulation. English guidance was also checked after restoring the original language. No camera permission request, voucher entry, scan or validation command was made.
- The first browser capture during refresh still displayed the previous layout. Verification was withheld until the server refresh completed. Subsequent captures showed the corrected two-line guidance. The actual stylesheet linked by production (`/_next/static/immutable/chunks/07u3car2gi3du.css`) returned 200 and contained the correction; SHA-256 `ad68f549d82cae5d2326ee034e5cee004d9631bb9c1df9f166d875cb15fdff94`.
- Protected routes continued to redirect anonymous visitors to sign-in. Manifest, any/maskable icons, flags, service worker and offline document served successfully. Service worker/offline bytes matched the authorised source. The previous [production PWA/offline acceptance](../partner-phase4-production-20261025/README.md) remains applicable: this correction changes only idle scanner presentation.
- [Local verification](../partner-scanner-wrap-20261025/README.md) remains the evidence for all 16 normal/doubled-text layout cases, seven scanner behavioral regressions, TypeScript, lint and production build. Live browser checks are not physical-device acceptance.
- Raw signed-in screenshots are retained in ignored task storage to avoid publishing unrelated browser tabs. Browser language, viewport and DevTools were restored after verification.

## Integrity and boundaries

[Before/after fingerprints](financial-integrity.json) confirm all 14 financial/catalog/inventory tables unchanged, zero wallet mismatches/unpaired paid claims/pending deliveries/delivery failures, and unchanged database functions, grants/RLS and migration journal. Migration 085 remains journal `20261025150000`, SHA-256 `c45e511cc771382b34dec6d3306343e17a9e66a22f33c415299ccb961896fb24`; it was not reapplied.

**Shop remains Disabled**, version 0, `redemption_enabled=false`. No financial, inventory, membership, account, merchant or voucher mutations occurred. No Admin, Rider Mobile, Community Safety, EAS/OTA or app-store change was performed.

The reported Dutch overflow is closed. Physical-device installation/camera/keyboard/accessibility checks and genuine merchant operational readiness remain separate milestones. No new software deployment blocker remains from this correction.

Evidence: [deployment](deployment.json), [protected routes and PWA assets](partner-acceptance.json), [integrity](financial-integrity.json).
