# 04 - User Journeys

Product: Sổ Khách

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

Tài liệu này mô tả toàn bộ hành trình của người dùng khi sử dụng sản phẩm.

Khác với sơ đồ menu.

User Journey trả lời câu hỏi:

"Từng loại người dùng sẽ hoàn thành công việc như thế nào?"

Mọi thiết kế UI đều phải phục vụ các Journey này.

---

# 2. Design Philosophy

Sổ Khách KHÔNG được thiết kế theo chức năng.

Mà được thiết kế theo công việc (Job To Be Done).

Có hai luồng chính.

## Front Desk

Dành cho Staff.

Tối ưu tốc độ.

## Back Office

Dành cho Owner.

Tối ưu quản lý.

Hai trải nghiệm gần như độc lập.

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

Owner mở ứng dụng.

↓

Dashboard.

↓

Xem

- Doanh thu hôm nay.
- Khách sắp hết hạn.
- Khách đã check-in.
- Giao dịch gần đây.

↓

Nếu không có vấn đề.

↓

Đóng ứng dụng.

Thời gian mong muốn:

< 60 giây.

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

Đây là Journey quan trọng nhất của toàn bộ sản phẩm.

Mọi tối ưu UX đều phải ưu tiên Journey này.

---

## Normal Check-in

Staff mở ứng dụng.

↓

Hiển thị ngay ô tìm kiếm.

↓

Nhập tên hoặc số điện thoại.

↓

Hiển thị khách.

↓

Bấm Check-in.

↓

Hiển thị

"Đã check-in"

↓

Done.

Target

- < 5 giây
- ≤ 3 click

---

## Customer Not Found

Search

↓

Không tìm thấy.

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

Membership hết hạn.

↓

Hiển thị nút Gia hạn.

↓

Chọn gói.

↓

Thanh toán.

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

Khách chưa có gói.

↓

Hiển thị

"Mua gói"

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

Staff bấm Check-in hai lần.

↓

Hệ thống chỉ tạo một Check-in.

---

## Concurrent Check-in

Hai Staff cùng check-in.

↓

Membership chỉ bị trừ một lần.

---

## Payment Failed

Gia hạn.

↓

payOS thất bại.

↓

Membership không được kích hoạt.

↓

Cho phép thử lại.

---

## Internet Lost

Check-in.

↓

Mất mạng.

↓

Hiển thị Retry.

↓

Không trừ buổi hai lần.

---

# 7. Cross Journey Rules

Owner không cần nhìn thấy màn Check-in.

Staff không cần nhìn thấy Dashboard.

Hai giao diện phải được tối ưu riêng.

---

# 8. UX Targets

## Owner

Mở Dashboard.

↓

Biết tình hình.

↓

Đóng.

< 60 giây.

---

## Staff

Check-in.

↓

Done.

< 5 giây.

---

# 9. Journey Metrics

Đo các chỉ số sau.

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