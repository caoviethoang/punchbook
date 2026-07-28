# 05 - Information Architecture

Product: PunchBook

Version: 2.0

Status: Draft

Owner: Louis Cao

Related Documents

- 03-user-personas.md
- 04-user-journeys.md
- 06-wireframes.md

---

# 1. Purpose

This document defines the information architecture of the entire product.

Goals of Information Architecture (IA):

- Define system modules.
- Define relationships between screens.
- Define navigation.
- Reduce screen transitions.
- Give everyone a unified architecture view before UI design.

IA does not describe the interface.

IA only describes how information is organized.

---

# 2. Design Principles

PunchBook is split into two logical applications.

## Front Desk

For Staff.

Focused on:

- speed
- few actions
- minimal menu

---

## Back Office

For Owner.

Focused on:

- administration
- reports
- configuration

Both applications share one database but have different navigation.

---

# 3. Application Map

```

PunchBook

├── Owner Portal

└── Staff Portal

```

---

# 4. Owner Portal

```

Dashboard

│

├── Customers

│ ├── Customer List

│ ├── Customer Detail

│ └── Membership History

│

├── Packages

│ ├── Package List

│ ├── Create Package

│ └── Edit Package

│

├── Payments

│ ├── Payment History

│ └── Payment Detail

│

├── Reports

│

├── Staff

│

└── Settings

```

---

# 5. Staff Portal

```

Check-in Home

│

├── Search

│

├── Customer Summary

│

├── Renew Membership

│

└── Payment

```

No Dashboard.

No Report.

No Sidebar.

---

# 6. Navigation Principles

## Owner

Left sidebar.

Desktop-first.

---

## Staff

Single screen.

No Sidebar.

All actions happen in one flow.

---

# 7. Screen Hierarchy

## Owner

Dashboard

↓

Customer List

↓

Customer Detail

↓

Membership History

---

Packages

↓

Package Detail

---

Reports

---

Settings

---

## Staff

Search

↓

Customer

↓

Check-in

↓

Success

---

Search

↓

Customer

↓

Renew

↓

Payment

↓

Success

---

# 8. Search Strategy

Search is the center of the Staff Portal.

Supports:

- Name
- Phone number

In the future:

- QR
- Membership ID

---

# 9. Information Density

## Dashboard

High density.

Lots of information.

Few actions.

---

## Check-in

Low density.

Little information.

One action.

---

# 10. Object Relationships

Shop

↓

Customer

↓

Membership

↓

Package

↓

Check-in

↓

Payment

Information is organized by customer journey, not by database tables.

Example:

On Customer Detail you can view:

- Current package
- Check-in history
- Payment history

Users do not need to know Membership or Payment tables exist.

---

# 11. Navigation Rules

No more than 3 screen levels deep.

Example:

Dashboard

↓

Customer List

↓

Customer Detail

This is the maximum depth.

---

# 12. Future Expansion

Architecture must support:

- Multiple Branch
- Mobile App
- Tablet Mode
- QR Check-in
- Public API

Without changing core navigation.

---

# 13. Out of Scope

Not designed separately:

- POS
- CRM
- Booking
- Inventory

---

# 14. References

04-user-journeys.md

06-wireframes.md

08-business-rules.md
