# 04 - User Journeys

Product: PunchBook

Version: 2.0

Status: Draft

Owner: Louis Cao

Related Documents

- 02-prd.md
- 03-user-personas.md
- 05-information-architecture.md
- 06-wireframes.md

---

# 1. Purpose

This document describes the full user journey when using the product.

Unlike a menu diagram.

User Journey answers:

"How does each user type complete their work?"

Every UI design must serve these journeys.

---

# 2. Design Philosophy

PunchBook is NOT designed by feature.

It is designed by job to be done.

There are two main flows.

## Front Desk

For Staff.

Optimized for speed.

## Back Office

For Owner.

Optimized for management.

The two experiences are almost independent.

---

# 3. Journey Overview

```

Owner

```
Dashboard

↓

Customers

↓

Packages

↓

Reports

↓

Settings

```

---

Staff

```
Check-in Home

↓

Search

↓

Check-in

↓

Renew

↓

Payment

↓

Done

```

---

# 4. Owner Journey

## Morning Routine

Owner opens the app.

↓

Dashboard.

↓

View

- Today's revenue.
- Customers about to expire.
- Customers who checked in.
- Recent transactions.

↓

If no issues.

↓

Close the app.

Target time:

< 60 seconds.

---

## Create Package

Dashboard

↓

Packages

↓

Create Package

↓

Save

↓

Done

---

## Create Staff

Settings

↓

Staff

↓

Invite

↓

Done

---

## Review Customer

Dashboard

↓

Customer

↓

Customer Detail

↓

Membership History

↓

Done

---

# 5. Staff Journey

This is the most important journey in the entire product.

All UX optimization must prioritize this journey.

---

## Normal Check-in

Staff opens the app.

↓

Search box shown immediately.

↓

Enter name or phone number.

↓

Customer displayed.

↓

Tap Check-in.

↓

Show

"Checked in"

↓

Done.

Target

- < 5 seconds
- ≤ 3 clicks

---

## Customer Not Found

Search

↓

Not found.

↓

Create Customer.

↓

Assign Package.

↓

Payment.

↓

Check-in.

↓

Done.

---

## Membership Expired

Search.

↓

Check-in.

↓

Membership expired.

↓

Show Renew button.

↓

Select package.

↓

Payment.

↓

Membership Active.

↓

Check-in.

↓

Done.

---

## Customer Without Package

Search.

↓

Customer has no package.

↓

Show

"Buy package"

↓

Payment

↓

Membership

↓

Check-in

↓

Done

---

# 6. Exceptional Journeys

## Double Click

Staff taps Check-in twice.

↓

System creates only one Check-in.

---

## Concurrent Check-in

Two Staff check in at once.

↓

Membership is deducted only once.

---

## Payment Failed

Renew.

↓

payOS fails.

↓

Membership is not activated.

↓

Allow retry.

---

## Internet Lost

Check-in.

↓

Network lost.

↓

Show Retry.

↓

Do not deduct sessions twice.

---

# 7. Cross Journey Rules

Owner does not need to see the Check-in screen.

Staff do not need to see the Dashboard.

The two interfaces must be optimized separately.

---

# 8. UX Targets

## Owner

Open Dashboard.

↓

Understand status.

↓

Close.

< 60 seconds.

---

## Staff

Check-in.

↓

Done.

< 5 seconds.

---

# 9. Journey Metrics

Measure the following.

- Search Time
- Check-in Time
- Payment Time
- Renewal Rate
- Failed Check-in
- Payment Success Rate

---

# 10. Future Journeys

QR Check-in.

Offline Check-in.

Self Check-in.

Mobile App.

Multiple Branch.

---

# 11. References

03-user-personas.md

05-information-architecture.md

06-wireframes.md

08-business-rules.md
