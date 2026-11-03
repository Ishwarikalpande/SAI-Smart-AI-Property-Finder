# SAI – Smart AI Property Finder

**SAI** is a next-generation, AI-driven real estate discovery, investment analysis, and property search platform. Built with a unified **FastAPI** backend and modern **React (TypeScript + Vite + Tailwind/Shadcn)** frontend, SAI provides conversational search grounded strictly in verified database records across **exactly 8 Indian languages**, statistical investment predictions, interactive Leaflet geospatial maps, and enterprise-grade security (TOTP 2FA for Super Admin, RBAC, and secure file uploads).

---

## 📸 Visual Showcase & Screenshots

<div align="center">
  <h3>🏠 AI-Powered Discovery & Live Property Streams</h3>
  <img src="screenshots/02-home-landing.png" alt="SAI Home Page" width="90%" />
  <p><em>Conversational property search supporting voice and text in 8 Indian languages with dual live property streams.</em></p>
</div>

<br />

<div align="center">
  <h3>🗺️ Interactive Geospatial Map & Voice Finder</h3>
  <img src="screenshots/03-interactive-map.jpg" alt="Interactive Property Map" width="90%" />
  <p><em>Leaflet & OpenStreetMap geospatial integration with GPS targeting, verified property clusters, and voice queries.</em></p>
</div>

<br />

<div align="center">
  <h3>🛋️ 3D Virtual Walkthrough & Furnished Flat Tour</h3>
  <img src="screenshots/04-3d-virtual-tour.png" alt="3D Virtual Tour" width="90%" />
  <p><em>Interactive 360° room-by-room walkthrough with live navigation hotspots and detailed room specifications.</em></p>
</div>

<br />

<div align="center">
  <table>
    <tr>
      <td align="center" width="50%">
        <h4>🌐 Multilingual Onboarding (8 Languages)</h4>
        <img src="screenshots/01-language-selection.png" alt="Language Selection" width="100%" />
        <p><em>Instant language switching across English, Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, and Bengali.</em></p>
      </td>
      <td align="center" width="50%">
        <h4>🔐 Role-Based Authentication</h4>
        <img src="screenshots/05-role-login.png" alt="Role Selection Login" width="100%" />
        <p><em>Tailored authentication & workspaces for Buyers, Sellers, Agents, and Builders.</em></p>
      </td>
    </tr>
  </table>
</div>

---

## 🌟 Key Features

### 1. 🤖 Conversational AI Assistant (Qwen3 Grounded Engine)
- **Domain-Grounded Tool Calling**: Employs Qwen3 function-calling architecture to translate natural conversational queries into structured database queries.
- **Zero Hallucination Enforcement**: The AI never fabricates property listings, prices, or amenities. When no properties match criteria, it explicitly returns an empty property list accompanied by an informative, polite message in the user's selected language.
- **Strictly 8 Supported Languages**:
  1. English (`en`)
  2. Hindi (`hi`)
  3. Marathi (`mr`)
  4. Bengali (`bn`)
  5. Gujarati (`gu`)
  6. Tamil (`ta`)
  7. Telugu (`te`)
  8. Kannada (`kn`)
- **Intent Classification**: Handles Greetings, Property Search, Property Details, Side-by-Side Comparison, Investment Potential, Follow-ups, Mixed/Hinglish queries, Off-topic polite refusals, and Unclear queries across all 8 languages.

### 2. 🗺️ Interactive Property Map (Leaflet / OpenStreetMap)
- Zero-cost OpenStreetMap integration with dynamic pin clustering.
- Interactive popups displaying thumbnail image, title, price (Lakh/Crore format), BHK, and locality.
- Bidirectional synchronization with live property search results.

### 3. 📈 Investment Analysis & Side-by-Side Comparison
- **Statistical Valuation & ROI Modeling**: Calculates 3-year and 5-year expected appreciation, rental yields, price-per-square-foot benchmarks, and infrastructure boost factors (e.g. Pune Metro Line 3, Mumbai Metro).
- **Comparison Matrix**: Generates tabular comparisons between 2-4 properties highlighting price, area, amenities, transit proximity, and top recommendation rationale.

### 4. 🔒 Enterprise Security & Roles
- **Authentication**: JWT token-based auth with secure password hashing (bcrypt).
- **Two-Factor Authentication (TOTP)**: Super Admin login requires time-based one-time password verification (compatible with Google Authenticator, Microsoft Authenticator, and Authy).
- **Role-Based Access Control (RBAC)**: Distinct permissions for `BUYER`, `SELLER`, `AGENT`, and `SUPER_ADMIN`.
- **Media Upload Sanitization**: Validates file MIME types (JPEG, PNG, WebP), prevents path traversal, and enforces a 10MB maximum file size.
- **Audit Logging**: Logs administrative actions, status updates, and user role modifications.

---

## 🏗️ Architecture Overview

```
SAI-Figma-Test/
├── backend/                       # Single Authoritative FastAPI Backend
│   ├── app/
│   │   ├── ai/                    # Qwen3 tool calling, investment model & 8-lang detector
│   │   ├── api/                   # REST API routes (auth, properties, search, admin, upload)
│   │   ├── core/                  # App config, database session, security & dependencies
│   │   ├── models/                # SQLAlchemy models (User, Property, Enquiry, AuditLog)
│   │   └── schemas/               # Pydantic schemas for requests/responses
│   ├── tests/                     # 113 Pytest test suites (100% pass rate)
│   ├── uploads/                   # Upload storage for property images/documents
│   ├── seed.py                    # Database seeder (20 verified properties + default users)
│   ├── sai.db                     # Canonical SQLite database (PostgreSQL-ready)
│   └── requirements.txt
├── SAI-Figma-Test/                # Modern React + Vite Frontend
│   ├── src/
│   │   ├── api/                   # Axios client connected to http://127.0.0.1:8000
│   │   ├── components/            # UI components (PropertyMap, Chatbot, Cards, Navbar)
│   │   └── pages/                 # Pages (HomePage, SearchPage, AdminDash, BuyerDash, etc.)
│   └── package.json
├── docker-compose.yml             # Containerized deployment config
├── screenshots/                   # Application screenshots & visual showcase
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Ollama with `qwen2.5:7b` for local AI LLM inference

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate      # Windows
# source venv/bin/activate   # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run database seeder (seeds 20 properties and roles)
python seed.py

# Start the FastAPI server on port 8000
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation will be available at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 2. Frontend Setup (React + Vite)

```bash
cd SAI-Figma-Test

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend application will be live at `http://localhost:5173`.

---

## 🧪 Running Tests

The test suite contains **113 comprehensive tests** covering authentication, RBAC, CRUD operations, geospatial search, and the full 8-language × 10-scenario chatbot matrix:

```bash
cd backend
.\venv\Scripts\pytest.exe tests -v
```

Output:
```
113 passed in 65.30s (100% success rate)
```

---

## 👥 Default Test Accounts

All accounts are created with password: `Password123!`

| Role | Email | Capabilities |
|---|---|---|
| **Super Admin** | `admin@sai.in` | System configuration, user management, audit logs, listing approval, 2FA setup |
| **Buyer** | `buyer@sai.in` | Search, favorite properties, send enquiries, investment insights |
| **Seller** | `seller@sai.in` | Create and manage property listings, view seller dashboard |
| **Agent** | `agent@sai.in` | Manage client listings, lead inbox, contact prospective buyers |

---

## 🌐 Supported Languages API

Get supported languages programmatically:
```http
GET /api/ai/languages
```
Response:
```json
{
  "count": 8,
  "languages": [
    {"code": "en", "name": "English"},
    {"code": "hi", "name": "Hindi"},
    {"code": "mr", "name": "Marathi"},
    {"code": "bn", "name": "Bengali"},
    {"code": "gu", "name": "Gujarati"},
    {"code": "ta", "name": "Tamil"},
    {"code": "te", "name": "Telugu"},
    {"code": "kn", "name": "Kannada"}
  ]
}
```

---

## 🛡️ Security Best Practices

1. **Environment Variables**: Copy `backend/.env.example` to `backend/.env` and configure your `SECRET_KEY`, database credentials, and SMTP settings before production.
2. **Production Database**: For production deployments, switch `DATABASE_URL` to PostgreSQL with PostGIS extension (`postgresql+psycopg://user:password@host:5432/dbname`).
3. **CORS Configuration**: Restrict `CORS_ORIGINS` in production to your verified frontend domain names.
4. **Rate Limiting**: Rate limiting is enabled on sensitive endpoints (login, password reset, AI chat) to prevent abuse.
