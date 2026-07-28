# 06 - Wireframes

Product: PunchBook

Version: 2.0

Status: Draft

Owner: Louis Cao

Related Documents

- 04-user-journeys.md
- 05-information-architecture.md
- 07-business-rules.md

---

# 1. Purpose

This document describes each screen structure at low fidelity.

Wireframes do NOT describe color.

Do NOT describe typography.

Do NOT describe icons.

They only describe:

- layout
- information order
- actions
- screen flow

This is input for creating Figma designs.

---

# 2. UX Philosophy

There are two independent experiences.

## Staff Portal

One Screen.

One Task.

Fast.

---

## Owner Portal

Information First.

---

# =========================================

# STAFF PORTAL

# =========================================

# 3. Check-in Home

This is the most important screen in the entire product.

95% of actions happen here.

```
+------------------------------------------------------+

                 🔍 Search Customer

        ___________________________

        Lan Nguyen

-------------------------------------------------------

Recent Customers

✔ Lan

✔ Minh

✔ Hoa

-------------------------------------------------------

Today's Check-ins

Lan

Mai

...

+------------------------------------------------------+
```

## Components

- Search Box
- Recent Customers
- Today's Check-ins

---

## Primary Action

Search Customer

---

## Secondary Action

Open Recent Customer

---

## Navigation

Search

↓

Customer Summary

---

# 4. Search Result

```
+--------------------------------------+

Lan Nguyen

090xxxxxxx

Massage VIP

3 sessions left

Expires 20/09/2026

----------------------------------------

        [ CHECK-IN ]

----------------------------------------

History

```

## Components

Customer Summary Card

Membership Card

Check-in Button

History Preview

---

## Actions

Check-in

Renew

Open Detail

---

# 5. Check-in Success

```
+--------------------------------------+

          ✔

Checked in

--------------------------------------

Lan Nguyen

Massage VIP

Remaining

2 sessions

--------------------------------------

[ Done ]

```

Display for about 2 seconds then return to Search automatically.

---

# 6. Membership Expired

```
+--------------------------------------+

⚠ Membership expired

--------------------------------------

Lan Nguyen

Massage VIP

--------------------------------------

[ Renew ]

```

---

# 7. Renew Membership

```
+--------------------------------------+

Select package

( ) 10 sessions

( ) 20 sessions

( ) Unlimited

--------------------------------------

Amount

500,000

--------------------------------------

[ Pay ]

```

---

# 8. Payment Success

```
✔

Payment successful

Membership Active

Check-in successful

```

After 2 seconds.

↓

Return to Search.

---

# =========================================

# OWNER PORTAL

# =========================================

# 9. Dashboard

```
+--------------------------------------------------------+

Revenue Today

12,500,000

----------------------------------------

Today's Check-ins

82

----------------------------------------

Expiring Membership

12

----------------------------------------

Recent Payments

```

No large buttons.

Dashboard is view-only.

---

# 10. Customer List

```
Search

------------------------------------

Lan

Mai

Hoa

...

```

Click

↓

Customer Detail.

---

# 11. Customer Detail

```
Lan Nguyen

------------------------------------

Current Membership

Massage VIP

Remaining

3

Expire

20/09/2026

------------------------------------

Check-in History

------------------------------------

Payment History

```

---

# 12. Package List

```
Massage VIP

10 Sessions

500,000

------------------------------------

Gym

Unlimited

```

---

# 13. Reports

```
Revenue

Membership Sales

Top Customers

Check-ins

```

Filter only.

No CRUD.

---

# 14. Settings

```
Shop

Staff

Payment

Notification

```

---

# 15. Responsive Rules

Desktop

Sidebar

+

Content

---

Tablet

Sidebar Collapse

---

Mobile

Not supported in MVP.

---

# 16. Interaction Rules

Search always autofocus.

Enter = Search.

ESC = Clear.

After Check-in.

Return to Search.

After Payment.

Return to Search.

Do not open Dashboard.

---

# 17. Empty States

Customer

No customers.

↓

Show

"Create customer"

---

Package

No packages.

↓

"Create package"

---

History

Empty.

↓

"No data yet"

---

# 18. Loading States

Skeleton for:

- Dashboard
- Customer
- Payment

Spinner only on submit.

---

# 19. Error States

Network Error

↓

Retry

---

Payment Failed

↓

Retry

---

Customer Not Found

↓

Create Customer

---

# 20. Future Wireframes

QR Check-in

Offline Check-in

Tablet Mode

Self Check-in

---

# 21. References

05-information-architecture.md

07-business-rules.md

10-ui-components.md
