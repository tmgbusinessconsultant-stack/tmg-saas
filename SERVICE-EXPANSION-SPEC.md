# TMG Business Consulting

## Service Expansion and Client Data Portal Specification

**Document purpose:** Define the target services, client experience, administration workflows, and platform requirements for TMG Business Consulting. This is a product specification, not a statement that the capabilities are currently implemented.

## 1. Project objective

Build an international business consulting platform where clients can discover services, request or purchase consulting work, securely exchange files, track projects, communicate with the administrator, receive deliverables, and pay invoices.

The platform serves startups, small and medium-sized businesses, and enterprise clients worldwide.

## 2. Services

### 2.1 Business analysis

Review business operations, workflows, market opportunities, performance gaps, and growth opportunities.

**Potential deliverables**

- Business performance and process review reports
- SWOT analysis
- Business improvement recommendations
- Market opportunity analysis
- Business growth strategy
- Process maps

| Package | Starting price | Scope |
| --- | ---: | --- |
| Starter | $99 | Small-business review; one business report delivered as PDF |
| Professional | $299 | Full business analysis, SWOT analysis, process mapping, and recommendations report |
| Enterprise | $999+ | Multi-department transformation assessment, executive presentation, and strategic roadmap |

### 2.2 Business automation

Automate repetitive business activities using AI and software tools.

**Potential solutions:** workflow, CRM, email, lead-capture, customer-support, and broader business-process automation, including AI chatbots.

| Package | Starting price | Scope |
| --- | ---: | --- |
| Starter | $199 | One automation workflow |
| Growth | $499 | Up to three automated processes |
| Premium | $1,499+ | Full business automation implementation |

### 2.3 Data analysis

Transform client data into actionable business intelligence. Supported input formats and sources include Excel, CSV, Google Sheets, SQL exports, JSON, and PDF reports.

**Potential deliverables:** data cleaning, executive dashboards, KPI reports, trend analysis, forecasting, visualizations, and business intelligence reports.

| Package | Starting price | Scope |
| --- | ---: | --- |
| Basic | $49 | Up to 5,000 rows; basic report |
| Professional | $149 | Up to 50,000 rows; charts and dashboards |
| Advanced | $499+ | Large datasets; advanced analytics and custom reports |

### 2.4 AI consulting

Offer professional AI consulting as a core service. The recommended starting-price range is $149-$2,000+. Specific packages, deliverables, and scope are to be defined before publishing a purchase flow.

### 2.5 Productivity and process improvement

Offer consulting to improve productivity, workflows, and business processes. Specific packages, deliverables, and pricing are to be defined before publishing a purchase flow.

## 3. Public website

The public website should provide:

- **Home:** Headline, "AI - ANALYZE - AUTOMATE - GROW"; explain how TMG helps businesses transform operations, automate workflows, and make smarter decisions through consulting, automation, and data analytics.
- **Services:** Business analysis, business automation, data analysis, and AI consulting. Include productivity and process improvement in the service offering.
- **Pricing:** Clearly present the defined packages and starting prices, and distinguish fixed prices from "starting at" prices.
- **Portfolio:** Case studies and project examples.
- **About:** TMG Business Consulting's story and mission.
- **Contact:** Quote request and consultation-booking options.
- **Blog:** Search-optimized educational articles.

### 3.1 Quote request

The quote request form must collect:

- Name
- Company
- Country
- Email
- Service needed
- Project description
- Budget range
- Optional file upload

The submission action should be labeled **Request Proposal**.

## 4. Client accounts and portal

### 4.1 Account access

Clients must be able to register, sign in, reset a forgotten password, and verify their email address. Account access must support two-factor authentication.

### 4.2 Client dashboard

Show the client's:

- Active, completed, and pending projects
- Messages and notifications
- Uploaded files
- Invoices
- Payment history

### 4.3 Project lifecycle

Clients can submit projects, provide requested information, view project status, communicate with the administrator, and retrieve delivered work.

Project statuses include:

1. Awaiting Review
2. In Progress
3. Additional Information Required
4. Quality Check
5. Completed
6. Delivered

The administrator can create projects, update statuses, and associate client files, communications, invoices, and deliverables with the relevant project.

## 5. File exchange and delivery

### 5.1 Client uploads

Support drag-and-drop uploads, upload progress, secure storage, virus scanning, and file preview.

Client-submitted formats:

- Documents: PDF, DOCX, PPTX, TXT
- Data: CSV, XLS, XLSX, JSON, XML
- Images: PNG, JPG, JPEG

Maximum client file size: **2 GB per upload**. Use provider-backed multipart upload; do not proxy multi-gigabyte bodies through the web or API runtime. Accept the file as pending malware scan and make it downloadable only after a clean scan result.

### 5.2 Consultant deliverables

The administrator must be able to download client files, analyze them, upload finalized deliverables, and notify the client. The client must receive an email notification, a dashboard notification, and a download link when work is delivered.

## 6. Administration and communication

### 6.1 Admin dashboard

Administrators must be able to:

- View new orders, quote requests, and uploaded files.
- Create and manage projects and assign project statuses.
- Communicate with clients and request additional information.
- Upload completed work.
- Generate invoices and manage subscriptions.

The admin overview should report total users, active, pending, and completed projects, revenue, new orders, new messages, uploaded files, and pending reviews. Values must be computed from authorized application data, not hard-coded examples. Revenue must have a defined currency and period; user and project counts must have documented status definitions.

### 6.2 Communication center

Provide project-linked consultant chat, project updates, notifications, file exchange, and support tickets.

## 7. Direct data connections

Offer a premium business-intelligence connector service for client-authorized data sources.

**Supported source categories**

- Business systems: MySQL, PostgreSQL, SQL Server, Oracle
- Cloud platforms: Google Sheets, Airtable
- CRM: HubSpot, Salesforce
- E-commerce: Shopify, WooCommerce
- Accounting: QuickBooks, Xero

**Workflow**

1. The client requests an integration and provides credentials through a secure mechanism.
2. The client approves the connection and intended access.
3. The system encrypts credentials, retrieves data securely, and processes the analysis.
4. The administrator reviews imported data, prepares reports, and delivers findings.

Credentials and access must be scoped to the approved connection and protected from unauthorized access.

## 8. Payments

Integrate Flutterwave as the primary payment provider and PayPal as the secondary provider. Stripe and Wise Business are optional providers for future consideration.

Support one-time payments, subscription payments, and invoice payments. Supported display and transaction currencies are USD, EUR, and GBP, subject to provider and settlement support.

## 9. Security, privacy, and operations

The target platform must provide:

- SSL/TLS for data in transit and encryption for stored files.
- Virus scanning for uploaded files.
- Two-factor authentication and role-based access controls.
- GDPR-compliant privacy, data handling, and user-rights processes.
- Automated backups and audit logs for important account, project, file, and administrative actions.
- Secure handling of data-source credentials and payment information.

Security-sensitive integrations and controls must be designed and verified before the corresponding feature is made available to clients. This specification does not assert that compliance or a security control has been independently certified.

## 10. Search visibility and performance

Optimize public pages for Google, Bing, and discovery in AI-powered search experiences, including ChatGPT and Copilot. Provide:

- Schema markup and structured data appropriate to page content.
- XML sitemap and `robots.txt`.
- Open Graph metadata.
- Fast-loading pages.

## 11. Technology direction

The requested technology direction is:

- Frontend: Next.js, React, Tailwind CSS
- Backend: Node.js, Express.js
- Database: PostgreSQL
- File storage: AWS S3 or Cloudflare R2
- Authentication: JWT and two-factor authentication
- Payments: Flutterwave and PayPal APIs

Any implementation decision that differs from this direction should be documented separately; this specification does not prescribe a migration or authorize changes to the current application.

## 12. Future AI product features

The following product features are explicitly Phase 2:

- AI Business Analyzer
- AI Data Analyst
- AI Report Generator
- AI Process Improvement Assistant
- AI Dashboard Builder

Phase 2 product features are distinct from offering AI consulting as a human-delivered core service.

## 13. Pricing guidance and open decisions

Recommended starting-price ranges:

- Data analysis: $49-$499+
- Business analysis: $99-$999+
- Automation projects: $199-$1,499+
- AI consulting: $149-$2,000+

Before enabling self-service purchase for every service, define the final scope, package inclusions, turnaround expectations, and terms for AI consulting and productivity/process improvement. Confirm applicable taxes, currencies, payment-provider availability, file-retention periods, and the operational limits for 2 GB multipart uploads and virus scanning.

## 14. Administrator content and file management

This section extends the portal requirements above with administrator content-management and file-management capabilities. These are target-state requirements and are not a claim that they are implemented.

### 14.1 File manager

Provide a dedicated administrator file manager to upload, download, replace, rename, move, archive, restore, soft-delete, search, tag, sort, organize, preview, and recover files. Record file ownership, associated client and project, upload date, current status, and version history.

Administrator-managed files may include:

- Documents: PDF, DOC, DOCX, PPT, PPTX, TXT, RTF
- Data: CSV, XLS, XLSX, JSON, XML, SQL
- Images: JPG, JPEG, PNG, SVG, WEBP
- Media: MP4, MOV, AVI
- Archives: ZIP, RAR, 7Z

Maximum administrator file-manager upload size: **2 GB per file**, matching the client upload limit in section 5.1. Use multipart uploads and validate end-to-end provider, scanning, browser, and storage limits; do not route file bytes through a serverless request body.

Treat file extensions and declared MIME types as untrusted input. Validate actual content where practical, scan uploads before making them available, and prevent active or unsafe content from being rendered inline. Preview availability depends on format and safe preview support.

### 14.2 Project file organization

Present a consistent logical folder structure for each client and project:

- Uploaded Files
- Project Files
- Completed Deliverables
- Reports
- Invoices
- Communications

The structure is an organizational view over access-controlled records and object storage; it must not rely on guessable public paths. Enforce client and project ownership checks for every list, preview, upload, and download operation.

Within a project, administrators need to inspect received files and their owner and upload date, download source material, upload working files and reports, and deliver completed work, revisions, and final reports. Example deliverables include dashboards, Power BI files, Excel and PDF reports, assessments, strategies, SWOT analyses, documentation, source files, process maps, and video guides.

### 14.3 File lifecycle and deletion

File statuses must support Received, Under Review, Data Cleaning, Analysis In Progress, Automation In Development, Awaiting Approval, Completed, Delivered, and Archived. Authorized administrators can change a status; status changes must be attributed and audited. File status is distinct from project status in section 4.3.

Deleting a file moves it to a recycle bin for **30 days**, during which authorized staff may restore it. After the retention period it may be permanently deleted according to the documented retention and backup policy. Deletion, restoration, replacement, movement, and delivery must be auditable. Define how retention obligations, legal holds, backups, and client deletion requests interact before enabling permanent deletion.

Replacement must preserve version history and record who replaced the file and when. Bulk operations may include multi-select, download, delete, archive, move, tag assignment, and export. Apply per-file authorization and confirmation to destructive bulk operations, and record each affected file in the audit log.

### 14.4 Content management

Authorized administrators should be able to manage public content without code changes:

- **Home page:** hero text, service highlights, pricing, images, videos, and testimonials.
- **Blog:** create, edit, schedule, and delete posts; manage categories and images.
- **Services:** create, edit, enable, disable, and retire service listings, including Business Analysis, Business Automation, Data Analysis, AI Consulting, and any approved future service such as SEO Consulting.

Use role restrictions, validation, previews, and audit history for publishing changes. Deleting or retiring a service must not silently remove historical project, order, or invoice references. Public content changes should not bypass existing SEO, accessibility, privacy, or brand review requirements.

### 14.5 Client requests

Service requests should be available to authorized administrators with the client's name, company, email, phone (when collected), country, requested service, budget, description, and attached files. Collect phone only when the form and privacy notice explain its purpose. Protect request data and attachments using the same access and file-safety controls as project data.

### 14.6 Data connection administration

The administrator connection center should show authorized connected accounts and support connecting and disconnecting sources, refreshing data, scheduling imports, exporting data, and reviewing sync logs.

In addition to the sources in section 7, consider Microsoft Excel Online for spreadsheet connections. Connections must be explicitly authorized by the client, use least-privilege scopes, protect credentials and tokens, support revocation, and audit connection, refresh, export, and disconnect actions. Never expose stored credentials or tokens in dashboards or logs.

### 14.7 Roles and access boundaries

Implement least-privilege role-based access, with permissions enforced by the API and data layer as well as the interface:

| Role | Intended access |
| --- | --- |
| Super Admin | Full administrative access, including role and security settings |
| Project Manager | Assigned client and project operations, communications, and project files |
| Analyst | Assigned analysis work and files required for that work |
| Finance | Invoices, payments, subscriptions, and relevant financial reports |
| Client | Only their own account, projects, files, communications, and invoices |

Define specific permissions for publishing, file deletion, exports, connection credentials, user administration, and billing before implementation. Use individual accounts, avoid shared administrator credentials, and audit privileged actions.

### 14.8 Admin navigation

Organize the administrator workspace around:

- Dashboard
- Clients: all clients, active clients, client files
- Projects: all, active, completed, archived
- Services
- File Manager: upload, downloads, shared files, archive, recycle bin
- Data Integrations: databases, CRM, accounting, APIs
- Payments: orders, invoices, subscriptions, revenue
- Content Management: pages, blog, SEO, media library
- Settings: security, users, notifications, backups

Show only navigation and actions permitted to the signed-in role.

## 15. Storage, audit, and resilience requirements

The target file-storage options are Amazon S3 or Cloudflare R2, selected after confirming operational, regional, compliance, and cost requirements. Provide encryption in transit and at rest, private-by-default access, role-based authorization, version history, recovery procedures, automated backups, and audit logs.

Use short-lived, scoped download links when direct object-storage delivery is appropriate. Do not expose storage credentials or public buckets. Define backup retention, recovery objectives, restoration testing, file-retention policy, and deletion behavior across primary storage, versions, and backups.

## 16. Scale and service quality

Design for a growth target of **10,000 or more registered users** and enterprise clients. This is a capacity objective, not a current user count or a performance guarantee. Establish measurable availability, latency, throughput, upload, and recovery targets before launch; verify them with representative load tests and operational monitoring.

Project status changes should appear promptly in the client portal, with delivery notifications sent through email and the dashboard. Define notification retry and failure handling so a failed email does not falsely indicate that a deliverable was not stored or delivered.

## 17. Cross-requirement decisions

- The 2 GB per-file maximum applies to both client uploads and administrator uploads. The implemented project workflow uses 16 MiB multipart parts direct to private S3; deployments must configure S3 CORS, least-privilege IAM, and malware scanning before accepting real files.
- File statuses describe individual files; project statuses describe project progress. Keep the two state machines separate and define allowed transitions.
- Dashboard example figures are illustrative only. Production dashboard metrics must come from real, permission-filtered records with clear definitions and currency/time-period context.
- The service specification and technology direction in this document remain target-state requirements. Existing implementation and deployed behavior must be assessed separately before representing a feature as available.

## 18. CV builder and document management

This section specifies a future professional CV-builder and personal document-management capability. It extends the existing AI tools and client portal requirements; it does not indicate that persistence, exports, versioning, cloud storage, or administrative document access are currently implemented.

### 18.1 CV creation workflow

Provide a CV Builder entry under **AI Tools**. The user should be able to provide:

- Full name and contact information
- Location
- Professional summary
- Work experience
- Education
- Skills
- Certifications
- Languages
- References

Support Modern, Professional, Executive, and Corporate templates. Before generation, allow the user to review and correct supplied information. Clearly distinguish user-provided facts from AI-generated suggestions; do not invent qualifications, work history, or contact details.

### 18.2 Personal document library

With the user's authorization, save generated CVs to their account so they can return after navigating away or refreshing the page. Provide a **My Documents** area with CVs, cover letters, reports, business analysis, data analysis reports, and downloads.

For each stored document, keep its owner, document ID, title, type, template where relevant, creation date, last-updated date, status, and current version. Users should be able to view, download, rename, and delete their own documents. Ensure all document and version operations enforce ownership on the server; possession of a document ID or download URL must not grant access.

### 18.3 Editing, duplication, and version history

Users should be able to open a saved CV, edit its information, regenerate it, save changes, and download it again. Allow users to duplicate a CV for another target role and give each copy a meaningful title.

Retain a version history for saved changes and let the user restore a prior version. "Unlimited versions" is a product aspiration, not an assumed storage guarantee: define quotas, retention, and fair-use limits before launch. Record version timestamps and ensure restoring a version does not silently erase newer versions.

### 18.4 Document exports

Provide downloadable PDF and DOCX exports, plus TXT and HTML where supported. The PDF should use professional, readable formatting and selectable text where possible; CV templates should avoid layouts that make applicant-tracking-system parsing unnecessarily difficult. Generate a safe filename from the document title or user's name, such as `John_Smith_CV.pdf`.

The brief requests both `.doc` and `.docx`; prefer modern `.docx` output and treat legacy `.doc` as a separate compatibility decision because it is a different format. Verify that each advertised export is a valid file of the declared type. LinkedIn and Indeed exports are future possibilities, not launch requirements.

### 18.5 Cover letters and AI assistance

Add an AI Cover Letter Builder that can create, save, edit, and export cover letters to PDF and DOCX in the user's document library.

Potential CV review and optimization features:

- Grammar and formatting suggestions
- ATS-oriented checks, with an explanation that any score is an estimate and not a hiring outcome
- Missing-keyword suggestions based on a user-provided job description
- Match score and improvement recommendations based on the supplied CV and job description

Require user review before applying AI suggestions. Explain how CV content and job descriptions are processed, and do not reuse personal document content for unrelated purposes without an explicit, appropriate legal basis and user notice.

### 18.6 Deletion, recycle bin, and recovery

When a user deletes a document, move it to a recycle bin for **30 days**, allow the owner to restore it during that period, then permanently delete it according to the published retention policy. Make deletion and restoration status visible to the user. Define how legal holds, data-subject deletion requests, backups, and retained versions interact before implementing automatic purge.

### 18.7 Administrative document access

An administrator document area may provide authorized staff with search, usage statistics, download, delete, and restore operations for user-generated CVs, cover letters, reports, and archived documents. Access must be restricted by role and purpose, minimized to what support and operations require, and recorded in an audit log. Do not treat "admin access" as unrestricted browsing of personal CV content; establish a documented support or moderation reason and appropriate user notice before enabling content access.

### 18.8 Storage and security

Store documents in private Cloudflare R2 or Amazon S3 storage selected according to the storage requirements in section 15. Encrypt data in transit and at rest, restrict access by owner and role, and use short-lived scoped download links. Do not expose public object URLs, storage credentials, or signed links in logs.

Define backup and recovery procedures, version retention, deletion propagation, and storage quotas. CVs contain personal data; document collection purposes, access, retention, deletion, and applicable user rights in the privacy notice and operational procedures.

### 18.9 Related navigation

The client experience may organize navigation as:

- Dashboard
- My Documents: CVs, cover letters, reports, downloads
- AI Tools: CV Builder, Cover Letter Builder, ATS Checker, CV Optimizer
- Projects
- Messages
- Billing
- Settings

Show only features available to the user and avoid presenting planned tools as active.

### 18.10 Release and acceptance criteria

Before describing this capability as available, verify that:

- Generated documents persist to the authenticated owner's account and remain available after refresh and a later sign-in.
- Users can edit, duplicate, version, restore, rename, download, and delete only their own documents.
- PDF and DOCX exports open as valid files, use safe filenames, and reflect the selected template and saved content.
- Cover letters follow the same ownership, storage, export, and deletion controls.
- The recycle-bin retention period and permanent deletion behavior are enforced and tested.
- Administrative document actions require appropriate roles and create auditable records.
- Privacy notices, retention rules, storage limits, export handling, and AI data processing are documented before launch.
