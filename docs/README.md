# Sổ Khách

> Digital Membership Management for Small Businesses

---

## Overview

Sổ Khách là ứng dụng giúp các cửa hàng dịch vụ như Spa, Nail, Gym và Clinic quản lý khách hàng và gói dịch vụ thay cho sổ giấy.

Mục tiêu của sản phẩm là giúp nhân viên có thể check-in khách trong vài giây và giúp chủ cửa hàng theo dõi hoạt động kinh doanh một cách đơn giản.

Sổ Khách **không phải CRM**, **không phải ERP**, cũng **không phải POS**.

Sản phẩm chỉ tập trung giải quyết một vấn đề:

> Quản lý khách và gói dịch vụ một cách nhanh, đơn giản và chính xác.

---

# Target Users

## Primary

- Spa
- Nail Salon
- Gym
- Massage
- Clinic

Quy mô:

- 1 cửa hàng
- 2–10 nhân viên
- 100–1000 khách hàng

---

## Users

### Owner

Sử dụng để:

- Xem doanh thu
- Quản lý khách
- Quản lý gói
- Theo dõi hoạt động

---

### Staff

Sử dụng để:

- Tìm khách
- Check-in
- Gia hạn gói
- Thanh toán

---

# MVP Scope

Phiên bản đầu tiên chỉ bao gồm:

- Authentication
- Customer Management
- Package Management
- Membership Management
- Check-in
- Payment
- Dashboard

Không bao gồm:

- Booking
- CRM
- Marketing
- Loyalty
- QR Check-in
- Multi Branch
- Mobile App

---

# Product Principles

## 1. Speed First

Mọi thao tác phải nhanh.

Một thao tác 1 click luôn tốt hơn 3 click.

---

## 2. Simplicity

Một màn hình chỉ giải quyết một công việc.

Không nhồi nhiều chức năng.

---

## 3. Staff First

95% thao tác đến từ Staff.

Toàn bộ UX sẽ được tối ưu cho Staff trước.

---

## 4. Owner Needs Information

Owner không thao tác nhiều.

Owner cần biết:

- Hôm nay bán được bao nhiêu
- Có bao nhiêu khách
- Ai sắp hết gói

---

# Architecture

Ứng dụng được chia thành hai trải nghiệm.

## Staff Portal

Mục tiêu:

Check-in nhanh nhất có thể.

Flow:

Search Customer

↓

Check-in

↓

Done

---

## Owner Portal

Mục tiêu:

Quản trị.

Flow:

Dashboard

↓

Customers

↓

Packages

↓

Reports

↓

Settings

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Apollo Client
- TailwindCSS
- shadcn/ui

---

## Backend

- Ruby on Rails
- GraphQL
- PostgreSQL
- Redis
- Sidekiq

---

## Storage

- Cloudflare R2

---

## Payment

- payOS

---

## Deployment

Frontend

- Cloudflare Pages (hoặc Vercel)

Backend

- Render / Railway / VPS

Database

- PostgreSQL

---

# Repository Structure

```
/
├── backend/
├── frontend/
├── docs/
├── design/
└── scripts/
```

---

# Documentation

| File | Description |
|------|-------------|
| product.md | Mô tả sản phẩm |
| business-rules.md | Logic nghiệp vụ |
| database.md | Thiết kế Database |
| api.md | GraphQL API |
| ui-ux.md | Wireframe + UI |
| roadmap.md | Kế hoạch phát triển |

---

# Development Strategy

Không phát triển theo module.

Phát triển theo Vertical Slice.

Ví dụ:

Sprint 1

Login

↓

Customer Search

↓

Deploy

Sprint 2

Membership

↓

Check-in

Sprint 3

Payment

↓

Dashboard

---

# Definition of Done

Một tính năng được coi là hoàn thành khi:

- Business Rule đã được áp dụng
- Database đã cập nhật
- API hoàn thành
- Frontend hoàn thành
- Có test
- Deploy thành công

---

# Current Status

- [ ] Product
- [ ] Business Rules
- [ ] Database
- [ ] API
- [ ] UI/UX
- [ ] MVP

---

# Design Goals

Một nhân viên mới có thể:

- Học sử dụng trong dưới 5 phút
- Check-in trong dưới 5 giây
- Không cần đọc tài liệu hướng dẫn

---

# Future Roadmap

Sau khi MVP ổn định sẽ phát triển:

- QR Check-in
- Mobile App
- Multi Branch
- Notification
- Membership Card
- Analytics
- AI Assistant

---

# License

Private Project