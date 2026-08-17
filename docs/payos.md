# payOS Integration Notes

> Source: https://payos.vn/docs/ (read 2026-08-17). Do NOT guess — re-read official docs if anything changes.

---

## 1. Credentials / Setup

| Credential | Where to find | Env var |
|---|---|---|
| **Client ID** | my.payos.vn → Payment channel → Settings | `PAYOS_CLIENT_ID` |
| **API Key** | my.payos.vn → Payment channel → Settings | `PAYOS_API_KEY` |
| **Checksum Key** | my.payos.vn → Payment channel → Settings | `PAYOS_CHECKSUM_KEY` |

**Prerequisites** (production or sandbox):
1. Create an account at https://my.payos.vn
2. Verify your business/individual identity
3. Create a payment channel → this generates `client_id`, `api_key`, `checksum_key`

---

## 2. Authentication

All API requests must include **two custom headers**:

```http
x-client-id: <PAYOS_CLIENT_ID>
x-api-key:   <PAYOS_API_KEY>
```

There is **no OAuth/Bearer token flow** — it's plain static API key auth per request.

---

## 3. Base URL

| Env | Base URL |
|---|---|
| Production | `https://api-merchant.payos.vn` |
| Sandbox | Same domain — use sandbox credentials from my.payos.vn |

---

## 4. Create Payment Link

### Endpoint

```
POST https://api-merchant.payos.vn/v2/payment-requests
Content-Type: application/json
x-client-id: <PAYOS_CLIENT_ID>
x-api-key:   <PAYOS_API_KEY>
```

### Request Body (JSON)

| Field | Type | Required | Notes |
|---|---|---|---|
| `orderCode` | integer | ✅ | Unique per shop — use invoice ID or a sequence |
| `amount` | integer | ✅ | In VND, integer only (e.g. `50000`) |
| `description` | string | ✅ | Payment description shown to payer. Max 9 chars for non-linked bank accounts |
| `cancelUrl` | string (URL) | ✅ | Redirect when user cancels |
| `returnUrl` | string (URL) | ✅ | Redirect on successful payment |
| `signature` | string | ✅ | HMAC_SHA256 — see Section 6 |
| `buyerName` | string | ❌ | For e-invoice integration |
| `buyerEmail` | string | ❌ | For e-invoice |
| `buyerPhone` | string | ❌ | For e-invoice |
| `buyerCompanyName` | string | ❌ | For e-invoice |
| `buyerTaxCode` | string | ❌ | For e-invoice |
| `buyerAddress` | string | ❌ | For e-invoice |
| `items` | array | ❌ | Line items — each has `name`, `quantity`, `price`, `unit`, `taxPercentage` |
| `invoice` | object | ❌ | `{ buyerNotGetInvoice: bool, taxPercentage: int }` |
| `expiredAt` | integer (Unix) | ❌ | Unix timestamp (Int32) for link expiry |

### Example Request

```json
{
  "orderCode": 1001,
  "amount": 150000,
  "description": "PunchBook",
  "cancelUrl": "https://yourapp.vn/payment/cancel",
  "returnUrl": "https://yourapp.vn/payment/success",
  "items": [
    { "name": "Gói tập 10 buổi", "quantity": 1, "price": 150000, "unit": "gói" }
  ],
  "signature": "<computed_hmac_sha256>"
}
```

### Response (200 OK)

```json
{
  "code": "00",
  "desc": "success",
  "data": {
    "bin": "970422",
    "accountNumber": "113366668888",
    "accountName": "...",
    "amount": 150000,
    "description": "PunchBook",
    "orderCode": 1001,
    "currency": "VND",
    "paymentLinkId": "124c33293c934a85be5b7f8761a27a07",
    "status": "PENDING",
    "checkoutUrl": "https://pay.payos.vn/web/124c33293c934a85be5b7f8761a27a07",
    "qrCode": "<VietQR EMV string>"
  },
  "signature": "<response_signature>"
}
```

- **`checkoutUrl`** → redirect user here to complete payment
- **`qrCode`** → EMV QR string if you want to render QR in-app
- **`status`**: `PENDING` | `PAID` | `CANCELLED` | `EXPIRED`

---

## 5. Webhook Payload

payOS POSTs to your configured webhook URL (set on my.payos.vn) when a payment completes.

Your endpoint **must return HTTP 2XX** to acknowledge receipt.

### Payload Structure

```json
{
  "code": "00",
  "desc": "success",
  "success": true,
  "data": {
    "orderCode": 123,
    "amount": 3000,
    "description": "VQRIO123",
    "accountNumber": "12345678",
    "reference": "TF230204212323",
    "transactionDateTime": "2023-02-04 18:25:00",
    "currency": "VND",
    "paymentLinkId": "124c33293c43417ab7879e14c8d9eb18",
    "code": "00",
    "desc": "Thành công",
    "counterAccountBankId": "",
    "counterAccountBankName": "",
    "counterAccountName": "",
    "counterAccountNumber": "",
    "virtualAccountName": "",
    "virtualAccountNumber": ""
  },
  "signature": "8d8640d802576397a1ce45ebda7f835055768ac7ad2e0bfb77f9b8f12cca4c7f"
}
```

| Field | Description |
|---|---|
| `data.orderCode` | Matches the `orderCode` you sent at creation |
| `data.amount` | Amount paid in VND |
| `data.reference` | Bank transaction reference |
| `data.transactionDateTime` | When bank confirmed the transaction |
| `data.paymentLinkId` | payOS payment link identifier |
| `signature` | HMAC_SHA256 of `data` fields — **must verify before trusting** |

> ⚠️ `counterAccount*` fields are only populated for MB Bank, ACB, KienlongBank.

---

## 6. Signature Algorithm

Used in **two places**:
1. **Outgoing request** — sign your `CREATE` request body before sending
2. **Incoming webhook** — verify payOS's signature on every webhook

### Algorithm

```
HMAC_SHA256(data_string, PAYOS_CHECKSUM_KEY)
```

Where `data_string` is built as:

```
key1=value1&key2=value2...
```

**Rules:**
- Keys sorted **alphabetically** (a→z)
- `null`, `undefined`, or Ruby `nil` values → use empty string `""`
- Arrays → JSON-encode each element with keys sorted alphabetically, then serialize the array as JSON
- Join with `&`

### For CREATE Payment Link (outgoing signature)

Only these 5 fields go into the signature string:

```
amount=<amount>&cancelUrl=<cancelUrl>&description=<description>&orderCode=<orderCode>&returnUrl=<returnUrl>
```

### For Webhook Verification (Ruby example)

```ruby
# In your webhook controller
def verify_payos_signature!(data, received_signature)
  sorted_data = data.sort.to_h  # sort keys alphabetically
  
  data_string = sorted_data.map do |key, value|
    value = "" if value.nil?
    "#{key}=#{value}"
  end.join("&")
  
  computed = OpenSSL::HMAC.hexdigest("sha256", ENV["PAYOS_CHECKSUM_KEY"], data_string)
  
  raise PayOS::SignatureVerificationError unless ActiveSupport::SecurityUtils.secure_compare(computed, received_signature)
end
```

---

## 7. Other Useful Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/v2/payment-requests/{orderCode}` | Get payment link info by orderCode or paymentLinkId |
| `POST` | `/v2/payment-requests/{orderCode}/cancel` | Cancel a pending payment link |
| `GET` | `/v2/payment-requests/{orderCode}/invoices` | Get invoice info |
| `POST` | `/webhook/payment-requests/confirm-url` | Register/update webhook URL |

---

## 8. Rate Limits

payOS enforces rate limits — HTTP 429 is returned when exceeded. Implement exponential back-off for retries.

---

## 9. Sandbox

Use sandbox credentials (obtained from my.payos.vn sandbox environment) to test without real transactions:

```dotenv
PAYOS_CLIENT_ID=your_sandbox_client_id
PAYOS_API_KEY=your_sandbox_api_key
PAYOS_CHECKSUM_KEY=your_sandbox_checksum_key
```

No separate sandbox base URL — same endpoint, different credentials.

---

## 10. Implementation Plan (next steps)

- [ ] `PayosService` — wraps `create_payment_link`, `cancel_payment_link`, `verify_signature!`
- [ ] `POST /webhooks/payos` controller — verify signature, update invoice status, idempotent
- [ ] Store `payos_payment_link_id` and `payos_checkout_url` on the `Invoice` model
- [ ] Add `PAYOS_*` keys to `backend/.env.example` and CI secrets
