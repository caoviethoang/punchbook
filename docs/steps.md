# PunchBook — Docs prompts for AI app build

This document contains the full product context plus phase-by-phase prompts to give to an AI coding tool (Claude Code, Cursor, etc.) to build incrementally. Paste the entire "Project context" section at the start of each new AI session, then use each phase prompt in order.

---

## Project context (paste at the start of each new AI session)

```
I am building "PunchBook" — a web app for managing membership packages for small
spa/nail/gym/clinic businesses in Vietnam. Target users: shop owners who are not
tech-savvy and currently manage members with Excel/paper notebooks.

Stack: Ruby on Rails (backend + view rendering), React (via Vite Ruby or
react-rails) for interactive screens, PostgreSQL, Sidekiq for background
jobs, Devise for auth, RSpec for tests.

Mandatory principles:
- All logic related to money/session counts must have automated tests; do not
  merge without test cases for edge cases.
- All webhooks from third parties (payOS) must verify signature before processing;
  never trust request data blindly.
- UI must be as minimal as possible — end users are shop staff who are not
  tech-savvy; the main action (check-in) must be doable in 1–2 clicks.
- Do not add libraries/dependencies beyond what is needed for each phase.
```

---

## Data model (ERD summary)

```
Shop
 └─ Staff        (staff member, belongs to one shop)
 └─ Package      (service package: name, session/day count, price)
 └─ Membership   (member: name, phone, package_id, sessions/days remaining, expiry)
      └─ CheckIn (each visit: membership_id, staff_id, timestamp)
      └─ Invoice (balance/payment: membership_id, amount, status, payOS transaction id)
```

Relationships: Shop 1-n Staff, Shop 1-n Package, Shop 1-n Membership, Package 1-n Membership, Membership 1-n CheckIn, Staff 1-n CheckIn, Membership 1-n Invoice.

---

## Feature list by phase

| Phase | Features |
|---|---|
| MVP (free) | Create packages, add members, check-in, auto deduct sessions, expiry warnings on dashboard |
| Paid (~50–70k VND/month) | Unlimited members, automated reminders via Zalo ZBS, multiple staff accounts, Excel report export |

---

## Phase 1 — Project setup & data model

```
Initialize a new Rails app named "PunchBook" using PostgreSQL, with RSpec for tests
and Devise for authentication.

Create migrations + models for the following tables, matching the described associations:

- Shop: name (string), phone (string), plan (string, default "free")
- Staff: shop (references), name (string), role (string)
- Package: shop (references), name (string), sessions_count (integer,
  nullable — null means day-based package, not session-based), duration_days
  (integer, nullable), price (integer, unit VND)
- Membership: shop (references), package (references), customer_name
  (string), phone (string), sessions_left (integer), expires_at (date,
  nullable)
- CheckIn: membership (references), staff (references), checked_in_at
  (datetime)
- Invoice: membership (references), amount (integer), status (string,
  default "pending"), payos_transaction_id (string, nullable)

Add full has_many/belongs_to associations on each model per the ERD.
Add basic validations: presence for required fields, numericality
sessions_left >= 0.

Set up Devise on the Shop model so shop owners can log in.

After finishing, run migrations and confirm db:schema.rb matches the description.
```

---

## Phase 2 — Core business logic + tests

```
Write a CheckInMembership service object to handle check-in logic:
- Input: membership, staff
- If package is session-based: check sessions_left > 0; if not, raise a clear
  error (e.g. InsufficientSessionsError); if yes, deduct 1 within a
  transaction and create a CheckIn record
- If package is day-based: check expires_at >= Date.current; if expired raise
  an error; if still valid, only create a CheckIn record (do not deduct anything)
- The entire operation must be in one database transaction to avoid race
  conditions when 2 check-in requests hit the same membership at once (use
  pessimistic locking with_lock or optimistic locking)

Write full RSpec tests for this service, must cover:
- Successful check-in when sessions/days remain
- Failed check-in when out of sessions/expired; must not go negative
- Concurrent check-in (2 threads/requests at once) must not deduct wrong session count
- Check-in for day-based package must not change sessions_left

Do not write controller/routes at this step; focus only on service + tests.
```

---

## Phase 3 — API/controller for check-in & member list

```
Create MembershipsController and endpoints:
- GET /memberships?query=... — search members by name (for check-in screen),
  return only members belonging to the logged-in shop
- POST /memberships/:id/check_in — call CheckInMembership, return JSON
  with updated membership state (sessions_left or expires_at) or a clear
  error if it fails

Ensure both endpoints are scoped to current_shop (Devise); do not allow
shop A to operate on shop B's data (write a dedicated test for this — the
most common security hole in multi-tenant apps).

Write request specs (RSpec) for both endpoints, including deliberately calling
the API with a membership_id from another shop and confirming it is blocked (403 or 404).
```

---

## Phase 4 — Check-in UI (React)

```
Set up Vite Ruby (or react-rails if you prefer) to embed React on the
check-in page.

Build a CheckInScreen component with:
- Member search by name, 300ms debounce, calls GET /memberships API
- Result list showing name, package name, sessions/days remaining
- "Check-in" button per member — disabled if out of sessions/expired, show
  "Expired" instead of allowing click
- On check-in click: call POST /memberships/:id/check_in, immediately update
  remaining sessions on UI (optimistic update), rollback if API errors and
  show a clear error message

Prioritize minimal UI, large text, clear actions — users are shop staff who
are not tech-savvy. No complex responsive design needed; just run well on
10–15 inch tablet/laptop screens.
```

---

## Phase 5 — Owner dashboard

```
Build a dashboard page (React or Rails view — your choice from earlier
steps) showing:
- 3 metrics: current month revenue (sum of Invoice amount where status=paid
  in the month), active membership count, memberships expiring within
  7 days
- Member table: name, package, sessions/days remaining, status
  (active / expiring soon / expired — computed from sessions_left or
  expires_at)

Write GET /dashboard endpoint returning all of the above in one response;
avoid N+1 queries (use includes/eager load for Package on Membership).
```

---

## Phase 6 — Create service packages & add members

```
Build screens + endpoints allowing the shop owner to:
- Create a new service package (PackagesController#create): name, session count
  or day count, price
- Add a new member (MembershipsController#create): name, phone, select existing
  package — on create set sessions_left = package.sessions_count or
  expires_at = Date.current + package.duration_days

Add validation: if shop is on "free" plan, do not allow creating the
16th member onward (raise a clear error, suggest upgrading to paid plan).
```

---

## Phase 7 — payOS integration (payments)

```
Integrate payOS to create QR payment links when a member needs renewal:
- POST /memberships/:id/invoices — create Invoice status=pending,
  call payOS API to create payment link, return QR code URL for frontend display
- POST /webhooks/payos — receive payment confirmation webhook from
  payOS. IMPORTANT: verify webhook signature per official payOS docs
  before processing; reject invalid requests. After successful verification:
  update Invoice status=paid, refresh sessions_left/expires_at on the
  corresponding Membership per the purchased package

Write dedicated tests for webhook verification: valid signature is processed,
invalid or missing signature is rejected and makes no DB changes.

Read the actual payOS docs (https://payos.vn) before coding this part —
do not guess field names or webhook structure.
```

---

## Phase 8 — Automated Zalo reminders (paid plan only)

```
Write a Sidekiq job running daily (schedule via sidekiq-cron or whenever):
- Scan all Memberships for shops with plan="paid", where sessions_left <= 3
  or expires_at within the next 7 days
- For each membership found, call Zalo ZBS API to send a reminder with payment
  link (reuse invoice creation endpoint from phase 7)
- Log sends to avoid duplicate messages the same day for the same member

Read the actual Zalo ZBS docs before coding — this API is uncommon;
do not guess request structure.
```

---

## Phase 9 — PWA

```
Add manifest.json and a basic service worker so the app can be "installed" as a
desktop app from Chrome/Edge. Cache static assets (JS/CSS) for faster load on
subsequent opens; do not cache dynamic data (API responses).
```

---

## Review checklist before considering a phase "done"

- [ ] Automated tests exist for business logic, not just manual testing
- [ ] Every endpoint is scoped to the current shop (no cross-shop data leaks)
- [ ] Third-party webhooks/APIs verify signatures; never trust data blindly
- [ ] UI tested with realistic seed data, not only happy path
- [ ] No remaining TODO/temporary code affecting session count or money correctness
