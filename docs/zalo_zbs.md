# Zalo ZBS (Zalo Business Solution) / ZNS API Integration Notes

> Source: Official Zalo for Developers Documentation (https://developers.zalo.me/).
> Note: As of 2026, ZNS (Zalo Notification Service) is integrated under **ZBS (Zalo Business Solution) Template Message**.

---

## 1. Credentials / Setup (`ZALO_*` Environment Variables)

| Credential / Variable | Purpose | Where to find |
|---|---|---|
| `ZALO_APP_ID` | Zalo Application ID | developers.zalo.me → App Dashboard |
| `ZALO_APP_SECRET` | App Secret Key (used for OAuth token refresh) | developers.zalo.me → App Settings → Secret Key |
| `ZALO_OA_ID` | Zalo Official Account ID | oa.zalo.me → Account Info |
| `ZALO_REFRESH_TOKEN` | Initial OAuth Refresh Token | Generated via Zalo OAuth consent flow |
| `ZALO_TEMPLATE_ID_MEMBERSHIP_REMINDER` | Approved ZNS Template ID for reminder messages | developers.zalo.me → ZNS → Template Management |

---

## 2. Authentication & Token Refresh Flow

Zalo Official Account (OA) uses OAuth 2.0 tokens for API authorization:
- **`access_token`**: Valid for **25 hours** (~90,000 seconds). Included in API headers.
- **`refresh_token`**: Valid for **3 months**. **Single-use only!**

### Refresh Token Endpoint

```http
POST https://oauth.zaloapp.com/v4/oa/access_token
Content-Type: application/x-www-form-urlencoded
secret_key: <ZALO_APP_SECRET>
```

### Request Body (Form URL Encoded)

| Field | Type | Required | Value / Notes |
|---|---|---|---|
| `refresh_token` | string | ✅ | Current valid Refresh Token |
| `app_id` | string / long | ✅ | Zalo App ID (`ZALO_APP_ID`) |
| `grant_type` | string | ✅ | Constant string: `refresh_token` |

### Example Token Refresh Request

```bash
curl -X POST "https://oauth.zaloapp.com/v4/oa/access_token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "secret_key: YOUR_ZALO_APP_SECRET" \
  -d "refresh_token=YOUR_CURRENT_REFRESH_TOKEN" \
  -d "app_id=YOUR_ZALO_APP_ID" \
  -d "grant_type=refresh_token"
```

### Success Response (200 OK)

```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "def456...",
  "expires_in": "90000"
}
```

### ⚠️ Critical Refresh Token Rules
1. **Single-Use**: Using a `refresh_token` invalidates it immediately.
2. **Atomic Persistence**: The new `refresh_token` returned in the response **must be saved** (in Rails cache or database configuration table) to be used for the next token refresh cycle.
3. **Automated Refresh Strategy**: Schedule background token refresh before the 25-hour expiration window or handle 401 token expiry error by performing an automatic token refresh retry.

---

## 3. Template Message API (Send ZNS Notification)

### Endpoint

```http
POST https://business.openapi.zalo.me/message/template
Content-Type: application/json
access_token: <ZALO_ACCESS_TOKEN>
```

### Headers

| Header Name | Required | Value |
|---|---|---|
| `Content-Type` | ✅ | `application/json` |
| `access_token` | ✅ | Active Zalo OA Access Token |

### Request Body (JSON)

| Field | Type | Required | Notes |
|---|---|---|---|
| `phone` | string | ✅ | Recipient phone number in standard country code format (e.g. `84987654321`) |
| `template_id` | string | ✅ | Approved ZNS Template ID |
| `template_data` | object | ✅ | Key-value mapping matching the placeholders registered in the approved template |
| `tracking_id` | string | ❌ | Custom reference string for tracking/reconciliation (max 48 chars, alphanumeric & underscores) |

### Request Body Example

```json
{
  "phone": "84987654321",
  "template_id": "7895417a7d3f9461cd2e",
  "template_data": {
    "customer_name": "Nguyễn Văn A",
    "shop_name": "Spa Hoa Mai",
    "remaining_sessions": "2",
    "expiry_date": "31/08/2026",
    "payment_url": "https://pay.payos.vn/web/124c33293c934a85be5b7f8761a27a07"
  },
  "tracking_id": "pb_remind_1001_20260826"
}
```

---

## 4. Phone Number Format Normalization

Zalo API strictly requires phone numbers formatted with international prefix `84` without leading `+` or `0`.

### Conversion Rules:
- `0987654321` → `84987654321`
- `+84987654321` → `84987654321`
- `84987654321` → `84987654321`

### Ruby Utility Logic:
```ruby
def normalize_phone(phone)
  cleaned = phone.to_s.gsub(/\D/, '')
  cleaned.sub(/\A0/, '84')
end
```

---

## 5. API Response & Error Codes

### Success Response (`error: 0`)

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "msg_id": "c1f7a4d2e9b841...",
    "sent_time": 1756200000,
    "quota": {
      "dailyQuota": 5000,
      "remainingQuota": 4950
    }
  }
}
```

- **`data.msg_id`**: Unique message ID assigned by Zalo (only present when `error == 0`).
- **`data.sent_time`**: Timestamp of send dispatch.

### Error Response (`error != 0`)

```json
{
  "error": -108,
  "message": "Phone number invalid"
}
```

### Common Zalo ZBS Error Codes Reference Table

| Code | Meaning / Description | Recommended Action |
|---|---|---|
| **0** | **Success** | Message queued / sent successfully |
| **-100** | Unknown error | Transient error; retry after backoff |
| **-101** | Application invalid | Check `ZALO_APP_ID` |
| **-102** | Application not existed | Check `ZALO_APP_ID` |
| **-103** | Application not activated | Activate app in Zalo developer console |
| **-104** | App secret key invalid | Check `ZALO_APP_SECRET` |
| **-105** | Application not linked to any OA | Link App to OA in Zalo console |
| **-106** | Method unsupported | Verify HTTP POST method |
| **-107** | Message ID invalid | Check tracking/message ID |
| **-108** | Phone number invalid | Validate phone format before sending |
| **-109** | Template ID invalid | Verify `ZALO_TEMPLATE_ID` |
| **-110** | Zalo version unsupported | Recipient app version too old |
| **-111** | Template data empty | Check `template_data` hash |
| **-112** | Template data type not defined | Check parameter schema in template |
| **-1121**| Parameter data exceeds max length | Truncate parameter values |
| **-1122**| Template data missing parameter | Provide all mandatory template fields |
| **-1124**| Parameter has invalid format | Fix date/number formats in `template_data` |
| **-113** | Button invalid | Verify CTA button configuration in template |
| **-117** | OA/App lacks permission | Verify OA quota and permissions |

---

## 6. Implementation Architecture for PunchBook (Phase 8 Sidekiq Job)

### Components Overview
1. **`ZaloService`** (PORO in `app/services/zalo_service.rb`):
   - Handles `fetch_access_token` / `refresh_access_token!` with atomic storage.
   - Handles `send_template_message(phone:, template_id:, template_data:, tracking_id:)`.
   - Normalizes phone numbers before dispatch.
2. **`SendMembershipRemindersJob`** (Sidekiq Job / Daily Cron):
   - Scans paid shops (`Shop.where(plan: 'paid')`).
   - Selects memberships expiring in <= 7 days OR with `sessions_left <= 3`.
   - Generates PayOS renewal invoice payment link.
   - Dispatches Zalo notification message via `ZaloService`.
   - Logs send history to prevent duplicate daily notifications.
3. **Environment & Development Mode**:
   - Zalo Development / Testing Mode restricts messages to phone numbers registered as OA Administrators.

---

## 7. Checklist for Job Implementation

- [x] Environment keys defined (`ZALO_APP_ID`, `ZALO_APP_SECRET`, `ZALO_OA_ID`, `ZALO_REFRESH_TOKEN`, `ZALO_TEMPLATE_ID_MEMBERSHIP_REMINDER`)
- [x] OAuth 2.0 single-use refresh token persistence strategy defined
- [x] Request payload structure documented (`phone`, `template_id`, `template_data`, `tracking_id`)
- [x] Response parsing and error handling table established
- [x] Phone number normalization specified (`84xxxxxxxxx`)
