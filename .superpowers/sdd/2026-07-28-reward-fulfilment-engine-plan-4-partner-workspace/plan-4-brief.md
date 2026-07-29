# Plan 4 — Reward Partner Workspace (all tasks)

Work: C:\Users\ghyor\OneDrive\Desktop\Projects\movrr-app
Branch: feat/fulfilment-engine-plan-4

Full plan: C:\Users\ghyor\OneDrive\Desktop\Projects\movrr-admin\docs\superpowers\plans\2026-07-28-reward-fulfilment-engine-plan-4-partner-workspace.md

## Deliver
1. Platform client + partner session via GET /api/v1/partners/me
2. Sidebar + dashboard for partner
3. Collections pending + confirm
4. Validate token UI (manual code entry)
5. Resources + rewards management
6. Staff management
7. Analytics + settings
8. E2E notes / verification doc

## Constraints
- NOT a rider marketplace
- All mutations via Platform API with Supabase JWT
- No fulfilment business logic in movrr-app
- Mirror advertiser patterns (services/actions/components)
- Extend PRODUCT_ROLES / session carefully — prefer partnerContext from /partners/me

Prefer separate commits. Typecheck must pass.

Report: C:\Users\ghyor\OneDrive\Desktop\Projects\movrr-app\.superpowers\sdd\2026-07-28-reward-fulfilment-engine-plan-4-partner-workspace\plan-4-report.md

Return status, commits, typecheck, concerns. PowerShell `;` not `&&`.
