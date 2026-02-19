# Online Booking System -- Development Roadmap (V1)

> Last updated: 2025-02-19 (after Sprint 4 completion)

---

## Sprint Status Overview

| Sprint | Name | Status |
|--------|------|--------|
| 0 | Project Foundation | DONE |
| 1 | Auth + Business Profile | DONE |
| 2 | Services + Working Hours + Closures | DONE |
| 3 | Availability Engine + Public Booking | DONE |
| 4 | Business Calendar + Booking Management | DONE |
| 5 | Policies + Notifications + Manage Link | TODO |
| 6 | Edge Cases + Hardening + Audit | TODO |
| 7 | Admin + MVP Launch | TODO |

---

## Sprint 0 -- Foundation (DONE)

**Goal:** Stable foundation, no product features.

### Delivered
- Next.js App Router project setup (adapted from Express to Next.js API routes)
- Environment config (.env)
- MongoDB connection via Mongoose
- Global error handler (`lib/api-error.ts`)
- Request validation pattern with Zod (`lib/validations.ts`)
- Auth middleware skeleton (`lib/auth.ts`)
- Health check endpoint
- Frontend routing/navigation skeleton
- API client with interceptors (`lib/api-client.ts`)
- Auth token storage
- Base UI components (shadcn/ui)

---

## Sprint 1 -- Auth + Business Profile (DONE)

**Goal:** Business user can log in and create a business.

### Data Models
- `User` (role: OWNER/STAFF/ADMIN, email, passwordHash, fullName, businessId)
- `Business` (name, slug, category, phone, address, timezone, policies)

### API Endpoints
- `POST /api/auth/register` -- register new user
- `POST /api/auth/login` -- login with JWT
- `GET /api/auth/me` -- get current user
- `POST /api/business` -- create business
- `GET /api/business/me` -- get own business
- `PATCH /api/business/me` -- update business

### Frontend Pages
- `/login` -- Login screen
- `/register` -- Register screen
- `/onboarding` -- Create business wizard
- `/dashboard/settings` -- Business settings

### Acceptance
- Owner can register, login, create business, and see it in settings.

---

## Sprint 2 -- Services + Working Hours + Closures (DONE)

**Goal:** Business defines what it offers and when it operates.

### Data Models
- `Service` (name, durationMinutes, price, bufferMinutes, isActive)
- `WorkingHours` (dayOfWeek, startTime, endTime)
- `Closure` (type: BREAK/HOLIDAY, date, startTime?, endTime?, note)

### API Endpoints
- `POST /api/services` -- create service
- `GET /api/services` -- list services
- `PATCH /api/services/:id` -- update service
- `DELETE /api/services/:id` -- delete service
- `PUT /api/working-hours` -- replace weekly hours
- `GET /api/working-hours` -- get working hours
- `POST /api/closures` -- create closure
- `GET /api/closures?from&to` -- list closures
- `DELETE /api/closures/:id` -- delete closure
- `GET /api/public/:slug` -- public business config

### Frontend Pages
- `/dashboard/services` -- Services management UI
- `/dashboard/schedule` -- Weekly schedule editor + closures

### Acceptance
- Business is fully configured with services, hours, and closures.

---

## Sprint 3 -- Availability Engine + Public Booking (DONE)

**Goal:** Client can book an appointment (guest, no account needed).

### Data Models
- `Booking` (businessId, serviceId, startAt, endAt, status, customer, note)

### Core Logic
- Availability engine (`lib/availability.ts`):
  - Loads working hours, closures, existing bookings, service duration + buffer
  - Computes open intervals, generates time slots (15-min grid)
  - Excludes slots overlapping with CONFIRMED bookings
  - Applies `minLeadTimeMinutes` policy

### API Endpoints
- `GET /api/public/:slug/availability?date&serviceId` -- get available time slots
- `POST /api/public/:slug/bookings` -- create booking (guest)

### Frontend Pages
- `/book/[slug]` -- Full public booking flow:
  - Business info header
  - Service selection
  - Date + time slot picker
  - Booking form (name, phone, email, note)
  - Confirmation/success screen

### Acceptance
- Client can create a real booking from public page. Booking appears in DB with correct status (CONFIRMED if autoConfirm, PENDING otherwise).

---

## Sprint 4 -- Business Calendar + Booking Management (DONE)

**Goal:** Business can manage appointments through the app.

### API Endpoints
- `GET /api/bookings?from&to` -- fetch bookings by date range (with service populated)
- `PATCH /api/bookings/:id/status` -- update booking status (cancel/complete/no-show)
- `POST /api/bookings/manual` -- manual add booking (walk-in/phone)
- `GET /api/bookings/availability?date&serviceId` -- private availability for manual booking

### Status Transitions (V1)
- `PENDING` -> `CONFIRMED` / `CANCELLED_BY_BUSINESS`
- `CONFIRMED` -> `COMPLETED` / `NO_SHOW` / `CANCELLED_BY_BUSINESS`

### Frontend Pages & Components
- `/dashboard` -- Updated "Today" view with:
  - Real stats (today's bookings, active, completed, next up)
  - Today's schedule list with clickable booking rows
  - Quick actions
- `/dashboard/calendar` -- Calendar page with:
  - Day view (time grid 07:00-21:00, booking blocks)
  - Week view (7-day time grid, compact booking blocks)
  - Date navigation (prev/next/today)
  - Sidebar booking list grouped by date
- `/dashboard/bookings/new` -- Manual booking page with:
  - Step 1: Service selection
  - Step 2: Date + time slot picker
  - Step 3: Customer details form
  - Step 4: Success confirmation
- `BookingDetailModal` -- Full booking info with status action buttons
- `BookingStatusBadge` -- Color-coded status badges

### Navigation Updates
- Calendar link enabled in sidebar
- "New Booking" button added to header

### Acceptance
- Owner can view all bookings on calendar, manage statuses, and manually add walk-in bookings.

---

## Sprint 5 -- Policies + Notifications + Manage Link (TODO)

**Goal:** Automation and client self-management.

### Planned Work
- **Backend:**
  - Policies update endpoint (cancel window, auto-confirm)
  - Email service integration
  - Email templates (created, approved, rejected, cancelled, reminder)
  - Reminder scheduler (cron/queue)
  - Generate manage token (store hash)
- **Frontend:**
  - Policies settings UI
  - Notification settings UI
  - Manage booking page (client cancel/reschedule via token link)

### Acceptance
- Automatic email reminders work. Client can cancel from a manage link.

---

## Sprint 6 -- Hardening + Audit (TODO)

**Goal:** Production stability.

### Planned Work
- **Backend:**
  - Rate limiting on public endpoints
  - Validation hardening
  - Audit log for booking changes (BookingAudit model)
  - Timezone consistency checks
  - Soft delete / data integrity
- **Frontend:**
  - Slot taken error handling
  - Expired token handling
  - Loading + empty state UX polish

### Acceptance
- System handles real-world errors gracefully.

---

## Sprint 7 -- Admin + MVP Launch (TODO)

**Goal:** Control panel and production deployment.

### Planned Work
- **Backend:**
  - Admin role + endpoints (list businesses, view bookings, disable business)
- **Frontend:**
  - Minimal admin panel
  - Production config (env separation dev/prod)
- **Final checks:**
  - Full booking flow end-to-end test
  - Backup strategy
  - Monitoring basics

### Acceptance
- Production-ready V1 with admin control panel.

---

## Architecture Notes

- **Stack:** Next.js 16 (App Router), MongoDB/Mongoose, Tailwind CSS, shadcn/ui
- **Auth:** JWT with HTTP-only cookie consideration (currently localStorage token)
- **Timezone:** Fixed `Europe/Skopje`, UTC storage in DB
- **Booking rule (V1):** Only `CONFIRMED` blocks slots; `PENDING` does not
- **Roles:** OWNER (full access), STAFF (calendar/bookings view -- optional V1), ADMIN (system)
