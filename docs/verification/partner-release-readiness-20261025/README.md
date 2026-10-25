# Final Partner Mobile PWA release readiness — 25 October 2026

Deployment candidate: **`9f1660c24ad8d03fceef40d3f4a67f0dfa0857e6`**.
No application correction was required; the exact mobile implementation is retained.
This follow-up changes release documentation and evidence only.

Recorded production baseline: `b33e34dec03fcc757a7e4423989d49b065abacce`,
deployment `dpl_2LvsRMQYFMQHGrzGCjQ2wtLmBY7t`, from the existing
[deployment record](../partner-scanner-production-20261025/deployment.json).
The implementation's immediate parent `add3f66` only closes that rollout's evidence.
This assessment compares with the actual recorded deployed source, not merely the
candidate's parent or another copy of the candidate. No live deployment state was
queried or changed during this follow-up.

## Lint findings and disposition

[Lint comparison and Git blob evidence](lint-comparison.json).

The baseline was exported to ignored task storage and linted with the same
installed dependency tree as the candidate. `package.json`, `package-lock.json`
and `eslint.config.mjs` match exactly between revisions. Diagnostics were compared
by file, rule, severity, line, column and full message after normalizing absolute
checkout paths embedded in messages.

| Finding | Deployed baseline | Candidate | Disposition |
| --- | ---: | ---: | --- |
| `no-require-imports`: old phone-handoff capture | 7 errors | 7 errors | Existing tooling style debt; no runtime PWA effect |
| `no-require-imports`: old visual capture | 4 errors | 4 errors | Existing tooling style debt; no runtime PWA effect |
| `no-require-imports`: old interaction verifier | 4 errors | 4 errors | Existing tooling style debt; no runtime PWA effect |
| `react-hooks/purity`: deletion receipt `Date.now()` | 1 error | 1 error | Existing dynamic server-route expiry check; preserve expiry protection |
| `no-unused-vars`: existing notification source and image verifier | 2 warnings | 2 warnings | Unchanged; unrelated to this presentation release |
| New diagnostics | — | **0** | No lint regression |

Every flagged file is Git-blob-identical to the deployed baseline. The receipt page
is explicitly `force-dynamic` and checks credential expiry at request time. This
lint result does not establish a Partner PWA behavioral defect; removing the check
or moving it into a browser effect to satisfy the rule would be inappropriate.
No lint suppression, rule relaxation, legacy-script refactor or receipt behavior
change was made. The candidate's changed-source diagnostics are **zero**.

Full-repository `lint` still exits nonzero. It must be described as inherited lint
debt, not a green check or a new PWA defect. The production build passes with the
unchanged toolchain. The inherited diagnostics do not constitute a new technical
blocker for this controlled presentation release; any separate zero-lint release
policy would still require its normal recorded exception.

## Source, desktop and mobile verification

- Full App regression suite: **30 files / 161 tests passed**, including Partner
  scanner, handover, authorization, retry identity, sessions, Account capabilities,
  language, overlays, service contracts and PWA offline restrictions.
- **TypeScript and production build passed** again. Build configuration used
  `https://platform-build.invalid/api`, not production commands. The build includes
  the explicit Partner manifest route.
- Desktop shell source matches the deployed shell after only renaming the export.
  Existing desktop CSS is unchanged. Desktop route/browser results and comparison
  hashes are recorded in [browser acceptance](browser-acceptance.json).
- Fresh browser acceptance: **135 checks passed**, 66 mobile compositions, ten
  desktop routes pixel-identical at 1440×1000, and zero runtime errors.
- Dedicated `PartnerMobileShell` and mobile Home/Account compositions remain in
  place, with **Home / Activity / Scan / Rewards / Account** navigation. Existing
  collection cards, catalog items and management forms retain their authorized
  services. No desktop sidebar is mounted in the hydrated mobile shell.
- Canonical authentication, proxy guards, Partner services/actions, scanner,
  handover component, offline worker and offline document match the deployed
  baseline. Mobile presentation never becomes an authorization or financial
  authority. No second database or duplicate command path was introduced.
- Partner metadata advertises its own named manifest. Existing app id `/`, scope
  `/`, `/dashboard` launch and canonical icons are retained; this is an identity
  update within the existing authenticated application, not a second authority.
- Browser acceptance covers narrow 320px, iPhone XR 414×896 and S23 Ultra emulation
  412×915, English/Dutch, dark mode, touch targets, reduced motion, 200% text,
  Back/focus/overlay handling, notification return navigation, simulated keyboard
  and standalone mode, manifest/icon serving and offline/reconnection.
- Offline cache remains exactly the public offline document plus two public
  fonts. No merchant HTML/records, credentials, QR tokens or mutations are cached;
  no offline redemption queue exists. Offline retry drops query tokens.
- Rider-aligned type, green/neutral surfaces, cards, headers and navigation retain
  the approved [actual-route visual comparison](../partner-mobile-app-20261025/comparison.html).
  No runtime source has changed since those design renders.

Browser evidence uses isolated test authentication, empty operational read models
and rejected mutations. It establishes candidate presentation behavior, not live
merchant records, native hardware acceptance or production smoke-test completion.

## Release decision and operating boundaries

| Gate | Decision |
| --- | --- |
| Source quality for the exact candidate | **GO** — no new lint regression or relevant application defect found |
| Controlled production deployment readiness | **GO for separate deployment authorization** — staged rollout and read-only production smoke checks remain to be executed |
| Production deployment / production acceptance | **Not performed**; no authorization inferred from this readiness request |
| Physical-device / merchant operational acceptance | **OPEN**; browser emulation does not satisfy it |
| Public Shop redemption | **NO-GO / Disabled**; no enablement is part of this release |

This supersedes the initial implementation report's provisional NO-GO caused by
untriaged lint. Physical-device acceptance remains separate from permission to
deploy a controlled presentation candidate; it is still required before claiming
device acceptance or expanding to an unsupervised merchant rollout.

The camera scanner and desktop **Continue on your phone** handoff are unchanged.
The recorded deployed operating gate is Shop `disabled`, version 0,
`redemption_enabled=false`; see the retained
[production integrity evidence](../partner-scanner-production-20261025/financial-integrity.json).
This follow-up does not enable or mutate that gate and does not claim a fresh live
gate read. Admin, Rider Mobile, merchant accounts, permissions, inventory and
production financial records were not modified. No deployment or migration ran.

After explicit deployment authorization, the controlled execution should deploy
this exact source revision, retain the recorded deployment above for rollback,
and verify authenticated/anonymous routing, desktop appearance, five mobile tabs,
PWA asset/manifest serving, handoff and the Shop Disabled gate through read-only
production checks. No voucher validation, handover, catalog or financial mutation
is needed for that smoke test. A failed route, identity, security or desktop check
should stop expansion and use the retained rollback deployment.

Remaining physical acceptance: iOS Safari/Home Screen and Android Chrome install
and upgrade identity; icon/splash/status-bar/safe-area behavior; rear-camera focus,
allow/deny/revoke and background/resume; real network interruption and duplicate
handover using approved test arrangements; keyboard/file picker; assistive
technology; and session/workspace isolation on actual installed devices with
existing authorized test memberships. None is represented as already passed.

## Reproduction

Export the recorded baseline with `git archive` into a task-specific ignored
directory, use the identical installed dependencies, and run ESLint with JSON
output from both checkouts. Compare normalized diagnostics and Git blob ids;
raw output belongs in ignored storage. Run App `test`, `typecheck` and `build`.

For browser replay use the existing `prepare-partner-visual.mjs` harness with its
baseline pinned to `b33e34d` and its output isolated in the current task directory;
the candidate copy is `9f1660c`. Run both isolated Next servers on localhost ports
3341/3342, then replay `verify-partner-mobile.mjs`. This follow-up also compared
all ten pre-existing desktop routes and checked the advertised manifest and served
icon dimensions. No production credentials or real accounts are needed.
