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

The project workflow uses private Amazon S3 multipart uploads. Configure `AWS_REGION` and `AWS_S3_BUCKET` in the API environment. Prefer an IAM role attached to the API runtime; if that is unavailable, set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` only in the API environment. Never expose storage credentials to the frontend. `AWS_S3_ENDPOINT` is optional and intended for S3-compatible development storage. The optional `AWS_S3_SCAN_TAG_KEY` defaults to `GuardDutyMalwareScanStatus`.

Create a private bucket with block-public-access enabled, bucket versioning enabled, and default server-side encryption enabled. Give the API role only the necessary multipart upload, object read/delete, object-tag read, and abort/list-multipart permissions scoped to this bucket and project object prefix.

Enable Amazon GuardDuty Malware Protection for S3 on the bucket and configure scan-result object tags. The application keeps uploaded files unavailable until the configured scan tag reports `NO_THREATS_FOUND`; `THREATS_FOUND` and `UNSUPPORTED` files remain unavailable. Ensure the API role may read object tags. Configure lifecycle cleanup for incomplete multipart uploads and define object retention/backups for your business requirements. Do not represent scanning as active until the GuardDuty protection plan is enabled and verified.

Configure the bucket CORS policy for the exact frontend origins (for example, `http://localhost:3000` during local development and the production frontend origin after deployment). Permit `PUT`, allow the required signed request headers, and expose the `ETag` response header. For browser-based downloads, allow `GET` from those origins as well. Never use wildcard origins in production. The frontend transfers each file directly to S3 in 16 MiB parts; the default maximum is 100 MB per file and administrators can change it in `/admin/settings` from 1 to 2048 MB. `MAX_PROJECT_UPLOAD_SIZE_MB` sets the default until an administrator saves a database setting. Signed upload-part URLs expire after 15 minutes and download URLs after 5 minutes. Supported project-file extensions are DOC, DOCX, PDF, XLS, XLSX, CSV, PPTX, TXT, JSON, XML, ZIP, PNG, JPG, JPEG, and WEBP.

After configuring the database, storage bucket, credentials, and scanner, apply migrations using `npm run prisma:migrate:deploy`, then build and start the API and frontend. Clients can create projects and upload source files at `/dashboard`; staff with the `projects:manage` capability can manage status, assignment, project messages, and deliverables from `/admin/projects`. Only clean scanned files are downloadable. Email/SMS project notifications, automatic project status notifications, recycle-bin retention, and self-service staff invitations are not implemented by this workflow.

## Microsoft 365 and Power BI integrations

Configure these variables only in the API runtime; never add them to frontend `NEXT_PUBLIC_*` variables:

- `M365_TENANT_ID`, `M365_CLIENT_ID`, and `M365_CLIENT_SECRET` for Microsoft Entra app-only OAuth.
- `M365_DRIVE_ID` for the OneDrive/SharePoint drive exposed in the admin integration hub.
- `M365_SENDER_EMAIL` for the Exchange Online mailbox used by the administrator-initiated Outlook send action.
- `POWERBI_WORKSPACE_ID` for the Power BI workspace. The same Entra app registration is used to request Power BI API tokens.

Grant only the required Microsoft Graph application permissions (including `Files.Read.All` and `Mail.Send`) and Power BI service-principal API access. Grant tenant admin consent, enable service-principal access in the Power BI tenant settings, and add the service principal to the configured workspace. Keep sender mailbox access restricted. The admin hub's configured labels only confirm that environment values exist; use its drive/report actions to verify tenant permissions. It supports OneDrive root listing, plain-text Outlook email, Power BI workspace report listing, and a server-side Power BI embed-token endpoint. Email send attempts are recorded in the existing audit log. Embed tokens are short-lived and should be retrieved only by authorized administrator sessions.

The admin hub also links to Microsoft 365 and Acrobat web apps, but those links do not constitute server-side document editing or synchronization. The current S3 project-file store is separate from OneDrive; automatic OneDrive backup/version synchronization is not implemented. Adobe PDF Services operations (PDF creation/conversion, editing, merge/split, security, and e-signature workflows) and Power BI report embedding/export are not implemented. Acrobat web is a manual handoff, not an API integration. Do not describe these capabilities as live until their provider APIs and tenant-specific end-to-end tests are complete.

## Public content management

The admin dashboard's Content Management area controls blog posts, categories, gallery items, homepage content, SEO settings, and the public media library. Apply the additive `20261018160000_add_content_management` migration with `npm run prisma:migrate:deploy` before deploying this version. Existing hardcoded blog posts remain a public fallback until imported from the admin blog manager. The Media Library shows scan/publishing state, selected destinations, and references from blog posts, gallery entries, and homepage settings; destination previews explain the follow-up steps. Homepage, Services, About, and Case Studies selections feed their respective public media sections. Homepage Hero is selected separately in Homepage Content. Blog images must be assigned to a post, and Gallery images require a visible Gallery Entry, before they appear in those public contexts. Deletion is protected when media is still referenced by saved content.

CMS media is limited to 25 MiB per file and supports JPG/JPEG, PNG, SVG, WebP, GIF, PDF, and MP4. Set `STORAGE_DRIVER=local` for development to store CMS media under `LOCAL_STORAGE_DIR` (default `storage/cms`) without AWS configuration. Local storage does not perform malware scanning; uploaded files are marked `UNSCANNED`, remain private, and cannot be published. Use local storage only for trusted development previews, not production publishing. Files are stored outside the public web root and served through the API for authenticated admin previews. Switch to `STORAGE_DRIVER=s3` for deployment: the API stores objects privately under the S3 `uploads/` prefix in the selected content folder (`blog`, `services`, `clients`, `gallery`, or `documents`); the bucket must not be public. Grant the API runtime's IAM role the required object read, write, and delete permissions plus object-tag read access for this prefix, in addition to the project-upload permissions above. The API checks file signatures, sanitizes SVG uploads, optimizes supported raster images to WebP, and requires the configured GuardDuty malware scan result to be clean before publication. Verify that GuardDuty Malware Protection for S3 and scan-result tags are enabled before allowing administrators to publish uploaded files.

Published media is served through the API at `/api/content/media/:id/file`; do not expose S3 object URLs or storage credentials to the browser. Admin previews require an administrator token. The project deliverables workflow above continues to use S3 multipart uploads and still requires `AWS_S3_BUCKET`, regardless of the CMS `STORAGE_DRIVER` setting. Public blog and gallery routes retrieve published content through the API, while CMS mutations and media management require an administrator token. Keep the API available to the frontend and set `NEXT_PUBLIC_API_URL` to its base URL including `/api`.

Only scanned images can be assigned to public website sections. PDF and MP4 uploads stay in the private Media Library; in-page video players, PDF viewers, and video thumbnails are not implemented. Assigning an image to the Gallery location makes it eligible for selection but does not create a gallery entry; save an entry in Website Gallery Management to make it appear publicly. The homepage hero has its own image picker, separate from the homepage's “From our work” section. Homepage statistics and client testimonials are stored in the existing CMS JSON setting, so managing metrics and approving testimonials does not require a database migration. Only testimonials with an explicit administrator approval are returned by the public homepage API. Admin routes also verify the signed-in user's administrator role through `/api/auth/me`; API authorization remains independently enforced.

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

- **API project:** repository root as the project root, Node.js 20.9 or newer, install with `npm ci`, build with `npm run vercel-build`. Set `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, `CORS_ORIGINS`, `TRUST_PROXY_HOPS`, Turnstile and Groq variables when those features are enabled, `PAYPAL_ENV` (`sandbox` or `live`), the matching `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`, AWS S3 settings, and any Microsoft/Power BI environment variables required above. Attach an IAM role or provide API-only AWS credentials. The root `vercel.json` forwards `/api/*` requests to the shared function in `api/`.
- **Frontend project:** set the project root to `frontend`, install with `npm ci`, and build with `npm run build`. Set `NEXT_PUBLIC_API_URL` to the API deployment's base URL including `/api` (for example, `https://your-api.example.com/api`), the matching public Turnstile site key, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, and the public contact variables to verified business details. Keep provider secrets only in the API environment.
- Configure environment variables separately for Preview and Production. Set `CORS_ORIGINS` to the exact frontend origins allowed to call each API deployment. Use a separate database for Preview; never point Preview at production data.
- After deployment, apply pending migrations with `npm run prisma:migrate:deploy` from a controlled release step, then check `<API deployment URL>/api/health`. It returns healthy only when the API can reach PostgreSQL.

## Authentication and API access

- `POST /api/auth/register` and `POST /api/auth/login` are public. Registration accepts a name, email, and password of at least 12 characters; passwords are bcrypt-hashed before storage. Registration uses the same generic response for new and already-registered email addresses; sign in separately after registering.
- `POST /api/quote-requests` accepts public enquiries; listing requests and changing their status require an administrator token.
- `POST /api/payments/orders` and `POST /api/payments/capture` are public checkout operations. The API creates orders at fixed plan prices and verifies capture status and amount with PayPal before storing payment records. Do not accept payment amount or status assertions from the browser.
- Authenticated endpoints require `Authorization: Bearer <accessToken>`. Access tokens expire after 15 minutes. `POST /api/auth/logout` revokes all of that user's existing tokens; `GET /api/auth/me` returns the authenticated profile.
- Legacy gym, member, plan, subscription, and stats endpoints require an authenticated administrator. Health and root readiness endpoints are public.
- Store `JWT_SECRET` only in the API runtime environment. Use a unique, random value of at least 32 characters in each environment. Never use the local development fallback in production.
- Apply the new `20261018000000_add_tmg_accounts_and_operations` migration before deploying code that uses the new account and business models. The migration is additive and leaves existing gym-related tables intact.
- Apply `20261018140000_add_project_delivery` before deploying project delivery endpoints.
- Email verification, self-service password reset, refresh tokens, multi-factor authentication, and application-level login rate limiting are not implemented yet. Add rate limiting at the API gateway/WAF before opening registration or login to public traffic, and complete email verification and account recovery before a full consumer launch.
