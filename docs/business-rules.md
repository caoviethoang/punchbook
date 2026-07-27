# Product Requirements Document (PRD)

Product: Sổ Khách

Document Version: 1.0

Status: Draft

Author: Louis Cao

Last Updated: 2026-07-27

---

# 1. Purpose

Tài liệu này mô tả đầy đủ yêu cầu chức năng của sản phẩm Sổ Khách.

Đây là tài liệu nguồn (Source of Truth) cho:

- Product
- Design
- Backend
- Frontend
- QA
- AI Coding Agent

Nếu có mâu thuẫn giữa các tài liệu khác, PRD được ưu tiên.

---

# 2. Product Summary

Sổ Khách là ứng dụng quản lý hội viên dành cho spa, nail, gym và phòng khám nhỏ.

Ứng dụng tập trung vào:

- quản lý khách
- quản lý gói
- check-in
- gia hạn
- thanh toán

Ứng dụng KHÔNG hướng tới CRM hay ERP.

---

# 3. Goals

## Business Goals

Trong 90 ngày.

- 5 khách hàng trả phí
- MRR > 300.000 VNĐ
- 80% khách pilot tiếp tục sử dụng

---

## Product Goals

- Thay thế hoàn toàn sổ giấy.
- Check-in dưới 5 giây.
- Không cần đào tạo nhân viên.

---

## User Goals

Owner:

- Biết hôm nay thu bao nhiêu.
- Biết khách nào sắp hết.
- Không phải ghi sổ.

Staff:

- Check-in nhanh.
- Không phải nhớ khách còn bao nhiêu buổi.

---

# 4. Non Goals

Không xây:

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

Có toàn quyền.

Có thể

- tạo shop
- tạo nhân viên
- tạo gói
- tạo khách
- check-in
- thanh toán
- xem dashboard
- export

---

## Staff

Có thể

- check-in
- tìm khách
- tạo khách
- gia hạn

Không được

- xoá dữ liệu
- export
- cấu hình shop

---

# 7. Product Modules

MVP bao gồm.

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

xem doanh thu hôm nay

So that

biết tình hình cửa hàng.

---

As an Owner

I want

xem khách sắp hết hạn

So that

chủ động nhắc gia hạn.

---

## Customer

As Staff

I want

tìm khách bằng tên hoặc số điện thoại

So that

check-in nhanh.

---

As Staff

I want

xem lịch sử khách

So that

không tranh cãi.

---

## Package

As Owner

I want

tạo gói

So that

bán cho khách.

---

## Membership

As Staff

I want

xem số buổi còn lại

So that

biết có thể check-in hay không.

---

## Check-in

As Staff

I want

check-in bằng một nút

So that

không phải thao tác nhiều.

---

## Payment

As Staff

I want

gia hạn ngay khi hết buổi

So that

không gián đoạn.

---

# 9. Functional Requirements

FR-001

Hệ thống phải cho phép tạo khách.

---

FR-002

Khách phải có số điện thoại duy nhất trong một shop.

---

FR-003

Hệ thống phải cho phép tìm khách.

---

FR-004

Tìm kiếm theo

- tên
- số điện thoại

---

FR-005

Check-in phải tự động

- tạo CheckIn
- trừ buổi
- cập nhật Membership

---

FR-006

Nếu hết buổi.

Không cho check-in.

---

FR-007

Nếu hết hạn.

Không cho check-in.

---

FR-008

Gia hạn phải tạo Payment.

---

FR-009

Thanh toán thành công.

Membership được kích hoạt.

---

FR-010

Mọi thao tác phải lưu Audit Log.

---

# 10. UX Principles

Mỗi màn hình chỉ có một mục tiêu.

Ví dụ

Dashboard

↓

Xem.

---

Check-in

↓

Check-in.

---

Không trộn nhiều nghiệp vụ.

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

- Chủ tiệm có smartphone.
- Có Internet.
- Nhân viên biết sử dụng trình duyệt.

---

# 13. Constraints

MVP

Web App

PWA

Không native app.

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

Logic Membership sai.

Webhook payOS gửi nhiều lần.

Network mất giữa lúc thanh toán.

Double click check-in.

Hai nhân viên check-in cùng lúc.

---

# 16. Open Questions

Có cần hỗ trợ nhiều gói cùng lúc?

Có cho phép check-in offline?

Có cần QR Membership?

Có cần import Excel ngay MVP?

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

Một spa mới.

Trong vòng

10 phút.

Có thể

- tạo shop
- tạo gói
- tạo khách
- check-in
- gia hạn

mà không cần đọc tài liệu.

---

# 19. References

01-product-vision.md

07-business-rules.md

08-database-design.md

10-api-spec.md

13-edge-cases.md