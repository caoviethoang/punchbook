# 06 - Wireframes

Product: Sổ Khách

Version: 2.0

Status: Draft

Owner: Louis Cao

Related Documents

- 04-user-journeys.md
- 05-information-architecture.md
- 07-business-rules.md

---

# 1. Purpose

Tài liệu này mô tả cấu trúc của từng màn hình ở mức Low Fidelity.

Wireframe KHÔNG mô tả màu sắc.

KHÔNG mô tả typography.

KHÔNG mô tả icon.

Chỉ mô tả:

- bố cục
- thứ tự thông tin
- hành động
- luồng chuyển màn hình

Đây là tài liệu đầu vào để tạo Figma.

---

# 2. UX Philosophy

Có hai trải nghiệm độc lập.

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

Đây là màn hình quan trọng nhất của toàn bộ sản phẩm.

95% thao tác xảy ra tại đây.

```
+------------------------------------------------------+

                 🔍 Search Customer

        ___________________________

        Lan Nguyễn

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

Lan Nguyễn

090xxxxxxx

Massage VIP

Còn 3 buổi

Hết hạn 20/09/2026

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

Đã Check-in

--------------------------------------

Lan Nguyễn

Massage VIP

Còn

2 buổi

--------------------------------------

[ Done ]

```

Hiển thị khoảng 2 giây rồi tự quay về Search.

---

# 6. Membership Expired

```
+--------------------------------------+

⚠ Membership hết hạn

--------------------------------------

Lan Nguyễn

Massage VIP

--------------------------------------

[ Gia hạn ]

```

---

# 7. Renew Membership

```
+--------------------------------------+

Chọn gói

( ) 10 buổi

( ) 20 buổi

( ) Unlimited

--------------------------------------

Tiền

500.000

--------------------------------------

[ Thanh toán ]

```

---

# 8. Payment Success

```
✔

Thanh toán thành công

Membership Active

Check-in thành công

```

Sau 2 giây.

↓

Quay lại Search.

---

# =========================================

# OWNER PORTAL

# =========================================

# 9. Dashboard

```
+--------------------------------------------------------+

Revenue Today

12.500.000

----------------------------------------

Today's Check-ins

82

----------------------------------------

Expiring Membership

12

----------------------------------------

Recent Payments

```

Không có nút lớn.

Dashboard chỉ để xem.

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
Lan Nguyễn

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

10 Buổi

500.000

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

Chỉ có Filter.

Không có CRUD.

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

Không hỗ trợ ở MVP.

---

# 16. Interaction Rules

Search luôn autofocus.

Enter = Search.

ESC = Clear.

Sau Check-in.

Quay về Search.

Sau Payment.

Quay về Search.

Không mở Dashboard.

---

# 17. Empty States

Customer

Không có khách.

↓

Hiển thị

"Tạo khách mới"

---

Package

Không có gói.

↓

"Tạo gói"

---

History

Không có.

↓

"Chưa có dữ liệu"

---

# 18. Loading States

Skeleton cho:

- Dashboard
- Customer
- Payment

Spinner chỉ dùng khi submit.

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