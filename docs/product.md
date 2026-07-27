# 01 - Product Vision

Version: 1.0

Status: Draft

Owner: Louis Cao

---

# Sổ Khách

> Thay cuốn sổ khách bằng một cú chạm.

---

# 1. Vision

Sổ Khách là một ứng dụng giúp các spa, nail, gym và phòng khám nhỏ quản lý hội viên bằng cách thay thế hoàn toàn cuốn sổ giấy truyền thống.

Mục tiêu của sản phẩm không phải là xây dựng một CRM, ERP hay hệ thống quản trị doanh nghiệp.

Mục tiêu duy nhất là giúp nhân viên lễ tân có thể xử lý khách nhanh hơn, chính xác hơn và không còn phải ghi chép thủ công.

Nếu ngày mai một tiệm có thể vứt bỏ cuốn sổ khách thì Sổ Khách đã hoàn thành sứ mệnh.

---

# 2. Mission

Giúp các cửa hàng nhỏ chuyển đổi số bằng phần mềm đơn giản nhất có thể.

Một nhân viên mới có thể học sử dụng trong vòng 30 giây.

Một chủ tiệm không cần đọc hướng dẫn vẫn có thể sử dụng được.

---

# 3. Problem Statement

Đa số spa nhỏ tại Việt Nam hiện quản lý khách bằng:

- sổ tay
- Excel
- Google Sheet
- ghi nhớ

Điều này tạo ra rất nhiều vấn đề.

## Không biết khách còn bao nhiêu buổi

Ví dụ

Lan

Massage VIP

10 buổi

...

Không ai nhớ đã sử dụng bao nhiêu.

Nhân viên phải lật sổ.

Đếm.

Dễ sai.

---

## Quên nhắc gia hạn

Khách chỉ còn

1 buổi.

Nhân viên không nhớ.

Khách đi về.

Không quay lại.

---

## Tranh cãi

Khách nói:

> Em còn 3 buổi.

Nhân viên nói:

> Chị chỉ còn 2.

Không có lịch sử rõ ràng.

---

## Không biết hôm nay thu bao nhiêu

Cuối ngày.

Chủ tiệm phải cộng tiền bằng tay.

---

## Không kiểm soát được nhân viên

Nhân viên ghi thiếu.

Quên ghi.

Ghi nhầm.

Không ai biết.

---

# 4. Product Philosophy

Sổ Khách được xây dựng dựa trên 5 nguyên tắc.

---

## Principle 1

### Speed over Features

Nhanh quan trọng hơn nhiều tính năng.

Nếu phải chọn giữa

- thêm tính năng

hoặc

- giảm 2 lần click

thì luôn giảm click.

---

## Principle 2

### One Screen One Job

Mỗi màn hình chỉ giải quyết một việc.

Ví dụ

Dashboard

↓

chỉ xem tình hình.

Không tạo khách.

Không check-in.

Không thanh toán.

---

Check-in

↓

chỉ check-in.

Không chỉnh sửa gói.

Không xem báo cáo.

---

## Principle 3

### Everything starts from Check-in

Toàn bộ hệ thống xoay quanh thao tác Check-in.

Đây là thao tác được sử dụng nhiều nhất.

Mọi quyết định UX đều phải tối ưu cho màn hình này.

---

## Principle 4

### No Training Required

Một nhân viên mới.

Lần đầu nhìn thấy app.

Có thể tự sử dụng.

Không cần đọc hướng dẫn.

---

## Principle 5

### Replace Paper

Nếu một tính năng không giúp thay thế cuốn sổ giấy thì không nên đưa vào MVP.

---

# 5. Target Customers

## Primary

Spa nhỏ

3–10 nhân viên.

50–500 khách.

---

Nail

2–10 nhân viên.

---

Gym mini

50–300 hội viên.

---

Massage

---

Clinic nhỏ

---

# 6. Customers We Do NOT Target

Trong giai đoạn đầu.

Sổ Khách KHÔNG hướng tới:

- Chuỗi spa lớn
- Hệ thống hàng chục chi nhánh
- Bệnh viện
- CRM doanh nghiệp
- ERP
- POS chuyên nghiệp

Đây là những thị trường hoàn toàn khác.

---

# 7. Product Positioning

Không phải

CRM

Không phải

ERP

Không phải

POS

Không phải

Booking System

Mà là

Digital Membership Notebook.

Một cuốn sổ khách điện tử.

---

# 8. Core Value Proposition

Nhân viên chỉ cần:

Tìm khách

↓

Check-in

↓

Done.

Toàn bộ phần còn lại do hệ thống xử lý.

- trừ buổi
- kiểm tra hết hạn
- tạo lịch sử
- nhắc gia hạn
- thống kê

---

# 9. Success Metrics

## Người dùng

Một nhân viên mới.

Có thể check-in thành công.

Trong vòng

30 giây.

---

## Hiệu suất

Một lần check-in.

Không quá

5 giây.

---

## MVP

Một chủ tiệm.

Có thể bỏ hoàn toàn sổ giấy.

Sau 1 tuần.

---

## Business

Trong 90 ngày.

Có ít nhất

5 cửa hàng trả phí.

---

# 10. Product Principles

Khi có yêu cầu tính năng mới.

Luôn hỏi.

"Nó có giúp khách check-in nhanh hơn không?"

Nếu

Có

→ xem xét.

Nếu

Không

→ đưa vào backlog.

---

# 11. Product Scope

## MVP

- Đăng nhập
- Dashboard
- Khách hàng
- Gói dịch vụ
- Hội viên
- Check-in
- Gia hạn
- Thanh toán
- Lịch sử
- Cài đặt

---

## Phase 2

- Zalo Notification
- Dashboard nâng cao
- Báo cáo
- Export Excel

---

## Phase 3

- Import Excel
- API
- Multi Shop
- Audit Log
- Phân quyền nâng cao

---

## Future

- Booking
- AI
- Loyalty
- Voucher
- Membership Card
- QR Check-in
- Mobile App

---

# 12. Things We Will Never Build

Đây là danh sách "Anti Goals".

Ít nhất trong 2 năm đầu.

Không làm.

- Chat
- CRM Marketing
- Email Marketing
- SMS Marketing
- Facebook Ads
- Kế toán
- Quản lý kho
- Quản lý nhân sự
- POS bán lẻ
- ERP

Nếu có nhu cầu.

Sẽ tích hợp.

Không tự xây.

---

# 13. Product Culture

Khi phải lựa chọn.

Đơn giản luôn thắng.

Nhanh luôn thắng.

Ít nút bấm luôn thắng.

Một thao tác luôn thắng ba thao tác.

---

# 14. Vision 3 Years

Trong vòng 3 năm.

Sổ Khách hướng tới trở thành ứng dụng quản lý hội viên đơn giản nhất Việt Nam.

Không phải ứng dụng nhiều tính năng nhất.

Không phải ứng dụng đẹp nhất.

Mà là ứng dụng mà một chủ tiệm có thể mở lên và sử dụng ngay lập tức.

Nếu một nhân viên mới mất hơn 30 giây để học cách dùng.

Chúng ta đã thất bại.