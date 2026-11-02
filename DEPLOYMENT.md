# Local, preview, and production setup

## Local development

1. Install Node.js 20.9 or newer, then run `.\Setup.ps1` from the repository root.
2. Copy `.env.example` to `.env`; configure `DATABASE_URL`, a unique `JWT_SECRET`, and the PayPal server credentials. Keep this file private.
3. Copy `frontend\.env.example` to `frontend\.env.local`; configure the API URL, public PayPal client ID, and verified public contact details. `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_WHATSAPP_NUMBER` default to the existing Contact page details; set `NEXT_PUBLIC_PHONE_NUMBER` only when a separate business phone is verified. The API URL expects the backend on port 4000.
4. Apply database migrations with `npm run prisma:migrate:deploy`.
5. Start the backend with `npm run start:dev`; in a second terminal run `npm run dev` from `frontend`.
6. Visit `http://localhost:3000`; the API readiness check is `http://localhost:4000/api/health`.
7. Create an account at `http://localhost:3000/register`, then sign in at `/login`. Registration creates customer accounts only.
8. To bootstrap the first Super Admin, first register the account, then promote exactly the intended account using a trusted database console:

   ```sql
   UPDATE "User"
   SET "role" = 'SUPER_ADMIN'
   WHERE lower("email") = lower('admin@example.com');
   ```

   Verify that exactly one row was updated. Never add public admin registration.
9. Sign in again and open `http://localhost:3000/admin`. The Super Admin can assign roles and capabilities from Users & Access. Website content editing endpoints are restricted to `SUPER_ADMIN`; other staff capabilities require explicit assignment.

The `20261019170000_admin_rbac_foundation` and `20261019170100_admin_access_audit` migrations add the Super Admin and manager roles, user permissions, and activity log. The follow-up access migration converts existing `ADMIN` accounts to `ADMIN_MANAGER` with no capabilities and `CUSTOMER` accounts to `CLIENT`; back up the database before deploying migrations. Explicitly promote only the chosen first Super Admin with the SQL above. Existing registrations remain client-only. The Activity Log records CMS edits and user access changes. Automated database backups are not configured by the application; configure provider-native scheduled backups and retention after selecting the production database host.

## AI CV Builder

The authenticated CV Builder uses the API's `GROQ_API_KEY` to generate a CV, stores its text against the signed-in account in PostgreSQL, creates a PDF, and uploads the PDF privately to the configured S3 bucket under the `client-cvs/` prefix. Clients can preview and download their own PDFs from `/dashboard/cvs`; the API checks ownership and issues five-minute signed URLs. Apply the `20261019171000_cv_documents` migration before enabling the feature. The API runtime needs `AWS_REGION`, `AWS_S3_BUCKET`, and scoped S3 PutObject/GetObject/DeleteObject permissions (or equivalent credentials). Email delivery, WhatsApp, CV editing, templates, and premium entitlements are not included in this phase.

`npm run build` builds the backend and generates the Prisma client; run `npm run start:prod` to start that build. Run `npm run build` from `frontend` to build the frontend.

## Project uploads and deliverables

**Project file storage and malware scanning are not production-ready.** The current API writes project uploads to local disk under `private-uploads/projects`, marks new records `SCANNING`, and blocks downloads unless a record is `AVAILABLE`. No verified scanner or safe transition to `AVAILABLE` is implemented for project files. Legacy multipart completion endpoints fail closed; they must not be used as an upload path. Existing `AVAILABLE` records have no verified scan provenance.

Do not enable client project uploads in production until project files are moved to private object storage, an authenticated scan workflow is integrated, legacy records are inventoried and quarantined or rescanned, and clean/threat/pending/unknown scan outcomes are verified in staging. Local-disk storage is not a substitute for replicated private storage or a backup strategy. The separate CMS media workflow uses S3 and GuardDuty; its configuration does not enable scanning for project files.

Supported project-file extensions are DOC, DOCX, PDF, XLS, XLSX, CSV, PPTX, TXT, JSON, XML, ZIP, PNG, JPG, JPEG, and WEBP. The API enforces a 100 MB upload limit and serves project files from a non-public storage directory. Staff with the `projects:manage` capability can manage project status, assignment, messages, and deliverables from `/admin/projects`. Email/SMS project notifications, automatic project status notifications, recycle-bin retention, and self-service staff invitations are not implemented.

## Microsoft 365 and Power BI integrations

Configure these variables only in the API runtime; never add them to frontend `NEXT_PUBLIC_*` variables:

- `M365_TENANT_ID`, `M365_CLIENT_ID`, and `M365_CLIENT_SECRET` for Microsoft Entra app-only OAuth.
- `M365_DRIVE_ID` for the OneDrive/SharePoint drive exposed in the admin integration hub.
- `M365_SENDER_EMAIL` for the Exchange Online mailbox used by the administrator-initiated Outlook send action.
- `POWERBI_WORKSPACE_ID` for the Power BI workspace. The same Entra app registration is used to request Power BI API tokens.

Grant only the required Microsoft Graph application permissions (including `Files.Read.All` and `Mail.Send`) and Power BI service-principal API access. Grant tenant admin consent, enable service-principal access in the Power BI tenant settings, and add the service principal to the configured workspace. Keep sender mailbox access restricted. The admin hub's configured labels only confirm that environment values exist; use its drive/report actions to verify tenant permissions. It supports OneDrive root listing, plain-text Outlook email, Power BI workspace report listing, and a server-side Power BI embed-token endpoint. Email send attempts are recorded in the existing audit log. Embed tokens are short-lived and should be retrieved only by authorized administrator sessions.

The admin hub also links to Microsoft 365 and Acrobat web apps, but those links do not constitute server-side document editing or synchronization. The current S3 project-file store is separate from OneDrive; automatic OneDrive backup/version synchronization is not implemented. Adobe PDF Services operations (PDF creation/conversion, editing, merge/split, security, and e-signature workflows) and Power BI report embedding/export are not implemented. Acrobat web is a manual handoff, not an API integration. Do not describe these capabilities as live until their provider APIs and tenant-specific end-to-end tests are complete.

## Public content management

The admin dashboard's Content Management area controls blog posts, categories, gallery items, homepage content, SEO settings, and the public media library. Apply the additive `20261018160000_add_content_management` migration with `npm run prisma:migrate:deploy` before deploying this version. Existing hardcoded blog posts remain a public fallback until imported from the admin blog manager. The media library reports scan state, selected destinations, and gallery-entry usage. Homepage, Services, About, and Case Studies selections feed their respective public media sections. Homepage Hero is selected separately in Homepage Content. Blog images must be assigned to a post, and Gallery images require a visible Gallery Entry, before they appear in those public contexts.

CMS media is limited to 25 MiB per file and requires `AWS_REGION`, `AWS_S3_BUCKET`, and API-only S3 credentials or an attached IAM role. Objects are uploaded to private S3 and streamed through authenticated/public API routes; the API does not expose bucket URLs. The API reads the configured `AWS_S3_SCAN_TAG_KEY` (default `GuardDutyMalwareScanStatus`) and only changes a media row from `SCANNING` to `AVAILABLE` for the exact `NO_THREATS_FOUND` result. `THREATS_FOUND` and known scan failures are rejected; missing or unknown tags remain unavailable. Enable GuardDuty Malware Protection for S3, configure its result tags, grant the API role `s3:GetObjectTagging`, and verify clean, threat, and pending scan outcomes in a non-production bucket before launch. The API uses the AWS SDK credential chain, so an IAM role is preferred; it does not require browser CORS for CMS upload or download.

The CMS accepts JPEG, PNG, WebP, GIF, PDF, and MP4 file signatures; SVG is rejected because sanitization is not implemented. Existing records that contain legacy PostgreSQL `fileData` must be inventoried and migrated to the private bucket before this version serves them. The old database value is not a storage fallback. Validate media references before deleting legacy objects; blog/homepage reference cleanup and production-data migration still need staging verification. Admin previews require a Super Admin token, and media cannot be previewed or published before a clean scan. Project deliverables use a separate local-disk workflow and are not covered by the CMS S3/GuardDuty integration; see the project upload warning above. Public blog and gallery routes retrieve published content through the API, while CMS mutations and media management require a Super Admin token. Keep the API available to the frontend and set `NEXT_PUBLIC_API_URL` to its base URL including `/api`.

The API now implements scan-result polling, but the GuardDuty plan, IAM permissions, clean/infected/pending cases, and legacy-media migration must be verified in staging before enabling CMS uploads in production. PDF and MP4 viewers and video thumbnails are not implemented. Assigning an image to the Gallery location makes it eligible for selection but does not create a gallery entry; save an entry in Website Gallery Management to display it publicly. The homepage hero has its own image picker, separate from the homepage's “From our work” section. Homepage statistics and client testimonials are stored in the existing CMS JSON setting, so managing metrics and approving testimonials does not require a database migration. Only testimonials with explicit administrator approval are returned by the public homepage API. Admin routes also verify the signed-in user's administrator role through `/api/auth/me`; API authorization remains independently enforced.

## AI, Search, and Turnstile

Before deploying the Phase 2 AI/search features:

1. Apply migration `20261019150000_add_ai_and_search_center` with `npm run prisma:migrate:deploy`.
2. Set `GROQ_API_KEY`, `TURNSTILE_SECRET_KEY`, and a unique random `AI_SESSION_SECRET` (at least 32 characters) in the API runtime only. Set `TURNSTILE_ALLOWED_HOSTNAMES` to a comma-separated allowlist for each environment.
3. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the frontend environment. Use separate Turnstile site/secret keys for preview and production. Public AI, quote, contact, and booking submission remains unavailable until server-side verification and the hostname allowlist are configured.
4. Set `TRUST_PROXY_HOPS` to the exact number of trusted reverse proxies in front of the API, typically `1` for one known platform proxy. This setting is used to derive the client IP for limits; do not trust arbitrary forwarded-IP headers or set a hop count without checking the deployed network.
5. Enable and verify GuardDuty Malware Protection scan-result tags on the configured private S3 bucket. AI knowledge uploads use the `ai-knowledge/` object prefix and are not parsed or indexed until `NO_THREATS_FOUND` is present. The original S3 object is deleted after extraction; extracted text remains in PostgreSQL until an administrator deletes the knowledge entry.

The AI chat API limits each signed browser session to 10 requests per minute and each client IP to 20 per minute using PostgreSQL-backed counters. Anonymous conversations store one question/answer exchange per row, are visible to administrators at `/admin/ai-center`, and are automatically deleted after 90 days. Search query analytics are also retained for 90 days; the browser's five recent searches are local storage. Administrators can upload PDF, DOCX, XLSX, CSV, and TXT knowledge files up to 10 MB. Search uses public services, published CMS blog posts, public gallery entries, available homepage FAQs/case studies, and static training/resource entries; it does not index private projects or admin-only knowledge files.

Project-file AI analysis is a manual administrator action, not automatic client-file processing. Only malware-scanned files up to 10 MB are accepted, the administrator must confirm that the client authorized external AI processing, and extracted text is sent to Groq. The confirmation, administrator, and report are recorded. Review all AI output before sharing or relying on it.

The quote form collects company size, employee count, scope, and an optional budget range, but numeric cost/timeline estimates are intentionally disabled until TMG approves pricing rules. `/admin/analytics` reports available database metrics; invoices are not modeled, so outstanding invoice analytics are unavailable. Sentry, Google Analytics, and Microsoft Clarity are not configured by this implementation and require separate privacy/configuration decisions before launch.

## Vercel deployments

Use separate Vercel projects for the API and frontend:

- **API project:** repository root as the project root, Node.js 20.9 or newer, install with `npm ci`, build with `npm run vercel-build`. Set `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, `CORS_ORIGINS`, `TRUST_PROXY_HOPS`, `SENTRY_DSN`, Turnstile and Groq variables when those features are enabled, `PAYPAL_MODE` (`sandbox` or `live`), and exactly one matching `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_WEBHOOK_ID` set. Do not configure `PAYPAL_ENV`, `PAYPAL_SECRET`, or both `PAYPAL_SANDBOX_*` and `PAYPAL_LIVE_*`; the API rejects legacy, mixed, and mode-prefixed credential sets. Use sandbox credentials and matching public client ID for Preview/staging; use live credentials only in the separately approved Production environment. Attach an IAM role or provide API-only AWS credentials. Store all real secrets in the deployment secret manager. The root `vercel.json` forwards `/api/*` requests to the shared function in `api/`.
- **Frontend project:** set the project root to `frontend`, install with `npm ci`, and build with `npm run build`. Set `NEXT_PUBLIC_API_URL` to the API deployment's base URL including `/api` (for example, `https://your-api.example.com/api`), the matching public Turnstile site key, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, and the public contact variables to verified business details. Set `NEXT_PUBLIC_SENTRY_DSN` only when client-side error monitoring is approved; it initializes after page load and browser idle, with replay disabled and production traces sampled at 10%. Keep provider secrets only in the API environment.
- Configure environment variables separately for Preview and Production. Set `CORS_ORIGINS` to the exact frontend origins allowed to call each API deployment. Use a separate database for Preview; never point Preview at production data.
- After deployment, apply pending migrations with `npm run prisma:migrate:deploy` from a controlled release step, then check `<API deployment URL>/api/health`. It returns healthy only when the API can reach PostgreSQL.
- PayPal webhook requests are limited to 30 per IP per minute in each API process. The default limiter store is in-memory and is not shared across replicas; configure a shared gateway/WAF limit for horizontally scaled deployments.

## Render frontend deployment

For the Next.js frontend service, set the Root Directory to `frontend`, the Build Command to `npm ci --include=dev --legacy-peer-deps && npm run build`, and the Start Command to `npm run start`. Including development dependencies is required because Tailwind CSS and its PostCSS plugin are build-time dependencies. Keep the Render build environment's `NODE_ENV` from excluding development dependencies; the explicit `--include=dev` protects the install if production mode is set.

The frontend CSS explicitly scans `frontend/src` for Tailwind classes. After deployment, verify the served `/_next/static/` CSS includes utility rules such as `.flex{display:flex}` and `.hidden{display:none}`. If it does not, clear Render's build cache and redeploy the latest commit; both the Render service URL and custom domain should serve the same newly built assets.

## Render API deployment

For the API service, set the Root Directory to the repository root, the Build Command to `npm ci --include=dev --legacy-peer-deps && npm run build`, and the Start Command to `npm run start:prod`. Prisma CLI and the Nest build CLI are development dependencies required during the build, so the install must include development dependencies even when the runtime uses production mode.

## Verification commands

- `npm test` runs backend unit tests, including canonical PayPal mode validation and webhook throttling.
- `npm run test:e2e` builds the API and runs the database health check plus HTTP auth/project ownership workflows. The auth/project workflows are skipped unless `E2E_DATABASE_URL` points to an isolated disposable test database; never point it at staging or production data.
- `npm run test:e2e:cms` runs an opt-in real S3 CMS upload/delete smoke test when `CMS_E2E_API_URL` and a temporary Super Admin `CMS_E2E_ADMIN_TOKEN` are injected from the secret manager. It does not prove GuardDuty scan outcomes.
- PayPal sandbox purchases, renewals, failures, cancellations, and signed webhook delivery still require a configured sandbox buyer, webhook, and staging URL. Do not claim those external lifecycle checks passed based on local mocks or unit tests.
- Apply `20261101100000_enable_client_project_access` before deploying the client project workflow. It grants existing `CLIENT` accounts only project create/read/update permissions; project ownership is still checked server-side, staff-directory access is role-restricted, and this migration does not enable project file-upload permission.

## Authentication and API access

- `POST /api/auth/register` and `POST /api/auth/login` are public. Registration accepts a name, email, and password of at least 12 characters; passwords are bcrypt-hashed before storage. Registration uses the same generic response for new and already-registered email addresses; sign in separately after registering.
- `POST /api/quote-requests` accepts public enquiries; listing requests and changing their status require an administrator token.
- PayPal subscription activation uses the PayPal subscription SDK and `POST /api/paypal/verify`. The API queries PayPal directly, requires an active subscription, and binds its `custom_id` to the authenticated user. Configure the matching PayPal webhook ID and point PayPal to `/api/paypal/webhook`; webhook events are verified with PayPal's signature-verification API before processing. Use sandbox credentials and webhook ID together for staging, and live values only for a separately approved production release.
- `POST /api/payments/orders`, `POST /api/payments/capture`, `/api/payments/shop/orders`, and `/api/payments/shop/capture` fail closed and are disabled because server-side PayPal order creation/capture is not implemented. The product shop should not be represented as accepting online payments; its existing contact fallback is not a payment transaction. Do not re-enable these routes until the server creates orders from trusted catalog/prices, captures through PayPal, verifies amount/currency/status, and issues entitlements only after verified capture.
- Authenticated endpoints require `Authorization: Bearer <accessToken>`. Access tokens expire after 15 minutes. `POST /api/auth/logout` revokes all of that user's existing tokens; `GET /api/auth/me` returns the authenticated profile.
- Legacy gym, member, plan, subscription, and stats endpoints require an authenticated administrator. Health and root readiness endpoints are public.
- Store `JWT_SECRET` only in the API runtime environment. Use a unique, random value of at least 32 characters in each environment. Never use the local development fallback in production.
- Apply the new `20261018000000_add_tmg_accounts_and_operations` migration before deploying code that uses the new account and business models. The migration is additive and leaves existing gym-related tables intact.
- Apply `20261018140000_add_project_delivery` before deploying project delivery endpoints.
- Email verification, self-service password reset, refresh tokens, multi-factor authentication, and application-level login rate limiting are not implemented yet. Add rate limiting at the API gateway/WAF before opening registration or login to public traffic, and complete email verification and account recovery before a full consumer launch.
