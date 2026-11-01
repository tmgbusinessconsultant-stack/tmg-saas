# Production Readiness Audit

**Assessment date:** 2026-11-01
**Decision:** **NO-GO for production — local checks pass; ready for controlled staging deployment**

This is an evidence-based source/configuration audit and local validation, not a launch certification. The repository has an existing uncommitted worktree; those changes were preserved. External provider accounts and controlled staging infrastructure were not available. Local builds, backend health checks, and a limited Chromium route/mobile smoke were run, but no full production deployment or business-workflow verification was performed.

## Architecture reviewed

- Next.js/React frontend in `frontend/`
- NestJS API in `src/`, with a Vercel function adapter in `api/`
- PostgreSQL/Prisma schema and migrations in `prisma/`
- Authentication and role guards in `src/auth/`
- Forms, site analytics, project uploads, CMS/media, PayPal, and Microsoft integration entry points
- Vercel configuration and deployment notes in [`DEPLOYMENT.md`](./DEPLOYMENT.md)

The project has frontend and backend packages. The current backend tests cover site/form ownership and CMS scan-gate behavior, plus an API health/database integration smoke test. They do not form a browser E2E suite; no Playwright/Cypress project configuration is present. There is no API reference or dedicated backup/recovery runbook in the reviewed documentation.

The Next.js production build generated the route inventory. A separate limited Chromium smoke checked 75 URL paths for HTTP status and mobile horizontal overflow; it did not exercise form submissions, authenticated workflows, integrations, or browser-engine compatibility.

## Security review

The source review reported these HIGH-severity issues. Both have been remediated in this change:

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟠 HIGH | src/forms/forms.controller.ts; src/forms/forms.service.ts; src/analytics/analytics.controller.ts | 11-44; 8-10, 20-25, 34-43; 24-27 | Missing tenant ownership checks allowed cross-user form/submission access and site analytics access | 9/10 |
| 2 | 🟠 HIGH | src/analytics/analytics.service.ts | 40-43 | Untrusted `siteId` was interpolated into `$queryRawUnsafe`, enabling SQL injection | 8/10 |

`assertSiteAccess` and `assertFormAccess` now scope authenticated form and analytics operations to the owning user, while allowing Super Admin access. The analytics query now uses Prisma's parameterized tagged-template API. Public form display/submission routes remain public by design. This continuation also sanitized CMS blog HTML before rendering and escaped `<` in JSON-LD serialization to prevent script-context breakouts. These are source-level remediations, not a penetration test; live RBAC and runtime security remain unverified.

Other requested controls—including MFA, password reset, email verification, and application-level login rate limiting—are documented as unimplemented in the deployment guide. Configure gateway/WAF rate limiting and complete account recovery before opening public registration.

## Changes made

- Removed `typescript.ignoreBuildErrors` from `frontend/next.config.js`; production builds now fail instead of silently bypassing type errors.
- Added owner checks to authenticated form CRUD, submission listing, and site analytics.
- Parameterized the analytics SQL query.
- Corrected the form DTO's definite-assignment declaration.
- Fixed the reported frontend TypeScript issues and restored the CMS service methods expected by its controller.
- Restricted authenticated site access and publishing to the site owner, limited the global site listing to Super Admin, and hide unpublished sites from public lookup.
- Corrected PayPal subscription persistence to match the Prisma schema and require an ACTIVE subscription.
- CMS uploads now remain in `SCANNING`; the scan endpoint explicitly reports that malware-scan verification is unavailable rather than marking files clean. Public media queries omit stored file bytes.
- Disabled unsafe PayPal order/shop order and capture endpoints, bound verified subscription activation to the authenticated user through PayPal `custom_id`, verified webhook signatures against PayPal, and made renewal date updates idempotent using the provider's next billing time.
- Updated the deployment guide to disclose that CMS object storage and malware scan integration are incomplete.
- Integrated CMS uploads, replacement, retrieval, and deletion with private S3 objects; media stays unavailable until the configured GuardDuty result tag is read as `NO_THREATS_FOUND`.
- Prevented CMS publication and admin preview before a clean scan; added scan-result/ownership unit tests and an API health/database E2E smoke test.
- Replaced the disabled quote-form Turnstile placeholder with the actual challenge component and fail-closed UI when its public site key is absent.
- Removed all current frontend ESLint errors and warnings; validated CMS blog HTML before `dangerouslySetInnerHTML` and escaped JSON-LD script data.
- Validated shop settings/product payloads, typed frontend API boundaries, made CV document proxy URLs deployment-configurable, and removed test-like pricing claims from the pricing page.
- Restored a working authenticated `/sites` create/list route for the website-builder pricing CTA and removed development-only database/path copy from client-facing list pages.

## Verification results

| Check | Result |
|---|---|
| `npx prisma validate` | **PASS** — Prisma schema is valid. |
| `GET http://localhost:4000/api/health` | **PASS** — the currently running local API reported `status: ok`, `database: ok`. This verifies that running instance only, not a production or newly built deployment. |
| `npm run typecheck` in `frontend/` | **PASS** — zero TypeScript errors on the final frontend changes. |
| `npm run lint` in `frontend/` | **PASS** — zero errors and zero warnings on the final frontend changes. |
| `npm run build` in `frontend/` | **PASS** — optimized production build and route generation completed. CMS-backed dynamic routes logged expected local API-unavailable fallback messages because no API was running during this build. |
| `npx tsc --noEmit -p tsconfig.json` at repository root | **PASS** — zero backend TypeScript errors after Prisma Client regeneration. |
| `npx nest build` | **PASS** — latest root production build compiled 112 files. |
| `npx prisma validate` | **PASS** — Prisma schema is valid. |
| `npm run build` at repository root | **PASS (2026-11-01)** — Prisma Client v5.22.0 generated and NestJS SWC compiled 112 files. |
| Prisma Client generation/file lock | **PASS in latest run** — Prisma generation completed in 264 ms without `EPERM`; prior lock appears resolved for this run. |
| `npm test` | **PASS (2026-11-01)** — 38/38 unit tests passed across 5 suites, including seven PayPal security tests. |
| `npm run test:e2e` | **PASS** — production-mode API boot and `/api/health` database connectivity smoke test passed. This does not cover authentication or business workflows. |
| Browser route/mobile smoke | **PARTIAL PASS** — 75 known public/client/admin URL paths returned HTTP 200 in Chromium at a 390px viewport, with no document horizontal overflow. This checks route response/layout only, not page workflows or other browser engines. |
| Database connectivity/migration status | **PASS for configured database** — the E2E health check connected successfully and `prisma migrate status` reports all 10 migrations applied. The environment's production/staging identity and production data integrity were not independently established. |
| CMS S3/GuardDuty integration | **CODED, NOT LIVE-VERIFIED** — no AWS bucket, credentials/IAM role, GuardDuty plan, or threat-scan test was available. Existing `fileData` records still require a migration plan. |
| Authenticated workflows, Chrome/Edge/Firefox/Safari matrix, desktop/tablet interaction tests, Lighthouse, payment, live storage/scanning, email, backup, and recovery tests | **NOT RUN** — no configured, controlled staging environment was available. |

### Database and relations

The schema validates, and targeted review covered User, UserPlan, Project, Site, Form, FormSubmission, SiteView, and FormView. Forms cascade from sites; submissions and form views cascade from forms; site views cascade from sites; project file/message/activity rows cascade from projects; project owners have a cascading user relation. Relevant owner/status/date lookup indexes exist on projects and analytics.

Schema gap: `Site.userId` and `SiteDomain.siteId` are plain strings without declared foreign-key relations to User/Site. Adding constraints requires checking existing production data for orphan rows and preparing a migration; this was not attempted without DB verification. No migration was generated or applied.

## Bug and error report

- Frontend typecheck, lint (0 errors / 0 warnings), and production build pass locally. Build logs include expected CMS/API-unavailable fallbacks because staging services were not running.
- Latest root build passed Prisma Client generation and NestJS compilation without a DLL lock. Earlier Windows file-lock failures make it prudent to verify generation in the staging deployment pipeline as well.
- The new tests cover access-check helpers, scan-result gating, API startup, and database health only; registration, login/logout, projects, file handling, messaging, checkout, admin workflows, and broad authorization flows remain unverified end to end.
- The Chromium route smoke is not a cross-browser or workflow test. Lighthouse was attempted locally but failed with `NO_FCP`; scores of 90+ for performance, accessibility, best practices, or SEO are **not established**.
- CMS S3/GuardDuty code is implemented but has not been validated against AWS, and pre-existing database-backed media needs migration; CMS is not production-ready.
- Project file uploads currently use local disk, remain `SCANNING`, and have no verified scanner transition; the deployment guide now records this limitation. Do not confuse the CMS S3/GuardDuty path with project-file scanning.

## Implemented in this assessment

- Tenant ownership enforcement for authenticated form and analytics operations.
- Parameterized SQL for daily site-view analytics.
- Frontend production build no longer suppresses TypeScript errors.
- Existing Prisma schema passes `prisma validate`.

No new MFA, notification, backup, monitoring, payment, or administrative feature was represented as implemented.

## Production deployment checklist

- [x] Resolve frontend and backend TypeScript errors (both checks pass).
- [x] Resolve frontend lint findings; `npm run lint` reports zero errors and zero warnings.
- [x] Complete a root `npm run build` including Prisma generation locally (2026-11-01). Verify the build again in the staging deployment pipeline.
- [ ] Expand automated coverage to authentication, project/file ownership, admin boundaries, critical API workflows, and browser E2E scenarios.
- [ ] Add the Site/User and Site/SiteDomain foreign keys only after production orphan-data verification and migration planning.
- [ ] Verify CMS S3 and GuardDuty against a non-production bucket, migrate any existing `fileData` records, and test clean/infected/pending object states before enabling uploads.
- [ ] Run the documented registration, login/logout, project, upload, document-sharing, payment, and admin scenarios against staging.
- [ ] Test responsive layouts and supported Chrome, Edge, Firefox, and Safari versions on desktop, tablet, and mobile.
- [ ] Run Lighthouse (or equivalent) against representative public, client, and admin pages; meet the stated thresholds before launch.
- [ ] Verify production RBAC for every privileged API, including Admin Manager and Super Admin boundaries.
- [ ] Validate PayPal live-mode callbacks, S3 upload/download and malware scanning, email/provider integrations, and database migrations in staging.
- [ ] Configure production-only secrets, exact CORS origins, database backups/retention, restore drills, monitoring, and alerting.
- [ ] Add/complete API reference documentation and operator procedures for backup, recovery, deployment, and rollback.
- [ ] Perform a final review of the complete change set and deploy only after all gates pass.

## Production readiness verification request — 2026-11-01

**Local status: PASS — ready for controlled staging deployment. Production decision remains NO-GO.** Root build and unit tests were rerun successfully on 2026-11-01. Results below distinguish source/unit evidence from authenticated staging tests. The user confirmed that no staging URL, AWS staging access, payment sandbox access, or isolated restore target is currently available. No provider secrets were supplied; the approved future method is deployment secret-manager/environment injection (or a gitignored local `.env.staging` file), not chat or source control. No external payment, AWS, or destructive recovery operation was performed.

| Gate | Result | Evidence / remaining work |
|---|---|---|
| Super Admin RBAC | **PARTIAL PASS (unit level)** | Tests confirm Super Admin-only route metadata and `RolesGuard` behavior for tested plans, payment reporting, settings, and selected CMS operations. Full user/project/site/domain/admin-route permissions were not verified with an authenticated Super Admin session. |
| Client RBAC and ownership | **PARTIAL PASS (unit level)** | Tests deny non-Super-Admin roles on the tested privileged routes and deny a client access to another client's project/file. Authenticated API workflows for client projects, files, invoices, and messages were not run. |
| Anonymous access | **PARTIAL PASS (local probes)** | Selected protected API routes returned 401 in a prior local probe. This is not a full API matrix; anonymous browser access to all admin/client pages was not verified. |
| AWS S3 and GuardDuty | **NOT VERIFIED** | No authorized staging bucket/GuardDuty configuration or test object evidence. CMS scan-gate unit tests cover clean, threat, pending, and unknown tag results. Project-file uploads are local-disk and have no verified malware scanner; project uploads are a launch blocker. |
| PayPal lifecycle | **PARTIAL PASS (local code/tests); sandbox not verified** | Unsafe order/shop flows now fail closed; subscription verification binds the active PayPal subscription's `custom_id` to the authenticated user; webhook handlers require PayPal signature verification and use PayPal's next billing date. Seven focused mocked-provider tests pass. No authorized sandbox purchase, renewal, cancellation, failure, or delivered webhook evidence is available. |
| Stripe | **N/A by current source scope** | No Stripe references or Stripe integration were found in the reviewed application source or package manifest. |
| Render deployment | **NOT VERIFIED** | No Render service/configuration was found; the deployment guide documents Vercel projects. No Render URL or deployed artifact is available. |
| Security validation | **PARTIAL** | Source-level authorization/file checks and unit tests pass; selected unauthenticated API probes returned 401. No authenticated penetration test, staging isolation test, or private-S3 access test was performed. |
| Domains and SSL | **NOT VERIFIED** | No staging or production domain, certificate issuance, redirect, or HTTPS evidence was supplied. |
| Backup and recovery | **NOT VERIFIED** | No database restore, media restore, or environment rebuild was run. No verified recovery evidence is available. |
| Monitoring and alerts | **NOT VERIFIED** | Configuration presence is not alert-delivery proof. No availability/database/resource/payment/error alert was triggered and received. |
| Lighthouse | **ATTEMPTED / BLOCKED** | Lighthouse 13.6.0 against `http://127.0.0.1:3000/` exited with `NO_FCP` (no first contentful paint); no category scores or usable report were generated. No 90+ result is established. |
| Cross-browser/device workflows | **NOT VERIFIED** | Earlier Chromium 390px route/layout smoke covered 75 paths without horizontal overflow, but it did not test workflows, other engines, or physical devices. Current local frontend probe timed out. No Safari, Firefox, Edge, iPhone, or Android workflow evidence. |
| Automated tests | **PARTIAL PASS** | Latest `npm test`: 38/38 unit tests pass across 5 suites, including seven PayPal security tests. `npm run test:e2e` passes the API startup/health/database smoke. Login, project creation, CMS, payment-provider sandbox, and browser E2E coverage remain absent. |
| Prisma schema | **PASS** | Latest `npx prisma validate` passed. This does not prove production data integrity or live provider connectivity. |
| Full root build | **PASS (latest local run)** | `npm run build` generated Prisma Client v5.22.0 and compiled 112 NestJS files successfully. This confirms local build readiness, not a deployed staging build. |

### RBAC test matrix (scope-qualified)

| Role | Tested authorization boundary | Result |
|---|---|---|
| Super Admin | Tested plans, payment list/statistics, settings mutations/upload limits, and selected CMS operations | **PASS (unit-level only)** |
| Client | Denied on tested Super Admin-only operations; denied access to a project owned by another client in the project-file service test | **PASS (unit-level only)** |
| Anonymous | Selected protected local API requests returned 401 | **PASS (selected local probes only)** |
| All roles / full requested route inventory | User/project/site/domain management, all admin routes, invoices/messages, full client own-data access, and real JWT/API sessions | **NOT VERIFIED** |

The test matrix is not a substitute for staging authorization tests. No role is certified for production.

### Payment and deployment scope review — 2026-11-01

The reported `PAYPAL_ONLY_PASS` and production GO remain **unverified**. Stripe is absent from the reviewed package/source scope. Targeted remediation now prevents the previously identified payment bypasses:

- The four generic order/shop endpoints return `503 Service Unavailable` instead of fabricating orders, trusting client-submitted captures, or issuing success-shaped download tokens. Shop checkout is unavailable until a server-side PayPal Orders API flow is implemented; the existing contact fallback remains separate from online checkout.
- Subscription activation still uses PayPal's subscription API, but now requires an active subscription with a PayPal `custom_id` matching the authenticated user and rejects a subscription already assigned to another user. The pricing page supplies the signed-in user's ID as that custom ID.
- Both PayPal webhook routes call the PayPal signature-verification API using the required transmission headers and configured `PAYPAL_WEBHOOK_ID`. Missing configuration or an invalid signature is rejected; processing/database failures are no longer converted into success responses.
- Renewal processing fetches authoritative subscription state from PayPal and sets `endDate` to its `next_billing_time`, making duplicate renewal events idempotent.
- `npm test` includes seven new mocked-provider security tests for disabled checkout paths, user binding, valid/invalid webhook signatures, cancellation, and idempotent renewal.

These are local code/unit-test results only. PayPal Sandbox has not been configured or used, so subscription purchase, renewal, cancellation, failed payment, and signed webhook delivery have not been verified against PayPal. Configure `PAYPAL_ENV=sandbox`, matching sandbox credentials, and the sandbox `PAYPAL_WEBHOOK_ID`; do not use `PAYPAL_MODE` as a substitute. Production payment approval must wait for authorized sandbox evidence. No Render configuration or deployment was verified; current deployment documentation is Vercel-specific.

### Evidence limitations and required next steps

- The local frontend did not answer the latest HTTP probe. Lighthouse 13.6.0 failed with `NO_FCP`, and the shared browser page's body-text inspection timed out; a partial viewport screenshot was captured but is not sufficient to validate a page or workflow. The historical 75-route Chromium smoke is explicitly limited evidence, not proof of page functionality.
- No AWS, PayPal sandbox, domain, monitoring, or recovery logs/screenshots exist for this verification because the corresponding authorized staging systems were unavailable.
- Before retesting, provision a confirmed staging URL, test accounts through the approved secret-injection method, AWS/GuardDuty and payment sandbox access, and an isolated restore target. Do not send credentials in chat or commit `.env.staging`.
- The latest root build passed without a Prisma DLL lock. Re-run the build in the staging deployment pipeline and verify its generated artifact there.
- Implement private object storage and a verified malware scan lifecycle for project files; investigate legacy `AVAILABLE` records before release.
- Run authorized PayPal sandbox subscription purchase/renewal/cancellation/failure and signed-webhook tests. Implement and verify server-side order checkout before re-enabling shop/order endpoints.
- Provision and verify the intended Render deployment configuration separately; current deployment instructions target Vercel.
- Complete the remaining staging and browser/device tests and attach their evidence before changing the deployment decision.

## Documentation and operational gaps

[`DEPLOYMENT.md`](./DEPLOYMENT.md) documents environment setup, Vercel configuration, migrations, storage, and important feature limitations. [`frontend/README.md`](./frontend/README.md) covers frontend setup and product scope. These are useful starting points, but the platform is not accompanied by complete API documentation, a verified production runbook, a backup/restore procedure, monitoring configuration, or evidence of a successful production deployment.
