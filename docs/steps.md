# PunchBook — Docs prompt cho AI build app

Tài liệu này chứa toàn bộ ngữ cảnh sản phẩm + các prompt theo từng giai đoạn để đưa cho AI coding tool (Claude Code, Cursor...) build lần lượt. Dán nguyên phần "Ngữ cảnh dự án" vào đầu mỗi phiên làm việc mới, sau đó dùng từng prompt giai đoạn theo thứ tự.

---

## Ngữ cảnh dự án (dán vào đầu mỗi phiên AI mới)

```
Tôi đang build "PunchBook" — web app quản lý gói hội viên cho spa/nail/gym/phòng
khám nhỏ tại Việt Nam. Đối tượng dùng: chủ tiệm không rành công nghệ, đang quản
lý hội viên bằng Excel/sổ tay.

Stack: Ruby on Rails (backend + render view), React (qua Vite Ruby hoặc
react-rails) cho các màn hình tương tác, PostgreSQL, Sidekiq cho background
job, Devise cho auth, RSpec cho test.

Nguyên tắc bắt buộc:
- Mọi logic liên quan tiền bạc/số buổi phải có test tự động đi kèm, không
  merge nếu chưa có test case cho các trường hợp biên.
- Toàn bộ webhook nhận từ bên thứ 3 (payOS) phải xác thực chữ ký/signature
  trước khi xử lý, không tin dữ liệu request mù quáng.
- UI phải tối giản tối đa — người dùng cuối là nhân viên tiệm không rành
  công nghệ, thao tác chính (check-in) phải làm được trong 1-2 lần bấm.
- Không thêm thư viện/dependency ngoài phạm vi cần thiết cho từng giai đoạn.
```

---

## Data model (ERD tóm tắt)

```
Shop (tiệm)
 └─ Staff        (nhân viên, thuộc 1 shop)
 └─ Package      (gói dịch vụ: tên, số buổi/ngày, giá)
 └─ Membership   (hội viên: tên, sđt, package_id, số buổi/ngày còn lại, hạn dùng)
      └─ CheckIn (mỗi lượt đến: membership_id, staff_id, thời gian)
      └─ Invoice (công nợ/thanh toán: membership_id, số tiền, trạng thái, mã giao dịch payOS)
```

Quan hệ: Shop 1-n Staff, Shop 1-n Package, Shop 1-n Membership, Package 1-n Membership, Membership 1-n CheckIn, Staff 1-n CheckIn, Membership 1-n Invoice.

---

## Danh sách tính năng theo giai đoạn

| Giai đoạn | Tính năng |
|---|---|
| MVP (free) | Tạo gói, thêm hội viên, check-in, trừ buổi tự động, cảnh báo sắp hết hạn trên dashboard |
| Trả phí (~50-70k/tháng) | Không giới hạn hội viên, nhắc tự động qua Zalo ZBS, nhiều tài khoản nhân viên, xuất báo cáo Excel |

---

## Giai đoạn 1 — Khởi tạo project & data model

```
Khởi tạo Rails app mới tên "PunchBook" dùng PostgreSQL, kèm RSpec cho test,
Devise cho authentication.

Tạo migration + model cho các bảng sau, đúng theo association mô tả:

- Shop: name (string), phone (string), plan (string, default "free")
- Staff: shop (references), name (string), role (string)
- Package: shop (references), name (string), sessions_count (integer,
  nullable — null nghĩa là gói theo ngày không theo buổi), duration_days
  (integer, nullable), price (integer, đơn vị VNĐ)
- Membership: shop (references), package (references), customer_name
  (string), phone (string), sessions_left (integer), expires_at (date,
  nullable)
- CheckIn: membership (references), staff (references), checked_in_at
  (datetime)
- Invoice: membership (references), amount (integer), status (string,
  default "pending"), payos_transaction_id (string, nullable)

Thêm associations has_many/belongs_to đầy đủ ở từng model theo đúng ERD.
Thêm validates cơ bản: presence cho các trường bắt buộc, numericality
sessions_left >= 0.

Setup Devise cho model Shop để chủ tiệm đăng nhập được.

Sau khi xong, chạy migration và xác nhận db:schema.rb đúng như mô tả.
```

---

## Giai đoạn 2 — Logic nghiệp vụ cốt lõi + test

```
Viết service object CheckInMembership xử lý logic check-in:
- Input: membership, staff
- Nếu package tính theo buổi: kiểm tra sessions_left > 0, nếu không raise
  lỗi rõ ràng (ví dụ InsufficientSessionsError), nếu có thì trừ 1 trong
  transaction và tạo CheckIn record
- Nếu package tính theo ngày: kiểm tra expires_at >= Date.current, nếu hết
  hạn thì raise lỗi, nếu còn hạn thì chỉ tạo CheckIn record (không trừ gì)
- Toàn bộ thao tác phải nằm trong 1 database transaction để tránh race
  condition khi 2 request check-in cùng lúc cho cùng 1 membership (dùng
  pessimistic locking with_lock hoặc optimistic locking)

Viết RSpec test đầy đủ cho service này, bắt buộc cover các case:
- Check-in thành công khi còn buổi/ngày
- Check-in thất bại khi hết buổi/ngày, không được trừ âm
- Check-in đồng thời (2 thread/request cùng lúc) không được trừ sai số buổi
- Check-in cho gói theo ngày không làm thay đổi sessions_left

Không viết thêm controller/route ở bước này, chỉ tập trung service + test.
```

---

## Giai đoạn 3 — API/controller cho check-in & danh sách hội viên

```
Tạo controller MembershipsController và endpoint:
- GET /memberships?query=... — tìm kiếm hội viên theo tên (dùng cho màn
  hình check-in), chỉ trả về hội viên thuộc shop đang đăng nhập
- POST /memberships/:id/check_in — gọi CheckInMembership, trả về JSON
  gồm trạng thái mới của membership (sessions_left hoặc expires_at) hoặc
  lỗi rõ ràng nếu thất bại

Đảm bảo cả 2 endpoint đều scope theo current_shop (Devise), không cho phép
shop A thao tác lên dữ liệu của shop B (viết test kiểm tra riêng cho việc
này — đây là lỗ hổng bảo mật phổ biến nhất trong app đa tenant).

Viết request spec (RSpec) cho cả 2 endpoint, bao gồm case cố tình gọi API
với membership_id thuộc shop khác để xác nhận bị chặn (403 hoặc 404).
```

---

## Giai đoạn 4 — Giao diện check-in (React)

```
Setup Vite Ruby (hoặc react-rails nếu đã quen hơn) để nhúng React vào
trang check-in.

Build component CheckInScreen với:
- Ô tìm kiếm hội viên theo tên, debounce 300ms, gọi API GET /memberships
- Danh sách kết quả hiển thị tên, tên gói, số buổi/ngày còn lại
- Nút "Check-in" cho từng hội viên — disable nếu đã hết buổi/hạn, hiển thị
  "Đã hết" thay vì cho bấm
- Khi bấm check-in: gọi POST /memberships/:id/check_in, cập nhật ngay số
  buổi còn lại trên UI (optimistic update), rollback nếu API báo lỗi và
  hiển thị thông báo lỗi rõ ràng

Ưu tiên UI tối giản, chữ to, thao tác rõ ràng — người dùng là nhân viên
tiệm không rành công nghệ. Không cần responsive phức tạp, chỉ cần chạy tốt
trên tablet/laptop cỡ màn hình 10-15 inch.
```

---

## Giai đoạn 5 — Dashboard cho chủ tiệm

```
Build trang dashboard (React hoặc Rails view tuỳ bạn quyết định ở bước
trước) hiển thị:
- 3 số liệu: doanh thu tháng hiện tại (tổng amount của Invoice status=paid
  trong tháng), số membership đang active, số membership sắp hết hạn
  trong 7 ngày tới
- Bảng danh sách hội viên: tên, gói, số buổi/ngày còn lại, trạng thái
  (còn hạn / sắp hết / đã hết — tính dựa trên sessions_left hoặc
  expires_at)

Viết endpoint GET /dashboard trả về đủ dữ liệu trên trong 1 response,
tránh N+1 query (dùng includes/eager load cho Package trong Membership).
```

---

## Giai đoạn 6 — Tạo gói dịch vụ & thêm hội viên

```
Build màn hình + endpoint cho phép chủ tiệm:
- Tạo gói dịch vụ mới (PackagesController#create): tên, số buổi hoặc số
  ngày, giá
- Thêm hội viên mới (MembershipsController#create): tên, sđt, chọn gói có
  sẵn — khi tạo thì sessions_left = package.sessions_count hoặc
  expires_at = Date.current + package.duration_days

Thêm validation: nếu shop đang ở plan "free" thì không cho tạo hội viên
thứ 16 trở đi (raise lỗi rõ ràng, gợi ý nâng cấp gói trả phí).
```

---

## Giai đoạn 7 — Tích hợp payOS (thanh toán)

```
Tích hợp payOS để tạo link thanh toán QR khi hội viên cần gia hạn:
- Endpoint POST /memberships/:id/invoices — tạo Invoice status=pending,
  gọi payOS API tạo payment link, trả về QR code URL cho frontend hiển thị
- Endpoint POST /webhooks/payos — nhận webhook xác nhận thanh toán từ
  payOS. QUAN TRỌNG: phải xác thực chữ ký webhook theo tài liệu chính thức
  của payOS trước khi xử lý, từ chối request không hợp lệ. Sau khi xác
  thực thành công: cập nhật Invoice status=paid, cập nhật lại
  sessions_left/expires_at của Membership tương ứng theo gói đã mua

Viết test riêng cho việc xác thực webhook: request có chữ ký hợp lệ được
xử lý, request có chữ ký sai hoặc thiếu bị từ chối và không tạo thay đổi
gì trong DB.

Đọc kỹ tài liệu payOS thực tế (https://payos.vn) trước khi code phần này —
không tự suy đoán tên field hoặc cấu trúc webhook.
```

---

## Giai đoạn 8 — Nhắc tự động qua Zalo (chỉ áp dụng plan trả phí)

```
Viết Sidekiq job chạy hàng ngày (schedule qua sidekiq-cron hoặc whenever):
- Quét toàn bộ Membership thuộc shop có plan="paid", có sessions_left <= 3
  hoặc expires_at trong vòng 7 ngày tới
- Với mỗi membership tìm được, gọi Zalo ZBS API gửi tin nhắc kèm link
  thanh toán (tái sử dụng endpoint tạo invoice ở giai đoạn 7)
- Log lại việc đã gửi để tránh gửi trùng nhiều lần trong cùng 1 ngày cho
  cùng 1 hội viên

Đọc kỹ tài liệu Zalo ZBS thực tế trước khi code — API này ít phổ biến,
không tự suy đoán cấu trúc request.
```

---

## Giai đoạn 9 — PWA

```
Thêm manifest.json và service worker cơ bản để app có thể "cài đặt" như
app desktop từ trình duyệt Chrome/Edge. Cache các asset tĩnh (JS/CSS) để
tải nhanh hơn ở lần mở sau, không cần cache dữ liệu động (API response).
```

---

## Checklist review trước khi coi 1 giai đoạn là "xong"

- [ ] Có test tự động cho logic nghiệp vụ, không chỉ test bằng tay
- [ ] Mọi endpoint có scope đúng theo shop hiện tại (không rò rỉ dữ liệu
      chéo giữa các shop)
- [ ] Webhook/API bên thứ 3 có xác thực chữ ký, không tin dữ liệu mù quáng
- [ ] UI đã thử trên dữ liệu seed thật, không chỉ trên happy path
- [ ] Không còn TODO/code tạm bợ nào ảnh hưởng tới tính đúng của số buổi/tiền