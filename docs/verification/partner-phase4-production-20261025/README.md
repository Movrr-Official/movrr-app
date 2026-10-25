# Partner Phase 4 production execution — 25 October 2026

**Approved candidate DEPLOYED & VERIFIED. Phase 4 software milestone CLOSED.** A newly reported Dutch scanner instruction overflow is tracked as a separate presentation correction below; it is not represented as already deployed.

- Source: `48d32c361c6da7c8cd5a27d6bd02b1230ebce639`.
- Vercel: `dpl_2i8xoZ54YVFQwMY1DuDnCFivzrkf`, READY, production, fra1.
- Alias: https://app.movrr.nl. Immutable deployment: https://movrr-qdqjvf0ws-movrrops-projects.vercel.app.
- Previous deployment retained for rollback: `dpl_B823jSAiYWG9n8NRsX9NYnPKUXML` (`43f11fcec679f145c7fe8d29ced2085d16d3edc8`).
- Existing production API/Supabase/domain bindings and Vercel security settings verified and preserved. No environment settings were written. No concurrent deployment was present at preflight.
- Admin remained `dpl_n2M4CuqU8hCcv4Na3nKZJQJiDqCJ`, source `19790c43a92b9ba11996a8e23bd8cb091397855c`; not redeployed.
- Migration 085 remained journal `20261025150000`, SHA-256 `c45e511cc771382b34dec6d3306343e17a9e66a22f33c415299ccb961896fb24`; no migration applied.

## Targeted production acceptance

The existing signed-in Partner owner session was used in its original Chrome profile. No identity, cookie or credential was copied to automation. Desktop and Chrome's 390×844 mobile emulation were inspected; language/theme preferences were restored and temporary DevTools closed afterwards.

| Check | Result |
|---|---|
| Authentication/workspaces | Existing session retained access; workspace selection and re-entry succeeded, preserving Dutch. Only its existing authorised organisation was offered. |
| Dashboard/navigation | Live dashboard, mobile header/bottom tabs, dark/light surfaces, MOVRR typography and spacing rendered. More opened; browser Back dismissed it without leaving the route. |
| Rewards/create/edit | Existing catalog and active editor loaded. Active editor defaulted to Draft, offered only Draft/Paused/Archived, explained withdrawal/reapproval and displayed acknowledgement. Back dismissed the selector while preserving the editor. Create form explained draft approval and included image upload. No reward was created, changed, uploaded or submitted. Successful save/withdrawal and forged-transition evidence is the [approved isolated canonical journey](../partner-phase4-20261025/README.md), not a production mutation. |
| Inventory/team/settings | Scoped existing inventory, team/invitation form and organisation/access details loaded. No import, invitation, role change or settings mutation performed. |
| Collections | Pending and history empty states loaded. No handover or financial command exercised. |
| Notifications | Recent preview loaded; View all reached Notifications with the overlay dismissed. No notification preference or read-state command submitted. |
| English/Dutch | Both live languages worked; mobile navigation, scanner, notifications and workspace handoff remained localised. Merchant-authored reward names/descriptions retained their stored language. |
| QR | Desktop offered Continue on your phone and the production scanner link; mobile offered camera-first scanning with manual fallback. No camera permission prompt, voucher scan or validation command was exercised. |
| Tenant denial | A SELECT-only check identified an existing active reward belonging to another organisation. Its edit URL in the signed-in Partner session returned the restricted not-found screen, exposing no reward details. Anonymous Partner routes redirected to sign-in; Admin API reads and empty unauthenticated command probes returned 401 before dispatch. |
| PWA/offline | Production manifest, any/maskable icons, flags, service worker and offline document served successfully; SW/offline bytes matched approved Git objects. Anonymous isolated mobile Chromium confirmed SW control, exact three-public-asset cache, no offline form, Dutch fallback and retry to protected sign-in after reconnection. No private content cached. |

Keyboard/focus presentation was inspected in the browser without form submission. OS software keyboard, installed standalone/cutout behavior, physical camera and assistive-technology acceptance were not claimed. The candidate's existing simulated keyboard/standalone and canonical regression evidence is retained rather than relabelled as native acceptance.

## Integrity and operating boundaries

[Before/after evidence](financial-integrity.json) verifies all 14 existing financial/catalog/inventory table fingerprints unchanged, zero wallet mismatches, zero unpaired paid claims, zero pending delivery/failures, and unchanged public function bodies/owners/grants, RLS/policies/table grants and migration journal. Installed 085 function bodies match the canonical source. A separate READ ONLY check reconfirmed the canonical active Partner write restriction.

Shop remains **Disabled**, version 0, `redemption_enabled=false`. No account, inventory, voucher, refund, balance, role or financial mutation occurred. No Admin deployment, SQL migration, Rider/Community Safety change, EAS/OTA or store action occurred.

## Separate scanner presentation correction

Live acceptance and the owner identified Dutch guidance crossing the idle scanner's decorative frame. The follow-up moves that idle frame into content layout, wraps text inside padded bounds and lets it grow for enlarged text. Camera/validation behavior and scanning overlay are unchanged. All 16 local English/Dutch checks at 320/360/390/430px and normal/doubled instruction text pass; seven scanner regressions, TypeScript, changed-source lint and production build pass. This source correction requires its own exact revision deployment authorisation; it was not included in the deployment ID above.

Physical iOS/Android install/camera/keyboard testing and genuine merchant supply, staff training/provider delivery and operational attestations remain separate milestones. Public redemption remains NO-GO/Disabled. There is no new security, financial-integrity or tenant-isolation blocker from this rollout.

Machine evidence: [deployment](deployment.json), [Partner routes/assets](partner-acceptance.json), [unchanged Admin/API denials](admin-acceptance.json), [PWA browser](pwa-browser-acceptance.json). Raw authenticated screenshots and private deployment responses remain in task-specific ignored storage; they are not published with account details or unrelated browser tabs.
