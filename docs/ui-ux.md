# 05 - Information Architecture

Product: Sổ Khách

Version: 2.0

Status: Draft

Owner: Louis Cao

Related Documents

- 03-user-personas.md
- 04-user-journeys.md
- 06-wireframes.md

---

# 1. Purpose

Tài liệu này định nghĩa cấu trúc thông tin của toàn bộ sản phẩm.

Mục tiêu của Information Architecture (IA) là:

- Xác định các module của hệ thống.
- Xác định mối quan hệ giữa các màn hình.
- Định nghĩa navigation.
- Giảm số lần chuyển màn hình.
- Giúp mọi người cùng nhìn thấy một kiến trúc thống nhất trước khi thiết kế UI.

IA không mô tả giao diện.

IA chỉ mô tả cách tổ chức thông tin.

---

# 2. Design Principles

Sổ Khách được chia thành hai ứng dụng logic.

## Front Desk

Dành cho Staff.

Tập trung vào:

- tốc độ
- ít thao tác
- ít menu

---

## Back Office

Dành cho Owner.

Tập trung vào:

- quản trị
- báo cáo
- cấu hình

Hai ứng dụng sử dụng chung database nhưng có navigation khác nhau.

---

# 3. Application Map

```

Sổ Khách

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

Không có Dashboard.

Không có Report.

Không có Sidebar.

---

# 6. Navigation Principles

## Owner

Sidebar bên trái.

Desktop-first.

---

## Staff

Một màn hình duy nhất.

Không dùng Sidebar.

Toàn bộ thao tác diễn ra trong một flow.

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

Search là trung tâm của Staff Portal.

Hỗ trợ:

- Tên
- Số điện thoại

Trong tương lai:

- QR
- Membership ID

---

# 9. Information Density

## Dashboard

Mật độ cao.

Nhiều thông tin.

Ít thao tác.

---

## Check-in

Mật độ thấp.

Ít thông tin.

Một hành động.

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

Thông tin được tổ chức theo hành trình của khách hàng, không phải theo bảng dữ liệu.

Ví dụ:

Tại màn Customer Detail có thể xem:

- Gói hiện tại
- Lịch sử check-in
- Lịch sử thanh toán

Người dùng không cần biết các bảng Membership hay Payment tồn tại.

---

# 11. Navigation Rules

Không quá 3 cấp màn hình.

Ví dụ:

Dashboard

↓

Customer List

↓

Customer Detail

Đây là độ sâu tối đa.

---

# 12. Future Expansion

Kiến trúc phải hỗ trợ:

- Multiple Branch
- Mobile App
- Tablet Mode
- QR Check-in
- API Public

Mà không cần thay đổi navigation chính.

---

# 13. Out of Scope

Không thiết kế riêng:

- POS
- CRM
- Booking
- Inventory

---

# 14. References

04-user-journeys.md

06-wireframes.md

08-business-rules.md