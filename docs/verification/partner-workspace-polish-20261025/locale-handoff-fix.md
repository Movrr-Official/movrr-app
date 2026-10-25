# Workspace language redirect follow-up

Live acceptance of deployed Partner `6244a6b9e1a137557c444576c674dda0ec4ceac8` found that saving Dutch worked, and the workspace picker carried Dutch correctly, but selecting its card initially rendered the dashboard in English. A full browser refresh restored Dutch. The existing presentation cookie is scoped to `/dashboard` and is absent from the `/workspaces` action request.

The selection action now reissues that same actor-bound, HttpOnly/SameSite presentation cookie for Partner membership selections, using the validated picker locale and freshly authenticated actor. This makes it available to the redirect render. Existing membership revalidation and workspace cookie remain; Rider/Advertiser/Government selections do not gain Partner access or receive this presentation preference. Cookie scope is not broadened.

Verification: 15 workspace/locale tests passed, including required fresh membership, signed-out denial without cookie writes and actor-bound locale reissue. Changed-file lint, TypeScript and production build passed. The actual isolated Next client navigation (English ? save Dutch ? Dutch picker ? select existing fixture membership ? Dutch dashboard, without a reload) passed. Development navigation cached Dutch even before the correction, so it is not claimed as a local reproduction of the production-only stale redirect. The cookie reissue regression directly covers the missing server-action behavior.

`verify-locale-handoff.mjs` runs with the existing isolated `prepare.mjs after` fixture/server on port 3318 and separately available Playwright. It uses no production merchant or financial commands. New production verification requires approval of this exact follow-up SHA. Admin and migration 085 need no redeployment.
