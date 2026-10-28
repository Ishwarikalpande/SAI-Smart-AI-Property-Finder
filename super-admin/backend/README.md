# SAI Super Admin Dedicated Gateway

This service provides an isolated administrative microservice entrypoint for the **Smart AI Property Finder** Super Admin Console.

## Features
- Runs on port `8001` (or integrated via main FastAPI on `8000`)
- Strict CORS configuration for Super Admin UI on `http://localhost:5174`
- Role-based authorization: Enforces `role == "super_admin"` via JWT bearer tokens
- Full access to administrative endpoints:
  - `/api/admin/auth/*`: Admin login and TOTP 2FA challenge/verification
  - `/api/admin/dashboard`: Live DB telemetry & counts
  - `/api/admin/users`: User suspension, deletion, and role filtering
  - `/api/admin/properties`: Listing approval, rejection, suspension, and featured toggles
  - `/api/admin/documents`: OCR document validation & verification workflow
  - `/api/admin/kyc`: Centralized KYC identity queue & statistics
  - `/api/admin/rera`: RERA registration verification and registry lookup
  - `/api/admin/complaints`: Grievance dispute resolution & internal notes
  - `/api/admin/ai/*`: Multilingual Qwen telemetry & hyperparameter tuning
  - `/api/admin/analytics`: Date-filtered metrics (Today, 7D, 30D, 90D, 1Y)
  - `/api/admin/notifications/*`: Broadcast composer & push delivery
  - `/api/admin/settings`: Platform config key-value store
  - `/api/admin/content/*`: CMS for banners, categories, announcements, FAQs
  - `/api/admin/audit-logs`: Immutable audit trail

## Running the Dedicated Service

```powershell
# From project root:
backend\venv\Scripts\python super-admin\backend\main.py
```
Or use the npm script:
```bash
npm run admin:backend
```
