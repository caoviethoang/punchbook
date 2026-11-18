# Sơ đồ Đấu nối Phần cứng & Tích hợp IoT Cổng Xoay / Khóa Từ PunchBook

Tài liệu hướng dẫn kỹ thuật chi tiết để tích hợp vi điều khiển **ESP32** với **Cổng xoay ba càng (Tripod Turnstile)**, **Khóa từ (Magnetic Lock)**, **Đầu đọc thẻ RFID RC522** và **Đầu đọc mã vạch / QR Code GM65** sử dụng hệ thống quản lý phòng tập **PunchBook Smart Access Control**.

---

## 1. Danh mục linh kiện phần cứng (Bill of Materials - BOM)

| STT | Thiết bị / Linh kiện | Ghi chú kỹ thuật | Mục đích |
|---|---|---|---|
| 1 | **ESP32-WROOM-32** Dev Board | 30 chân hoặc 38 chân, hỗ trợ Wi-Fi 2.4GHz | Bộ vi điều khiển trung tâm chạy firmware |
| 2 | **Module Rơ-le (Relay) 1-Kênh 5V** | Có cách ly quang (Optocoupler), kích Mức Thấp (Active LOW) | Đóng ngắt tiếp điểm khô kích mở cổng xoay hoặc ngắt điện khóa từ |
| 3 | **Đầu đọc RFID RC522** | Tần số 13.56 MHz, giao tiếp SPI (Nguồn cấp **3.3V**) | Quét thẻ từ Mifare của hội viên |
| 4 | **Module quét mã QR / Barcode GM65** | Giao tiếp UART TTL (9600 bps), nguồn cấp 5V | Quét mã QR hội viên trên ứng dụng di động hoặc vé |
| 5 | **Module hạ áp Buck DC-DC LM2596 / MP1584** | Input: 12V-24V DC, Output: 5V DC (tối thiểu 2A) | Hạ áp từ nguồn cổng xoay xuống 5V nuôi ESP32 và cảm biến |
| 6 | **Còi chip chủ động (Active Buzzer 5V)** | Điều khiển bằng GPIO qua transistor/điện trở | Phát âm thanh xác thực (Bíp ngắn khi hợp lệ, bíp dài khi từ chối) |
| 7 | **LED chỉ thị 2 màu (Xanh lá & Đỏ)** | Cực âm chung (Common Cathode) + điện trở 220Ω | Hiển thị trạng thái quẹt thẻ (Xanh: Cho phép, Đỏ: Từ chối) |
| 8 | **Diode 1N4007** | Đấu ngược cực (Flyback Diode) song song với khóa từ | Triệt tiêu xung điện áp tự cảm (chỉ cần khi dùng khóa từ) |

---

## 2. Bảng phân bổ chân GPIO trên ESP32

> [!CAUTION]
> **Quan trọng**: Đầu đọc RC522 hoạt động ở mức điện áp **3.3V**. Cấp điện áp 5V vào chân VCC của RC522 sẽ làm cháy chip!

| Tên thiết bị | Chân thiết bị | Chân ESP32 (GPIO) | Ghi chú kết nối |
|---|---|---|---|
| **RC522 (RFID)** | 3.3V | **3V3** | Bắt buộc 3.3V |
| | GND | **GND** | Nối đất chung |
| | RST | **GPIO 4** | Reset RC522 |
| | MISO | **GPIO 19** | VSPI MISO |
| | MOSI | **GPIO 23** | VSPI MOSI |
| | SCK | **GPIO 18** | VSPI SCK |
| | SDA (SS) | **GPIO 5** | Chip Select |
| **GM65 (QR Scanner)** | VCC | **VIN (5V)** | Cấp nguồn 5V |
| | GND | **GND** | Nối đất chung |
| | TX | **GPIO 16 (RX2)** | Nhận dữ liệu mã vạch vào ESP32 |
| | RX | **GPIO 17 (TX2)** | Gửi lệnh cấu hình ra GM65 (nếu cần) |
| **Module Rơ-le (Relay)** | VCC | **VIN (5V)** | Cấp nguồn nuôi cuộn hút |
| | GND | **GND** | Nối đất chung |
| | IN | **GPIO 26** | Tín hiệu kích (Active LOW) |
| **Còi Buzzer** | (+) | **GPIO 27** | Kích xung phát âm thanh |
| | (-) | **GND** | Nối đất |
| **LED Trạng thái** | Xanh (Anode) | **GPIO 32** | Nối qua điện trở 220Ω |
| | Đỏ (Anode) | **GPIO 33** | Nối qua điện trở 220Ω |
| | Cathode chung | **GND** | Nối đất |

---

## 3. Sơ đồ mạch đấu nối nguyên lý (Schematic Diagram)

```text
       +-------------------------------------------------------------+
       |           NGUỒN TỔ ONG 12V DC (Từ mạch Cổng Xoay)           |
       +-------------------------------------------------------------+
                     | (+) 12V                         | (-) GND
                     v                                 v
          +---------------------+                      |
          |  Mạch Buck LM2596   |                      |
          |  12V  ->  5V DC     |                      |
          +---------------------+                      |
             | (+) 5V          | (-) GND               |
             +--------+        +-----------------------+
                      |        |
                      v        v
                +---------------------+
                |     ESP32 DEVKIT    |
                |  VIN            GND |
                +---------------------+
                 |  |  |  |  |  |  |
                 |  |  |  |  |  |  +--> GPIO 27 ----> [ Active Buzzer ] ---> GND
                 |  |  |  |  |  +-----> GPIO 32 ----> [ R: 220Ω ] ---> [ LED Xanh ] ---> GND
                 |  |  |  |  +--------> GPIO 33 ----> [ R: 220Ω ] ---> [ LED Đỏ ] -----> GND
                 |  |  |  +-----------> GPIO 26 -----------------------------+
                 |  |  |                                                     | (IN)
                 |  |  +--> GPIO 16 (RX2) <--- [ GM65 TX ]                   |
                 |  |  +--> GPIO 17 (TX2) ---> [ GM65 RX ]                   |
                 |  |  +--> 5V / GND --------> [ GM65 VCC/GND ]              |
                 |  |                                                        v
                 |  +-----> SPI (GPIO 5, 18, 19, 23, 4)             +-----------------+
                 |          + Nguồn 3.3V / GND                     |  MODULE RELAY   |
                 |          v                                       |  VCC   GND   IN |
                 |     +------------------+                         +-----------------+
                 |     | RC522 RFID 13.56 |                           |      |
                 |     +------------------+                           | COM  | NO (Tiếp điểm thường hở)
                 +----------------------------------------------------+      +--------------------+
                                                                                                  |
                                                                                                  v
                                                  +---------------------------------------------------+
                                                  |             BO ĐIỀU KHIỂN CỔNG XOAY               |
                                                  |                                                   |
                                                  |      [ OPEN_L / OPEN_R ] <------- (NO)            |
                                                  |            [ GND ]       <------- (COM)           |
                                                  |                                                   |
                                                  | * Bo nhận xung kích Dry Contact (1.5s) và nhả chốt|
                                                  +---------------------------------------------------+
```

---

## 4. Hướng dẫn đấu nối Rơ-le theo từng loại thiết bị

### 4.1. Đối với Cổng Xoay Ba Càng (Tripod Turnstile)
- Bo mạch điều khiển cổng xoay (ví dụ: Turbohoo, JKDC, ZKTeco) luôn có sẵn các chân nhận tín hiệu kích mở tiếp điểm khô (**Dry Contact**):
  - Chân tín hiệu mở chiều vào: thường ký hiệu là `OPEN_A`, `OPEN_L`, hoặc `K1`.
  - Chân chung: ký hiệu là `GND` hoặc `COM`.
- **Cách nối**:
  1. Nối chân **COM** của module Rơ-le vào chân **GND** của bo cổng xoay.
  2. Nối chân **NO (Normally Open - Thường mở)** của module Rơ-le vào chân **OPEN_L** của bo cổng xoay.
  3. Khi PunchBook xác nhận check-in hợp lệ, API trả về `relay_trigger: true, pulse_ms: 1500`. ESP32 sẽ đóng rơ-le trong 1.5 giây rồi ngắt, bo cổng xoay nhận lệnh và mở khóa cơ khí cho khách đẩy qua.

### 4.2. Đối với Khóa Từ Hút Nam Châm Điện (Magnetic Lock 12V/24V)
- Khóa điện từ hoạt động theo nguyên tắc: **Cấp điện liên tục để khóa, ngắt điện để mở cửa (Fail-Safe)**.
- **Cách nối**:
  1. Dây (+) 12V từ nguồn cấp -> Nối vào chân **COM** của Rơ-le.
  2. Nối chân **NC (Normally Closed - Thường đóng)** của Rơ-le -> Cực dương (+) của Khóa Từ.
  3. Cực âm (-) của Khóa Từ -> Nối trực tiếp về Cực âm (-) GND của Nguồn 12V.
  4. **Quan trọng**: Hàn thêm 1 diode **1N4007** song song với hai đầu dây của khóa từ (cực có vạch trắng của diode nối vào cực dương (+), cực còn lại nối cực âm (-)) để triệt tiêu dòng tự cảm khi rơ-le ngắt, bảo vệ tiếp điểm rơ-le không bị hồ quang đánh hỏng.
  5. Khi PunchBook xác thực hợp lệ, API trả về `relay_trigger: true, pulse_ms: 3000`. ESP32 kích rơ-le nhảy sang NO, làm hở mạch NC trong 3 giây, khóa mất điện và cửa mở ra.

---

## 5. Quy trình giao tiếp API giữa ESP32 và PunchBook Server

```text
[Thẻ RFID / Mã QR]
       |
       v (Quét mã)
   [ ESP32 ]
       |
       | POST /api/v1/hardware/check_in
       | Header: X-Device-Token: <device_token>
       | Body: { "identifier": "MB-88992" }
       v
[ PunchBook Backend ]
       |
       | 1. Xác thực Device Token (Phân quyền đúng Shop & Thiết bị)
       | 2. Kiểm tra gói tập hội viên (Hạn dùng, số buổi còn lại)
       | 3. Ghi nhận CheckIn log liên kết với hardware_device_id
       | 4. Trả về payload điều khiển
       v
[ ESP32 nhận JSON Response ]
       |
       +---> access_granted: true
       |        +--> Đóng Rơ-le trong `pulse_ms` (1500ms hoặc 3000ms)
       |        +--> Bật LED Xanh + Kêu còi Bíp 1 tiếng ngắn (buzzer: "granted")
       |        +--> (Nếu có loa I2S) Phát câu: "Chào mừng [Tên] vào tập"
       |
       +---> access_granted: false
                +--> KHÔNG kích Rơ-le
                +--> Bật LED Đỏ + Kêu còi Bíp dài cảnh báo (buzzer: "denied")
```

Ngoài ra, định kỳ mỗi 60 giây, ESP32 gửi heartbeat:
```http
POST /api/v1/hardware/ping HTTP/1.1
Host: your-punchbook-domain.com
X-Device-Token: dev_tok_abc123...
```
PunchBook cập nhật trường `last_ping_at` để quản trị viên có thể theo dõi tình trạng Online/Offline theo thời gian thực trên trang Cài đặt Thiết bị.
