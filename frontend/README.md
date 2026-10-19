# TMG Business Consulting - Web Application

This directory contains the Next.js frontend for TMG Business Consulting. The application is built with Next.js, React, TypeScript, and Tailwind CSS and works with the API configured for the environment.

## Getting started

Requirements and full-stack environment setup are documented in the repository's [deployment guide](../DEPLOYMENT.md).

1. Install Node.js 20.9 or newer.
2. Install frontend dependencies:

   ```powershell
   npm ci
   ```

3. Configure the frontend environment using [`frontend/.env.example`](.env.example) and the deployment guide. Do not commit secrets or environment-specific credentials.
4. Start the development server:

   ```powershell
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

Run the frontend commands from this directory.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve a previously created production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |

## Product requirements

The [service expansion, client portal, administrator file manager, content management, and CV document-management specification](../SERVICE-EXPANSION-SPEC.md) describes intended services, workflows, roles, and platform requirements. In particular, see sections 14-17 for administrator content and file management, storage, roles, scale, and cross-requirement decisions, and section 18 for CV creation, exports, personal documents, version history, and administrative access. This is a target-state specification; its inclusion does not imply that every listed capability is currently available.

### Search Center and AI Hub

- `/search` covers the public service/training index, published blog posts, visible gallery entries, and public homepage FAQs/case studies when the API is available. Search queries/results are retained for 90 days for aggregate analytics; the browser keeps at most five recent searches locally. Private projects and admin-only knowledge files are never included in public search.
- `/ai` uses the Groq-backed assistant, protected by Cloudflare Turnstile, a 10-per-minute signed-session limit, and a 20-per-minute IP limit. Conversation exchanges are stored for up to 90 days and can be reviewed/deleted by an administrator at `/admin/ai-center`. Do not enter confidential information.
- Administrators manage the approved AI knowledge files at `/admin/ai-center`. PDF, DOCX, XLSX, CSV, and TXT files are held in private S3 until GuardDuty scan tags indicate clean; only then are they extracted and indexed.
- `/upload` directs clients to the authenticated project workspace at `/dashboard`; it is not a public or anonymous upload endpoint. Administrators can request AI analysis of clean project files up to 10 MB only after confirming client authorization for external AI processing.
- `/quote` submits through the existing quote-request API and is protected by Turnstile. It collects project context but does not calculate automatic pricing or timelines until TMG supplies approved rates.
- `/admin/analytics` shows available search, AI, quote, project, and payment metrics. Invoice metrics are unavailable because invoices are not implemented.

Configure the required API and site Turnstile keys, Groq key, trusted proxy hops, database migration, and malware scanning as detailed in the repository's [deployment guide](../DEPLOYMENT.md). These capabilities do not include Sentry, Google Analytics, Microsoft Clarity, automatic file-analysis, fixed quote estimates, or private-project search.

## Deployment

Use the repository's [deployment guide](../DEPLOYMENT.md) for API and frontend deployment instructions, environment variables, database migrations, and operational notes.
