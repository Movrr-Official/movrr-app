# Plan 4 — Partner workspace end-to-end verification notes

Date: 2026-07-29  
Repo: movrr-app  
Branch: `feat/fulfilment-engine-plan-4`

## Static verification (completed)

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| Partner mutations use Platform API only (`services/partner.ts`, `app/actions/partner.ts`) | Pass |
| No movrr-app Supabase writes to fulfilment / redemption tables | Pass (grep: no fulfilment table access) |
| Session requires `GET /api/v1/partners/me` for partner shell | Pass (`lib/appUser.ts`) |
| UI capability gating mirrors Platform role bundles (presentation only) | Pass (`lib/platform/capabilities.ts`) |
| Not a rider marketplace | Pass (partner nav: collections / validate / resources / staff — no redeem shop) |

## Manual E2E checklist (requires live Admin + Mobile)

These steps need a provisioned reward_partner organisation (Plan 2), Platform API (`PLATFORM_API_URL`), and mobile redeem path (Plan 3).

1. **Provision** partner org + membership in Admin → partner user signs into movrr-app → `/partners/me` succeeds → Partner Workspace shell.
2. **QR path:** Mobile redeem QR reward → appears in `/dashboard/collections` pending → Validate on `/dashboard/validate` → Confirm on collection detail → mobile shows completed.
3. **Instant Digital:** Mobile shows code directly; partner workspace not required for completion.
4. **Authz:**
   - Viewer: can read dashboard / analytics / rewards; cannot confirm, validate, or manage staff/resources.
   - Staff: can validate + confirm; cannot manage staff.
   - Owner: can manage staff (+ resources when granted).
5. Confirm no direct Supabase fulfilment writes from movrr-app during the flow (network tab / server logs show only `/api/v1/partners/*` and `/api/v1/organisations/*/staff`).

## Known Platform gaps affecting E2E

- `GET /partners/fulfilments/pending` currently returns empty read models until tenant-scoped data is wired in Platform.
- `PATCH /api/v1/partners/settings` is not exported on the Admin route yet (GET only) — settings form will surface API error until Plan 1 adds PATCH.
- Staff revoke/delete is not on Platform org staff routes (invite + role change only).
- Failure-rate dashboard field is a presentation placeholder (`—`) until analytics sink provides it.
