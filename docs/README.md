# PunchBook

> Digital Membership Management for Small Businesses

---

## Overview

PunchBook is an app that helps service businesses such as spas, nail salons, gyms, and clinics manage customers and service packages instead of paper notebooks.

The product goal is to let staff check in customers in seconds and help shop owners track business activity simply.

PunchBook is **not a CRM**, **not an ERP**, and **not a POS**.

The product focuses on solving one problem:

> Manage customers and service packages quickly, simply, and accurately.

---

# Target Users

## Primary

- Spa
- Nail Salon
- Gym
- Massage
- Clinic

Scale:

- 1 shop
- 2–10 staff
- 100–1000 customers

---

## Users

### Owner

Uses the app to:

- View revenue
- Manage customers
- Manage packages
- Monitor activity

---

### Staff

Uses the app to:

- Find customers
- Check in
- Renew packages
- Process payments

---

# MVP Scope

The first version includes only:

- Authentication
- Customer Management
- Package Management
- Membership Management
- Check-in
- Payment
- Dashboard

Does not include:

- Booking
- CRM
- Marketing
- Loyalty
- QR Check-in
- Multi Branch
- Mobile App

---

# Product Principles

## 1. Speed First

Every action must be fast.

One click is always better than three clicks.

---

## 2. Simplicity

One screen solves one job.

Do not cram multiple features together.

---

## 3. Staff First

95% of actions come from Staff.

All UX is optimized for Staff first.

---

## 4. Owner Needs Information

Owners do not act often.

Owners need to know:

- How much was sold today
- How many customers there are
- Who is about to run out of package

---

# Architecture

The application is split into two experiences.

## Staff Portal

Goal:

Check in as fast as possible.

Flow:

Search Customer

↓

Check-in

↓

Done

---

## Owner Portal

Goal:

Administration.

Flow:

Dashboard

↓

Customers

↓

Packages

↓

Reports

↓

Settings

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Apollo Client
- TailwindCSS
- shadcn/ui

---

## Backend

- Ruby on Rails
- GraphQL
- PostgreSQL
- Redis
- Sidekiq

---

## Storage

- Cloudflare R2

---

## Payment

- payOS

---

## Deployment

Frontend

- Cloudflare Pages (or Vercel)

Backend

- Render / Railway / VPS

Database

- PostgreSQL

---

# Repository Structure

```
/
├── backend/
├── frontend/
├── docs/
├── design/
└── scripts/
```

---

# Documentation

| File | Description |
|------|-------------|
| product.md | Product description |
| business-rules.md | Business logic |
| database.md | Database design |
| api.md | GraphQL API |
| ui-ux.md | Wireframes + UI |
| roadmap.md | Development roadmap |

---

# Development Strategy

Do not develop by module.

Develop by vertical slice.

Example:

Sprint 1

Login

↓

Customer Search

↓

Deploy

Sprint 2

Membership

↓

Check-in

Sprint 3

Payment

↓

Dashboard

---

# Definition of Done

A feature is considered complete when:

- Business rules are applied
- Database is updated
- API is complete
- Frontend is complete
- Tests exist
- Deploy succeeds

---

# Current Status

- [ ] Product
- [ ] Business Rules
- [ ] Database
- [ ] API
- [ ] UI/UX
- [ ] MVP

---

# Design Goals

A new staff member can:

- Learn to use the app in under 5 minutes
- Check in in under 5 seconds
- Use it without reading documentation

---

# Future Roadmap

After MVP is stable, develop:

- QR Check-in
- Mobile App
- Multi Branch
- Notification
- Membership Card
- Analytics
- AI Assistant

---

# License

Private Project
