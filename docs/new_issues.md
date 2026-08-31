# PunchBook — Danh sách các Issue bổ sung (New Issues)

Tài liệu này chứa thông tin mô tả chi tiết, tiêu đề, nhãn (labels) và tiêu chuẩn nghiệm thu (Acceptance Criteria) cho **8 issue nhỏ** được chia thành **3 nhóm tính năng**.

---

## 🟢 Nhóm 1: Staff UX & Màn Check-in siêu tốc

### Issue #1: `[Feature] Tìm kiếm hội viên linh hoạt theo Tên hoặc Số điện thoại`
- **Labels**: `frontend`, `backend`, `enhancement`, `staff-ux`
- **Mô tả**: Nâng cấp ô tìm kiếm tại màn hình Check-in để hỗ trợ tìm kiếm cả theo tên và số điện thoại (hoặc những chữ số cuối của SĐT).
- **Acceptance Criteria**:
  - [ ] Nhập chữ số (ví dụ: `090` hoặc `888`) -> Kết quả tự động lọc các hội viên có SĐT chứa chuỗi số đó.
  - [ ] Nhập chữ (ví dụ: `Lan`) -> Kết quả lọc các hội viên có tên chứa từ khóa.
  - [ ] Giữ nguyên debounce 300ms để tối ưu hiệu năng API search.

---

### Issue #2: `[Feature] Bổ sung Phím tắt & Toast Notification cho Màn Check-in`
- **Labels**: `frontend`, `enhancement`, `staff-ux`
- **Mô tả**: Giúp nhân viên check-in nhanh hơn mà không cần dùng chuột, đồng thời có phản hồi thị giác rõ ràng khi check-in thành công.
- **Acceptance Criteria**:
  - [ ] Khi nhập ô tìm kiếm và ấn `Enter`: Tự động chọn kết quả hội viên đầu tiên.
  - [ ] Ấn phím `Esc`: Tự động xóa nội dung tìm kiếm và reset về trạng thái ban đầu.
  - [ ] Hiển thị thông báo dạng Toast (màu xanh lá) góc trên màn hình khi check-in thành công: `"Đã check-in thành công cho [Tên hội viên]"`.

---

### Issue #3: `[Feature] Quét mã QR Hội viên để Check-in siêu tốc`
- **Labels**: `frontend`, `feature`, `staff-ux`
- **Mô tả**: Mỗi hội viên có 1 mã QR đại diện cho `membership_id`. Nhân viên có thể dùng máy quét QR cầm tay hoặc camera thiết bị để check-in tức thì.
- **Acceptance Criteria**:
  - [ ] Thêm icon/nút "Quét mã QR" cạnh thanh tìm kiếm Check-in.
  - [ ] Mở modal webcam/camera hỗ trợ đọc mã QR chứa thông tin hội viên.
  - [ ] Khi quét mã hợp lệ: Tự động tự động kích hoạt lệnh Check-in cho hội viên tương ứng mà không cần gõ tên.

---

## 🟡 Nhóm 2: Owner Portal & Quản lý dữ liệu

### Issue #4: `[Feature] Import danh sách hội viên & gói từ file Excel/CSV`
- **Labels**: `backend`, `frontend`, `feature`, `paid`
- **Mô tả**: Hỗ trợ cửa hàng mới dễ dàng chuyển đổi dữ liệu từ sổ sách/Excel cũ sang PunchBook.
- **Acceptance Criteria**:
  - [ ] Cho phép tải về file Excel mẫu (`template_import_memberships.xlsx`).
  - [ ] Cung cấp nút "Import Excel" tại danh sách Hội viên.
  - [ ] Validate dữ liệu đầu vào (Tên hội viên, SĐT, Gói cước, Số buổi còn lại/Ngày hết hạn).
  - [ ] Trả về báo cáo kết quả chi tiết: số dòng import thành công, các dòng bị lỗi dữ liệu (nếu có).

---

### Issue #5: `[Feature] Xem Lịch sử Check-in & Thanh toán trong Chi tiết Hội viên`
- **Labels**: `frontend`, `backend`, `feature`
- **Mô tả**: Giúp chủ tiệm kiểm tra minh bạch toàn bộ nhật ký sử dụng dịch vụ và lịch sử gia hạn hóa đơn của từng hội viên.
- **Acceptance Criteria**:
  - [ ] Khi nhấp vào 1 hội viên tại danh sách, hiển thị Modal / Drawer chi tiết.
  - [ ] Tab 1: **Lịch sử Check-in** (Thời gian check-in, Tên nhân viên thực hiện).
  - [ ] Tab 2: **Lịch sử Thanh toán** (Mã hóa đơn, Ngày thanh toán, Số tiền, Mã giao dịch PayOS).

---

### Issue #6: `[Feature] Trang Cài đặt Tiệm & Đổi mật khẩu tài khoản`
- **Labels**: `frontend`, `backend`, `feature`
- **Mô tả**: Trang Settings giúp chủ tiệm tự quản lý thông tin cửa hàng và đổi mật khẩu đăng nhập an toàn.
- **Acceptance Criteria**:
  - [ ] Cập nhật thông tin Tiệm: Tên tiệm, Số điện thoại liên hệ, Địa chỉ.
  - [ ] Đổi mật khẩu tài khoản Devise (yêu cầu Mật khẩu cũ, Mật khẩu mới, Xác nhận mật khẩu).
  - [ ] Hiển thị thông tin gói cước hiện tại của tiệm (`Free` hoặc `Paid`) cùng ngày hết hạn gói.

---

## 🔵 Nhóm 3: Hiệu năng, Bộ lọc & Audit Logs

### Issue #7: `[Optimization] Server-side Pagination & Bộ lọc Trạng thái Hội viên`
- **Labels**: `backend`, `frontend`, `performance`
- **Mô tả**: Tối ưu hiệu năng khi cửa hàng có hàng nghìn hội viên và hỗ trợ lọc nhanh danh sách.
- **Acceptance Criteria**:
  - [ ] API GET `/memberships` hỗ trợ phân trang `page` & `per_page` (mặc định 20 dòng/trang).
  - [ ] Bổ sung bộ lọc Trạng thái: `Tất cả` | `Đang hoạt động` | `Sắp hết hạn (<= 3 buổi / 7 ngày)` | `Đã hết hạn`.
  - [ ] Đảm bảo query sử dụng index, không bị chậm khi dữ liệu lớn.

---

### Issue #8: `[Security/Audit] Nhật ký thao tác nhân viên (Audit Logs)`
- **Labels**: `backend`, `security`, `audit`
- **Mô tả**: Ghi vết các hành động quan trọng (Check-in, Thêm/sửa hội viên, Đổi gói) gắn với tài khoản nhân viên đang đăng nhập.
- **Acceptance Criteria**:
  - [ ] Tạo bảng `audit_logs` (shop_id, staff_id, action, target_type, target_id, details, created_at).
  - [ ] Tự động ghi log khi thực hiện Check-in hoặc Gia hạn hội viên.
  - [ ] Trang Admin/Owner có thể xem danh sách vết thao tác theo mốc thời gian.
