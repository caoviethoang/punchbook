/*
 * ==============================================================================
 * PunchBook Smart Access Control - ESP32 Reference Firmware
 * ==============================================================================
 * Tương thích: ESP32-WROOM-32 Dev Module
 * Thiết bị ngoại vi hỗ trợ:
 *  - Đầu đọc thẻ RFID RC522 (Giao tiếp SPI)
 *  - Đầu đọc mã QR / Barcode GM65 (Giao tiếp UART Serial2)
 *  - Module Rơ-le kích cổng xoay ba càng (Tripod Turnstile) hoặc Khóa từ (Magnetic Lock)
 *  - Còi chip báo hiệu (Active Buzzer) & LED chỉ thị trạng thái 2 màu (Xanh/Đỏ)
 *
 * Thư viện yêu cầu (Cài đặt qua Arduino Library Manager):
 *  - ArduinoJson by Benoit Blanchon (phiên bản 6.x hoặc 7.x)
 *  - MFRC522 by GithubCommunity (phiên bản 1.4.10+)
 *
 * Bản quyền (c) 2026 PunchBook. Giữ toàn quyền.
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>

// ==============================================================================
// 1. CẤU HÌNH HỆ THỐNG & KẾT NỐI (TÙY CHỈNH THEO PHÒNG TẬP CỦA BẠN)
// ==============================================================================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Địa chỉ PunchBook Server (Thay đổi thành domain server hoặc IP nội bộ của bạn)
// Ví dụ nội bộ: "http://192.168.1.100:3000"
// Ví dụ production: "https://api.punchbook.vn"
const String SERVER_BASE_URL = "http://192.168.1.100:3000";

// Device Token duy nhất được tạo từ trang Cài đặt Thiết bị PunchBook (Bắt đầu bằng dev_tok_...)
const String DEVICE_TOKEN = "YOUR_DEVICE_TOKEN_HERE";

// Chu kỳ gửi nhịp tim (Heartbeat ping) kiểm tra trạng thái Online: 60 giây
const unsigned long HEARTBEAT_INTERVAL_MS = 60000;

// ==============================================================================
// 2. KHAI BÁO CHÂN PHẦN CỨNG (GPIO PIN DEFINITIONS)
// ==============================================================================
#define PIN_RELAY       26  // Rơ-le kích mở cổng (Thường là Active LOW)
#define PIN_BUZZER      27  // Còi báo hiệu Active Buzzer
#define PIN_LED_GREEN   32  // LED Xanh chỉ thị truy cập thành công
#define PIN_LED_RED     33  // LED Đỏ chỉ thị truy cập bị từ chối

// Chân giao tiếp SPI cho RFID RC522
#define PIN_RC522_SS    5
#define PIN_RC522_RST   4
// SCK: GPIO 18, MISO: GPIO 19, MOSI: GPIO 23 (Chân chuẩn VSPI trên ESP32)

// Chân Serial2 cho Đầu đọc mã QR GM65
#define PIN_QR_RX       16  // Nối vào TX của GM65
#define PIN_QR_TX       17  // Nối vào RX của GM65

// Định nghĩa mức kích hoạt của Relay (đa số module relay trên thị trường kích mức LOW)
#define RELAY_ACTIVE_LEVEL   LOW
#define RELAY_INACTIVE_LEVEL HIGH

// ==============================================================================
// 3. KHỞI TẠO ĐỐI TƯỢNG VÀ BIẾN TOÀN CỤC
// ==============================================================================
MFRC522 rfid(PIN_RC522_SS, PIN_RC522_RST);
HardwareSerial qrSerial(2);

unsigned long lastHeartbeatTime = 0;
bool isProcessingCheckIn = false;

// ==============================================================================
// 4. CÁC HÀM XỬ LÝ PHẦN CỨNG NGOẠI VI (BUZZER, LED, RELAY)
// ==============================================================================

void triggerBuzzer(const String& mode) {
  if (mode == "granted") {
    // 1 tiếng bíp ngắn (100ms) thanh thoát
    digitalWrite(PIN_BUZZER, HIGH);
    delay(100);
    digitalWrite(PIN_BUZZER, LOW);
  } else if (mode == "denied") {
    // 2 tiếng bíp dài cảnh báo từ chối
    for (int i = 0; i < 2; i++) {
      digitalWrite(PIN_BUZZER, HIGH);
      delay(250);
      digitalWrite(PIN_BUZZER, LOW);
      delay(100);
    }
  }
}

void indicateLed(const String& color, int durationMs = 1500) {
  if (color == "green") {
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_RED, LOW);
  } else if (color == "red") {
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
  }

  // Chờ hiển thị nếu được yêu cầu đồng bộ
  if (durationMs > 0) {
    delay(durationMs);
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, LOW);
  }
}

void triggerRelayUnlock(int pulseMs) {
  Serial.printf("[RELAY] Kích mở rơ-le trong %d ms...\n", pulseMs);
  digitalWrite(PIN_RELAY, RELAY_ACTIVE_LEVEL);
  delay(pulseMs);
  digitalWrite(PIN_RELAY, RELAY_INACTIVE_LEVEL);
  Serial.println("[RELAY] Đã ngắt rơ-le về vị trí khóa.");
}

// ==============================================================================
// 5. GIAO TIẾP MẠNG & PUNCHBOOK API
// ==============================================================================

void ensureWiFiConnected() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("[WIFI] Đang kết nối WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Đã kết nối thành công!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI] Kết nối thất bại. Sẽ thử lại sau.");
  }
}

void sendHeartbeatPing() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = SERVER_BASE_URL + "/api/v1/hardware/ping";

  Serial.println("[HEARTBEAT] Đang gửi ping lên PunchBook...");
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);

  int httpCode = http.POST("{}");
  if (httpCode == 200) {
    String response = http.getString();
    Serial.printf("[HEARTBEAT] Ping thành công (HTTP %d): %s\n", httpCode, response.c_str());
  } else {
    Serial.printf("[HEARTBEAT] Ping thất bại, mã lỗi HTTP: %d\n", httpCode);
  }
  http.end();
}

void processCheckIn(const String& identifier) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[CHECK-IN] Không có kết nối mạng!");
    triggerBuzzer("denied");
    indicateLed("red", 500);
    return;
  }

  isProcessingCheckIn = true;
  Serial.printf("[CHECK-IN] Gửi yêu cầu xác thực cho mã: %s\n", identifier.c_str());

  HTTPClient http;
  String url = SERVER_BASE_URL + "/api/v1/hardware/check_in";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);

  // Tạo payload JSON gửi lên server
  StaticJsonDocument<256> reqDoc;
  reqDoc["identifier"] = identifier;
  String reqBody;
  serializeJson(reqDoc, reqBody);

  int httpCode = http.POST(reqBody);
  String response = http.getString();
  Serial.printf("[CHECK-IN] HTTP Response code: %d\n", httpCode);
  Serial.printf("[CHECK-IN] Body: %s\n", response.c_str());

  if (httpCode == 200 || httpCode == 422) {
    StaticJsonDocument<1024> respDoc;
    DeserializationError error = deserializeJson(respDoc, response);

    if (error) {
      Serial.printf("[CHECK-IN] Lỗi parse JSON response: %s\n", error.c_str());
      triggerBuzzer("denied");
      indicateLed("red", 1000);
    } else {
      bool accessGranted = respDoc["access_granted"] | false;
      JsonObject action = respDoc["hardware_action"];
      bool relayTrigger = action["relay_trigger"] | false;
      int pulseMs = action["pulse_ms"] | 1500;
      String buzzerTone = action["buzzer"] | (accessGranted ? "granted" : "denied");
      String ledColor = action["led"] | (accessGranted ? "green" : "red");
      const char* audioPrompt = respDoc["audio_prompt"] | "";

      Serial.printf("[PUNCHBOOK] Phán quyết: %s | Lời chào: %s\n",
                    accessGranted ? "CHẤP THUẬN (GRANTED)" : "TỪ CHỐI (DENIED)",
                    audioPrompt);

      if (accessGranted && relayTrigger) {
        // Cấp quyền mở cổng
        digitalWrite(PIN_LED_GREEN, HIGH);
        triggerBuzzer(buzzerTone);
        triggerRelayUnlock(pulseMs);
        digitalWrite(PIN_LED_GREEN, LOW);
      } else {
        // Từ chối mở cổng
        indicateLed(ledColor, 0);
        triggerBuzzer(buzzerTone);
        delay(1000);
        digitalWrite(PIN_LED_RED, LOW);
      }
    }
  } else {
    Serial.printf("[CHECK-IN] Server báo lỗi không xác định (HTTP %d)\n", httpCode);
    triggerBuzzer("denied");
    indicateLed("red", 1000);
  }

  http.end();
  isProcessingCheckIn = false;
}

// ==============================================================================
// 6. KHỞI ĐỘNG HỆ THỐNG (SETUP)
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==================================================");
  Serial.println("PunchBook Smart Access Control - ESP32 Firmware");
  Serial.println("==================================================");

  // Cấu hình GPIO
  pinMode(PIN_RELAY, OUTPUT);
  digitalWrite(PIN_RELAY, RELAY_INACTIVE_LEVEL); // Đảm bảo rơ-le luôn khóa lúc khởi động

  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  pinMode(PIN_LED_GREEN, OUTPUT);
  digitalWrite(PIN_LED_GREEN, LOW);

  pinMode(PIN_LED_RED, OUTPUT);
  digitalWrite(PIN_LED_RED, LOW);

  // Khởi động SPI và Đầu đọc RFID RC522
  SPI.begin();
  rfid.PCD_Init();
  delay(50);
  rfid.PCD_DumpVersionToSerial();
  Serial.println("[RC522] Đã khởi tạo đầu đọc thẻ RFID.");

  // Khởi động Serial2 cho đầu đọc mã GM65 (Baud rate mặc định 9600)
  qrSerial.begin(9600, SERIAL_8N1, PIN_QR_RX, PIN_QR_TX);
  Serial.println("[GM65] Đã khởi tạo cổng đọc mã QR qua UART2.");

  // Kết nối WiFi
  ensureWiFiConnected();

  // Bíp khởi động thành công
  digitalWrite(PIN_LED_GREEN, HIGH);
  triggerBuzzer("granted");
  delay(200);
  digitalWrite(PIN_LED_GREEN, LOW);

  // Gửi heartbeat đầu tiên khi vừa khởi động
  sendHeartbeatPing();
  lastHeartbeatTime = millis();
}

// ==============================================================================
// 7. VÒNG LẶP CHÍNH (LOOP)
// ==============================================================================
void loop() {
  // 1. Duy trì kết nối WiFi
  if (WiFi.status() != WL_CONNECTED) {
    ensureWiFiConnected();
  }

  // 2. Gửi định kỳ Heartbeat Ping lên Server
  if (millis() - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    sendHeartbeatPing();
    lastHeartbeatTime = millis();
  }

  if (isProcessingCheckIn) {
    delay(50);
    return;
  }

  // 3. Kiểm tra quét thẻ RFID RC522
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String cardUid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) cardUid += "0";
      cardUid += String(rfid.uid.uidByte[i], HEX);
    }
    cardUid.toUpperCase();
    Serial.printf("\n[RFID] Phát hiện thẻ từ UID: %s\n", cardUid.c_str());

    // Dừng giao tiếp với thẻ hiện tại để tránh đọc lặp
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();

    // Gửi xác thực check-in
    processCheckIn(cardUid);
  }

  // 4. Kiểm tra quét mã QR từ GM65 qua Serial2
  if (qrSerial.available() > 0) {
    String qrData = qrSerial.readStringUntil('\r');
    qrData.trim();
    if (qrData.length() > 0) {
      Serial.printf("\n[QR-SCANNER] Đọc được mã: %s\n", qrData.c_str());
      processCheckIn(qrData);
    }
  }

  delay(20);
}
