# Product Requirements Document (PRD)

Product: PunchBook

Document Version: 1.0

Status: Draft

Author: Louis Cao

Last Updated: 2026-07-27

---

# 1. Purpose

This document describes the full functional requirements of PunchBook.

It is the source of truth for:

- Product
- Design
- Backend
- Frontend
- QA
- AI Coding Agent

If other documents conflict, the PRD takes precedence.

---

# 2. Product Summary

PunchBook is a membership management app for small spas, nail salons, gyms, and clinics.

The app focuses on:

- customer management
- package management
- check-in
- renewal
- payment

The app does NOT target CRM or ERP.

---

# 3. Goals

## Business Goals

Within 90 days.

- 5 paying customers
- MRR > 300,000 VND
- 80% of pilot customers continue using the product

---

## Product Goals

- Fully replace paper notebooks.
- Check-in under 5 seconds.
- No staff training required.

---

## User Goals

Owner:

- Know today's revenue.
- Know which customers are about to expire.
- Stop writing in notebooks.

Staff:

- Check in quickly.
- Not have to remember how many sessions a customer has left.

---

# 4. Non Goals

We will not build:

- CRM
- ERP
- Booking
- Marketing
- Loyalty
- POS

---

# 5. Stakeholders

Owner

Staff

Customer

Founder

---

# 6. User Roles

## Owner

Full access.

Can

- create shop
- create staff
- create packages
- create customers
- check in
- process payments
- view dashboard
- export

---

## Staff

Can

- check in
- find customers
- create customers
- renew

Cannot

- delete data
- export
- configure shop

---

# 7. Product Modules

MVP includes.

1 Dashboard

2 Customer

3 Package

4 Membership

5 Check-in

6 Payment

7 Settings

---

# 8. User Stories

## Dashboard

As an Owner

I want

to see today's revenue

So that

I know how the shop is doing.

---

As an Owner

I want

to see customers about to expire

So that

I can proactively remind them to renew.

---

## Customer

As Staff

I want

to find customers by name or phone number

So that

I can check in quickly.

---

As Staff

I want

to view customer history

So that

there are no disputes.

---

## Package

As Owner

I want

to create packages

So that

I can sell them to customers.

---

## Membership

As Staff

I want

to see remaining session count

So that

I know whether check-in is allowed.

---

## Check-in

As Staff

I want

to check in with one button

So that

I do not need many steps.

---

## Payment

As Staff

I want

to renew immediately when sessions run out

So that

service is not interrupted.

---

# 9. Functional Requirements

FR-001

The system must allow creating customers.

---

FR-002

Each customer must have a unique phone number within a shop.

---

FR-003

The system must allow searching customers.

---

FR-004

Search by

- name
- phone number

---

FR-005

Check-in must automatically

- create CheckIn
- deduct sessions
- update Membership

---

FR-006

If out of sessions.

Check-in is not allowed.

---

FR-007

If expired.

Check-in is not allowed.

---

FR-008

Renewal must create Payment.

---

FR-009

On successful payment.

Membership is activated.

---

FR-010

Every action must be recorded in Audit Log.

---

# 10. UX Principles

Each screen has one goal only.

Example

Dashboard

↓

View.

---

Check-in

↓

Check-in.

---

Do not mix multiple workflows on one screen.

---

# 11. Success Metrics

Median Check-in Time

<5s

---

Average Click

<=3

---

Training Time

<30s

---

Crash Free

>99%

---

# 12. Assumptions

- Shop owner has a smartphone.
- Internet is available.
- Staff know how to use a browser.

---

# 13. Constraints

MVP

Web App

PWA

No native app.

---

Rails API

React

GraphQL

---

# 14. Dependencies

payOS

Zalo

Cloudflare R2

---

# 15. Risks

Incorrect Membership logic.

payOS webhook sent multiple times.

Network lost during payment.

Double click on check-in.

Two staff check in at the same time.

---

# 16. Open Questions

Do we need to support multiple packages at once?

Allow offline check-in?

Need QR Membership?

Need Excel import in MVP?

---

# 17. Release Plan

MVP

Dashboard

Customer

Package

Membership

Check-in

Payment

---

Beta

Zalo

Export Excel

---

v1.0

Import Excel

Permission

Audit

---

# 18. Acceptance Criteria

A new spa.

Within

10 minutes.

Can

- create shop
- create package
- create customer
- check in
- renew

without reading documentation.

---

# 19. References

01-product-vision.md

07-business-rules.md

08-database-design.md

10-api-spec.md

13-edge-cases.md
