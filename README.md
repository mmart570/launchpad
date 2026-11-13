# LaunchPad

LaunchPad is a full-stack platform connecting computer science students with work orders posted by businesses. Students can discover projects, apply, communicate with businesses, submit deliverables, respond to revision requests, and build a record of completed work. Businesses can publish work orders, review applicants, coordinate projects, and approve submitted work.

> **Project status:** Localhost MVP. The core student-to-business workflow and several account-security and notification flows have been manually tested. This README consolidates the supplied project documentation; it is not an independent audit of the current repository or a production-readiness certification.

## Contents

- [Technology stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [How LaunchPad works](#how-launchpad-works)
- [Features](#features)
- [Project structure](#project-structure)
- [Routes and API reference](#routes-and-api-reference)
- [Database models](#database-models)
- [Authentication and security](#authentication-and-security)
- [File uploads](#file-uploads)
- [Developer guide](#developer-guide)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Code documentation map](#code-documentation-map)
- [Development notes](#development-notes)

## Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React, JavaScript, Vite | Client interface and development server |
| Routing | React Router | Public and role-protected pages |
| Backend | Node.js, Express | REST API, authorization, business logic |
| Database | MongoDB, Mongoose | Users, work orders, applications, submissions, messages, notifications, reports, sessions |
| File uploads | Multer | Multipart upload handling and private file storage |
| Authentication | Password hashing and database-backed session tokens | Account login, authorization, expiration, logout |

## Prerequisites

- [Node.js](https://nodejs.org/) and npm
- [Git](https://git-scm.com/)
- A running MongoDB instance or accessible MongoDB database
- Two terminals (for the frontend and backend)

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/mmart570/launchpad.git
cd launchpad
```

If the project is already on your computer, open its root folder instead.

### 2. Configure and start the backend

From the project root:

```bash
cd server
npm install
```

Review `server/.env.example`, if present, and create `server/.env` with values appropriate for your local environment. The supplied quick-start documentation shows the following example configuration:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=Launchpad
PORT=3000
```

**Check the current `server/index.js` and `.env.example` for the exact environment variable names.** The source documentation does not independently verify every required setting, including any email/password-reset configuration. Do not commit `.env` or credentials.

To see which scripts are available:

```bash
npm run
```

Then use the backend start script defined in `server/package.json` (for example, `npm start` or `npm run dev`, if available). The API is configured in the documented client code at `http://localhost:3000`.

### 3. Start the frontend

Open a second terminal at the project root:

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints, usually **http://localhost:5173**. If Vite selects another port, use the displayed URL.

### 4. Use separate test accounts

For the complete workflow, use a business account and a student account. Separate browser profiles or a normal and an Incognito window help prevent their sessions from interfering.

## How LaunchPad works

### Student workflow

1. Register or log in as a student.
2. Browse open work orders and review project details.
3. Apply to a work order and track the application.
4. If accepted, coordinate with the business and complete the project.
5. Submit notes, a project link, and/or attachments.
6. If changes are requested, read feedback and submit a revised version.
7. Receive approval and view completed work in the account's project history/portfolio.

### Business workflow

1. Register or log in as a business.
2. Create a work order as a draft or publish it.
3. Review applications and accept or reject students.
4. Communicate with the assigned student.
5. Review submitted work and attachments.
6. Request changes with feedback or approve the work.
7. On approval, the work order transitions to completed.

### Main status lifecycles

| Resource | States / transitions |
| --- | --- |
| Work order | `draft` → `open` → `in_progress` → `completed` (documentation also mentions `closed`) |
| Application | `pending` → `accepted` or `rejected` |
| Work submission | `pending_review` → `changes_requested` → new `pending_review` version, or `approved` |
| Report | `open` → `under_review` → `resolved` |

## Features

### Students

- Student registration, login, profile information, and password recovery
- Work-order discovery, category filtering, and project details
- Applications with status tracking and pending-application editing
- Work submissions with version history, feedback, project links, and attachments
- Notifications and project-related communication
- Student portfolio and public profile information for business review

### Businesses

- Business registration, login, and profile information
- Work-order creation, drafts, publishing, editing, and management
- Applicant review, acceptance/rejection, and student profile viewing
- Work-order messaging and notifications
- Submission review, revision requests, and approval
- Dashboard metrics for work orders, applicants, and submissions awaiting review

### Shared functionality

- Role-based routing and server-side authorization
- Database-backed sessions and explicit logout
- Password reset flow
- In-app notifications with read/unread tracking
- Reports/disputes data model
- Responsive UI and reusable components

> **Payments:** Some source documents describe budgets, cost summaries, or payment-related UI. They do **not** establish an integrated payment processor or live payment transfer. Do not treat payment processing as implemented without checking the code.

## Project structure

```text
launchpad/
├── client/
│   ├── src/
│   │   ├── App.jsx                 # Routes and access control
│   │   ├── main.jsx                # React entry point
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── NavBar.jsx
│   │   │   ├── ProfileDropdown.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   └── BusinessInformation.jsx
│   │   ├── pages/                 # Page components (see map below)
│   │   └── styles/                # Page/component CSS
│   └── vite.config.js
├── server/
│   ├── index.js                    # Express API and business logic
│   ├── Schemas/                    # Mongoose models
│   │   ├── User.js
│   │   ├── WorkOrder.js
│   │   ├── Application.js
│   │   ├── WorkSubmission.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   ├── Report.js
│   │   └── session.js
│   └── private_uploads/           # Private upload storage (runtime)
└── README.md
```

The tree describes the structure documented in the supplied guides; additional configuration or test files may exist in the live repository.

## Routes and API reference

### Frontend routes

The following routes are documented in the reviewed application code. `:id` is a dynamic identifier.

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login`, `/signup` | Public | Student authentication |
| `/business-auth` | Public | Business authentication |
| `/forgot-password` | Public | Password recovery |
| `/dashboard` | Student | Browse work orders |
| `/profile` | Student | Student profile |
| `/my-applications` | Student | Application history |
| `/work-orders/:id/apply` | Student | Apply to a work order |
| `/student/work-orders/:id/submit` | Student | Submit work and view feedback |
| `/business-dashboard` | Business | Work orders and applicants |
| `/businesses` | Business | Create work order |
| `/businesses/edit/:id` | Business | Edit work order |
| `/businesses/success` | Business | Work-order confirmation |
| `/students/:id` | Business | Student profile |
| `/business/work-orders/:id/messages` | Business | Project messages |
| `/business/work-orders/:id/submissions` | Business | Review submissions |

`/work-orders/:id` is used for work-order details or role-specific content; check `client/src/App.jsx` for its current rendering behavior.

### Backend API endpoints

**Authentication**

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register an account |
| POST | `/api/auth/login` | Log in and create session |
| POST | `/api/auth/logout` | Revoke current session |
| GET | `/api/auth/me` | Verify session and fetch current user |

**Work orders and applications**

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/work-orders` | Browse open work orders |
| GET | `/api/work-orders/:id` | Get work-order details |
| POST | `/api/work-orders` | Create a work order |
| GET | `/api/business/work-orders` | Business's work orders |
| DELETE | `/api/business/work-orders/:id` | Delete an eligible work order |
| POST | `/api/work-orders/:id/applications` | Apply to work order |
| PATCH | `/api/applications/:id` | Edit pending application |
| GET | `/api/applications/my` | Student's applications |
| GET | `/api/work-orders/:id/applications` | Business's applicants |
| PATCH | `/api/applications/:id/status` | Accept or reject application |

**Submissions and attachments**

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/work-orders/:id/submissions` | Authorized submission history |
| POST | `/api/work-orders/:id/submissions` | Student submits work and attachments |
| PATCH | `/api/submissions/:id/review` | Business approves or requests changes |
| GET | `/api/submissions/:id/attachments/:attachmentId` | Authorized attachment download |

**Notifications and profiles**

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/notifications` | Notifications and unread count |
| PATCH | `/api/notifications/:id/read` | Mark one as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |
| GET | `/api/users/:id` | Profile lookup subject to authorization |

Additional routes (including messaging, reporting, editing, and password reset) may be defined in `server/index.js`. This table is a practical reference, not an exhaustive automatically generated OpenAPI specification.

### Authenticated requests

The client sends its session token in the authorization header:

```http
Authorization: Bearer <session-token>
```

Never commit, publish, or paste real session tokens into documentation.

## Database models

| Model | Responsibility | Key relationships / fields |
| --- | --- | --- |
| `User` | Student and business accounts | Email, password hash, role, student/business profiles |
| `WorkOrder` | Business-posted projects | `businessId`, `assignedStudentId`, status, scope, budget, deadline, skills, submission instructions |
| `Application` | Student applications | `workOrderId`, `studentId`, message, status |
| `WorkSubmission` | Deliverables and reviews | Work order, student, submission number, notes, project URL, attachments, status, feedback |
| `Message` | Work-order conversations | Work order, student, sender, sender role, message |
| `Notification` | In-app activity alerts | Recipient, type, title, message, link, event key, read state |
| `Report` | Disputes and user reports | Work order, student, reason, description, resolution status |
| `session` | Login sessions | Token, user reference, expiration |

Important documented constraints:

- One application per student per work order, enforced by a unique index.
- One work submission per `(workOrderId, submissionNumber)` pair, enforced by a unique index.
- Submission versions increment when a business requests changes.
- Session expiration uses an `expiresAt` field and MongoDB TTL index.
- Notification event keys help avoid duplicate alerts.

## Authentication and security

### Session flow

1. The user registers or logs in.
2. The server validates credentials and creates a random, database-backed session token.
3. The client stores the token in `sessionStorage` or `localStorage`, depending on the login flow.
4. Authenticated requests include `Authorization: Bearer ...`.
5. `requireUser` validates the session and its expiration; `requireRole` enforces student/business permissions.
6. Logout deletes the current server-side session and clears browser session data.

The documented session lifetime is **seven days**. The client checks `/api/auth/me` for protected pages and handles invalid sessions by redirecting users away from restricted content.

### Additional safeguards

- Passwords are hashed rather than stored in plaintext.
- Login requests are rate-limited (the supplied guide describes 10 attempts per 15 minutes).
- Business-only and student-only actions use server-side role checks.
- Work-order/application/submission access is checked against ownership or assignment.
- Application decisions and submission reviews use conditional database updates to avoid repeated state transitions.
- File uploads use size/count limits, validation, and private storage.
- CORS is configured for allowed origins.
- Project links are validated as HTTP or HTTPS URLs.

**Concurrency note:** The unique submission-number index prevents duplicate version numbers if that index is active in MongoDB. The submission-status check and version creation are separate operations; a database transaction or equivalent workflow lock would provide stronger multi-document guarantees. Approval also updates a submission and work order separately.

## File uploads

Student submissions can include notes, an HTTP/HTTPS project URL, and files. The documented limits are:

| Limit | Value |
| --- | --- |
| Maximum attachments per submission | 10 |
| Maximum size per file | 20 MB |
| Storage | Server-side private upload directory |
| Download access | Authorized assigned student or owning business |

The frontend supports drag-and-drop and file browsing. The backend uses Multer and validates uploads. Consult the file filter in `server/index.js` for the current permitted extensions; the supplied documents do not include a definitive extension list.

## Developer guide

### Add an API endpoint

1. Determine whether a Mongoose model or schema change is required in `server/Schemas/`.
2. Add the route to `server/index.js`.
3. Apply `requireUser`, `requireRole`, and resource ownership checks as appropriate.
4. Validate input and handle errors consistently.
5. Connect the endpoint to the appropriate client page or component.
6. Test successful and unauthorized requests.

### Add a page

1. Create a JSX component in `client/src/pages/`.
2. Add its route in `client/src/App.jsx`.
3. Wrap restricted routes in the existing role protection.
4. Add matching styles in `client/src/styles/` if necessary.
5. Verify navigation and loading/error states.

### Formatting

The supplied README recommends Prettier. If it is installed in your project, you can run:

```bash
npx prettier --check .
```

To format files (this **modifies** them):

```bash
npx prettier --write .
```

Review the diff before committing. Install Prettier in the appropriate package only if needed; avoid creating a new root package solely for formatting unless you intend to manage root-level tooling.

### Common development searches

```bash
# Locate Express endpoints
grep -n 'app\.\(get\|post\|patch\|put\|delete\)' server/index.js

# Find authorization middleware usage
grep -n 'requireUser\|requireRole' server/index.js

# Find route definitions
grep -n 'path=' client/src/App.jsx

# Find the schema for a feature
ls server/Schemas
```

## Testing

The following manual checks were reported successful during MVP testing:

| Area | Verified behavior |
| --- | --- |
| Work orders | Business publishes a work order |
| Applications | Student applies; business accepts |
| Deliverables | Student submits, business requests revisions, student resubmits, business approves |
| Role-based pages | Student redirected from business dashboard; business redirected from student applications |
| Backend permissions | Wrong-role API requests rejected; another business's applications not exposed |
| Sessions | Invalid token rejected; logout revokes token; invalid saved session redirects |
| Password reset | Request, reset, new-password login, old-password rejection, one-time reset link |
| Notifications | Application, acceptance, submission, revision, approval alerts and links |
| File selection | 10-file limit tested |

These are **manual functional tests**, not a replacement for automated integration tests, a database index inspection, or a security assessment. Additional recommended checks include attachment authorization, file-type validation, oversized-file rejection, backup/restore, and concurrent API requests.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Blank frontend page | Browser Console, Vite output, `client/index.html` entry point, JSX import paths |
| Frontend won't start | Run commands from `client/`; check `npm install` and `client/package.json` scripts |
| Backend won't start | Run commands from `server/`; check script, environment configuration, server logs |
| MongoDB connection fails | Database service, URI, database name, network access |
| Wrong localhost port | Use the exact URL Vite printed |
| `401 Unauthorized` | Missing, expired, invalid, or revoked session token |
| `403 Forbidden` | Authenticated user lacks role/ownership permission |
| Application or submission conflict (`409`) | Resource may already exist or its state changed; refresh and retry appropriately |
| Upload rejected | File count, size, extension restrictions, or authorization |
| Notifications don't appear | Check notification endpoint, server logs, current account, and refresh behavior |

For deeper investigation, inspect the browser **Network** tab, Express logs, and the relevant MongoDB documents. Avoid indiscriminately clearing all browser storage; remove only LaunchPad session keys when troubleshooting login state.

## Code documentation map

This section consolidates the file-by-file comment references from the former comment index, summary, reference, and completion-checklist documents. **Use filenames and function names rather than old line numbers**, which change whenever code is edited.

### Backend: `server/Schemas/`

| File | What its comments explain |
| --- | --- |
| `User.js` | Student/business profile fields, roles, email uniqueness, password hashes |
| `Application.js` | Application relationships, statuses, unique student/order constraint |
| `WorkOrder.js` | Status lifecycle, business ownership, assignment, budget, skills, deadlines, submission rules |
| `WorkSubmission.js` | Attachments, version numbers, review states, feedback, unique version index |
| `Message.js` | Conversation participants, work-order context, sender metadata, indexes |
| `Notification.js` | Recipients, event types, links, deduplication, read status |
| `Report.js` | Report categories, descriptions, dispute status |
| `session.js` | Token storage, user reference, seven-day expiry, TTL cleanup |

### Backend: `server/index.js`

Search by function, middleware, or route to find these sections:

- **Configuration and setup:** imports, MongoDB connection, CORS, JSON parsing, rate limiting.
- **Authentication:** `requireUser`, `requireRole`, `createSession`, registration, login, logout, `/api/auth/me`.
- **Uploads:** Multer storage, private directory, extension filtering, upload cleanup.
- **Utilities:** `validId`, `validProjectUrl`, work-order field parsing.
- **Notifications:** `notify`, listing, unread counts, marking read.
- **Work orders:** listing, creation, details, editing, deletion, ownership checks.
- **Applications:** apply, edit pending application, list applicants, accept/reject decisions.
- **Submissions:** upload, history, attachment download, approve/request changes.
- **Other features:** profile, messaging, reports, password reset (find their current routes in source).

### Frontend: `client/src/`

| File / folder | Purpose |
| --- | --- |
| `App.jsx` | Imports, session lookup, authentication hook, role-protected routing |
| `main.jsx` | React initialization and DOM mounting |
| `App.css`, `index.css` | Application and global styles |
| `components/NavBar.jsx` | Public navigation |
| `components/ProfileDropdown.jsx` | Account menu, initials, logout |
| `components/NotificationBell.jsx` | Unread badge, notification list, navigation, marking read |
| `components/BusinessInformation.jsx` | Business profile modal |

### Frontend pages: `client/src/pages/`

| Page | Purpose |
| --- | --- |
| `LandingPage.jsx` | Public landing and onboarding |
| `StudentSignup.jsx` | Student registration |
| `StudentLogin.jsx` | Student login and remember-me behavior |
| `StudentDashboard.jsx` | Discover and filter work orders |
| `WorkOrderDetails.jsx` | Project details and application entry |
| `ApplicationSubmission.jsx` | Submit/edit student application |
| `MyApplications.jsx` | Application history and statuses |
| `StudentProfile.jsx` | Student profile and portfolio |
| `StudentPublicProfile.jsx` | Business-facing student profile |
| `StudentWorkSubmission.jsx` | Upload deliverables, see feedback and submission history |
| `BusinessAuth.jsx` | Business registration/login |
| `BusinessDashboard.jsx` | Business work orders, applicants, decisions, statistics |
| `BusinessPage.jsx` | Create/publish work orders and save drafts |
| `BusinessMessages.jsx` | Project-specific messages |
| `BusinessSubmissionReview.jsx` | Download/review submissions, request changes, approve |
| `WorkOrderSuccess.jsx` | Posting confirmation |
| `ForgotPassword.jsx` | Password recovery |

### Styles: `client/src/styles/`

| Stylesheet | Corresponding UI |
| --- | --- |
| `ApplicationSubmission.css` | Student application form |
| `BusinessAuth.css` | Business authentication |
| `BusinessDashboard.css` | Business dashboard |
| `BusinessInformation.css` | Business information modal |
| `BusinessPage.css` | Work-order creation |
| `ForgotPassword.css` | Password recovery |
| `LandingPage.css` | Landing page |
| `MyApplications.css` | Application list |
| `ProfileDropdown.css` | Profile menu |
| `StudentDashboard.css` | Student dashboard |
| `StudentLogin.css` | Student login |
| `StudentProfile.css` | Student profile |
| `StudentSignup.css` | Student signup |
| `WorkOrderDetails.css` | Work-order details |
| `WorkSubmissions.css` | Student and business submission screens |

### Commenting conventions

The supplied documentation describes file headers, logical section dividers, function explanations, inline business-rule notes, and endpoint comments. Keep comments focused on **why** behavior exists, especially authorization, state transitions, and concurrency. Avoid fixed line-number references and update documentation when code changes.

## Development notes

- Keep page-level UI in `client/src/pages/` and shared UI in `client/src/components/`.
- Keep role checks on the backend even when a page is protected by React routing.
- Keep environment secrets and private uploads out of version control.
- Review changes with `git diff` and `git status` before committing.
- Use the project's existing design conventions; avoid unrelated UI changes when fixing logic.
- The original documents contain some historical line counts, dates, and completion percentages that may no longer match the codebase; they have been omitted from this consolidated README.

---

**Documentation:** This single `README.md` replaces the overlapping quick-start, comment index/reference/summary, completion checklist, and missing-files summary documentation while retaining their practical guidance.
