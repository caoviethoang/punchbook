# 🥊 PunchBook

> **Thay thế sổ quản lý hội viên truyền thống chỉ với 1 chạm.**  
> *Replace traditional customer notebooks in seconds.*

[![Ruby on Rails](https://img.shields.io/badge/Ruby_on_Rails-8.0-CC0000?style=for-the-badge&logo=ruby-on-rails&logoColor=white)](https://rubyonrails.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![payOS](https://img.shields.io/badge/payOS-Integrated-0052CC?style=for-the-badge)](https://payos.vn/)
[![Zalo ZBS](https://img.shields.io/badge/Zalo_ZBS-Automated-0068FF?style=for-the-badge)](https://zalo.me)

---

## 📌 Tổng quan về Sản phẩm (Product Overview)

**PunchBook** là giải pháp phần mềm quản lý gói hội viên đơn giản, chuyên biệt dành cho các mô hình dịch vụ vừa & nhỏ tại Việt Nam (**Spa, Salon Nail, Gym, Massage, Phòng khám...**) — những nơi vẫn đang quản lý bằng sổ tay giấy, file Excel hoặc ghi nhớ thủ công.

Sản phẩm tập trung giải quyết **ĐÚNG 1 BÀI TOÁN CỐT LÕI**: 
> **Quản lý khách hàng, gói dịch vụ và check-in NHAU NHẤT — ĐƠN GIẢN NHẤT — CHÍNH XÁC NHẤT.**

---

## ✨ Tính năng nổi bật (Key Features)

### 1. ⚡ Màn hình Check-in Siêu tốc (Staff UX)
- **Check-in 1-click**: Thao tác hoàn tất trong chưa đầy 3 giây.
- **Smart Phone & Name Search**: Tìm kiếm linh hoạt theo Tên hoặc Số điện thoại (tự động loại bỏ dấu cách, dấu chấm, dấu gạch ngang bất kể định dạng).
- **Phản hồi tức thì (Optimistic Update)**: Trừ số buổi ngay trên giao diện UI, tự động rollback nếu gặp lỗi API.
- **Race-Condition Safe**: Tự động khóa luồng dữ liệu bằng Pessimistic Locking (`with_lock`) tránh tranh chấp khi 2 nhân viên check-in cùng lúc.

### 2. 💳 Thanh toán & Gia hạn gói qua payOS
- **Tạo mã QR thanh toán tức thì**: Tự động tạo link thanh toán VietQR chuyển khoản ngân hàng qua cổng payOS.
- **Bảo mật tuyệt đối**: Xác thực chữ ký HMAC cho Webhooks (`/webhooks/payos`) trước khi gia hạn gói cước.
- **Đảm bảo Idempotency**: Xử lý hóa đơn chính xác 1 lần duy nhất, chống ghi trùng số buổi.

### 3. 📲 Nhắc nhở tự động qua Zalo ZBS (Paid Plan)
- **Daily Sidekiq Cron Job**: Tự động quét các hội viên còn `<= 3 buổi` hoặc hết hạn trong `7 ngày` đối với các cửa hàng gói Trả phí (`paid`).
- **Gửi tin nhắn Zalo kèm Payment Link**: Tự động gửi thông báo nhắc gia hạn kèm link thanh toán trực tuyến đến Zalo của khách hàng.

### 4. 📊 Dashboard Chủ tiệm & Báo cáo Excel Đa sheet
- **Metric Tổng quan**: Doanh thu tháng, Số hội viên đang hoạt động, Hội viên sắp hết hạn.
- **Xuất file Excel chuyên nghiệp**: Tải báo cáo Multi-sheet Excel (Tổng quan, Chi tiết hóa đơn, Danh sách hội viên) chỉ với 1 click.

### 5. 📱 Progressive Web App (PWA)
- Hỗ trợ cài đặt trực tiếp (**Installable Web App**) trên Chrome, Edge & Safari cho máy tính bảng/laptop tại quầy thu ngân.

---

## 🏗 Kiến trúc Hệ thống (Architecture & Monorepo Layout)

```text
punchbook/
├── backend/            # Rails 8 API (PostgreSQL, Redis, Sidekiq, Devise Auth, GraphQL)
├── frontend/           # React 19 + TypeScript + Vite + Tailwind CSS v4 + Apollo Client
├── docs/               # Tài liệu thiết kế sản phẩm, Business Rules, Steps & New Issues
```

### Stack Công nghệ:

| Hợp phần | Công nghệ sử dụng |
|---|---|
| **Backend API** | Ruby on Rails 8, PostgreSQL 16, Redis 7, Sidekiq, Devise, JWT, RSpec |
| **Frontend UI** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Apollo Client |
| **Integrations** | Cổng thanh toán **payOS**, Dịch vụ tin nhắn **Zalo ZBS** |

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

### Cách 1: Khởi chạy nhanh bằng Docker Compose (Khuyên dùng)

1. Clone repository và truy cập vào thư mục dự án:
   ```bash
   git clone https://github.com/caoviethoang/punchbook.git
   cd punchbook
   ```

2. Khởi chạy tất cả các dịch vụ (PostgreSQL, Redis, Backend, Frontend):
   ```bash
   docker compose up --build -d
   ```

3. Khởi tạo Cơ sở dữ liệu:
   ```bash
   docker compose exec backend bundle exec rails db:create db:migrate db:seed
   ```

📍 **Địa chỉ truy cập:**
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000](http://localhost:3000)

---

### Cách 2: Khởi chạy thủ công (Development Mode)

#### 1. Backend (Rails API)
```bash
cd backend
bundle install
rails db:create db:migrate db:seed
bin/dev # Hoặc rails server -p 3000
```

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Kiểm thử & Quản lý Chất lượng Code (Quality Assurance)

Dự án tuân thủ nghiêm ngặt quy trình kiểm thử tự động trên CI/CD GitHub Actions:

### Backend Tests & Linting
```bash
cd backend
bundle exec rubocop    # Kiểm tra chuẩn Code Style (0 offenses requirement)
bundle exec rspec      # Chạy 137+ bộ test cases tự động (100% pass)
```

### Frontend Type-check & Linting
```bash
cd frontend
npm run lint           # ESLint check
npm run build          # TypeScript type-check & Vite production build
```

---

## 🗺 Tài liệu Kỹ thuật & Issue backlog

- 📄 [`docs/product.md`](docs/product.md) — Tầm nhìn sản phẩm & Triết lý thiết kế.
- 📄 [`docs/business-rules.md`](docs/business-rules.md) — Quy tắc nghiệp vụ kinh doanh.
- 📄 [`docs/new_issues.md`](docs/new_issues.md) — Danh sách 8 Issue mở rộng sau MVP (QR Code Check-in, Import Excel, Audit Logs, v.v.).

---

## 📜 License & Owner

Developed by **Louis Cao** — Dedicated to replacing paper notebooks for small businesses in Vietnam.
