# SAI – Smart AI Property Finder: Project Facts & Placeholders Checklist

**Academic Session:** 2025–2026  
**Institution:** P. R. Pote Patil College of Engineering & Management, Amravati (Autonomous Institute affiliated to Sant Gadge Baba Amravati University)  
**Department:** Department of Artificial Intelligence and Data Science (AI&DS)  
**Degree:** Bachelor of Engineering / Bachelor of Technology in Artificial Intelligence and Data Science  
**Document:** Final Year Project B.Tech Thesis Deliverable  

---

## 1. Verified Technical Facts (Codebase Ground Truth)

All technical claims made in this thesis are grounded strictly in the verified source code in the repository `g:\SAI\SAI-Figma-Test`:

| Category | Verified Parameter / Technology | Codebase Location & Artifacts |
|---|---|---|
| **Project Title** | SAI – Smart AI Property Finder | `README.md`, `backend/app/main.py` |
| **Backend Framework** | Python 3.11+, FastAPI 0.115.0+, Uvicorn Asynchronous Gateway | `backend/requirements.txt`, `backend/app/main.py` |
| **Database Tier** | PostgreSQL (Production) / Canonical SQLite (`sai.db`), SQLAlchemy 2.0+ ORM, Alembic | `backend/app/core/config.py`, `backend/app/models/` |
| **AI LLM Engine** | Qwen3 (`qwen2.5:7b` / `qwen3:4b`) via local Ollama inference server (`http://localhost:11434`) | `backend/app/ai/qwen_client.py`, `backend/app/core/config.py` |
| **Tool Calling Architecture** | Domain-grounded function calling (`search_properties`, `compare_properties`, `analyze_investment`, `search_near_location`) | `backend/app/ai/tools.py`, `backend/app/ai/chat_service.py` |
| **Supported Languages** | Exactly 8 Indian Languages: English (`en`), Hindi (`hi`), Marathi (`mr`), Bengali (`bn`), Gujarati (`gu`), Tamil (`ta`), Telugu (`te`), Kannada (`kn`) | `backend/app/ai/language_service.py`, `test_ai_production.py` |
| **Zero-Hallucination Policy** | Enforced programmatic check: if database search yields 0 matches, AI returns explicit polite empty response without fabricating properties | `backend/app/ai/chat_service.py`, `backend/app/ai/tools.py` |
| **Frontend Framework** | React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI primitives | `SAI-Figma-Test/package.json`, `SAI-Figma-Test/src/App.tsx` |
| **Geospatial Mapping** | Leaflet.js with OpenStreetMap (OSM) tile server and custom marker clustering | `SAI-Figma-Test/src/app/components/PropertyMap.tsx` |
| **Distance Computation** | Haversine Great-Circle Spherical Trigonometry Formula ($R = 6371\text{ km}$) | `backend/app/ai/tools.py` (`haversine_distance`) |
| **Investment Forecaster** | Statistical 3-Year and 5-Year CAGR valuation model, gross rental yields, and transit infrastructure multipliers | `backend/app/ai/investment_analysis.py` |
| **User Roles (RBAC)** | 5 Defined Roles: `buyer`, `seller` (displayed as Owner), `agent`, `builder`, `super_admin` | `backend/app/models/user.py` (`UserRole`) |
| **Security Standards** | Bcrypt password hashing, JWT Bearer tokens (1440 min expiry), RFC 6238 TOTP 2FA for Super Admin, MIME sanitization | `backend/app/core/config.py`, `backend/app/models/user.py` |
| **Super Admin Gateway** | Dedicated isolated microservice running on port 8001 | `super-admin/backend/main.py`, `super-admin/frontend` |
| **Verification & RERA** | Title deed inspection, SHA-256 integrity hash, automated OCR check structure, RERA registry cross-verification | `backend/app/models/verification.py`, `rera.py` |
| **3D Tour & Building** | Three.js interactive building viewer, floor and unit booking, room walkthrough engine | `backend/app/models/project.py`, `property_walkthrough.py` |
| **Automated Test Suite** | 147 Total Pytest Test Cases (146 passed, 1 unit test camera_path schema alignment noted) | `backend/tests/` (executed via Pytest 8.0+) |

---

## 2. Feature Implementation Status Matrix

| Subsystem / Feature | Status | Notes & Verification Reference |
|---|---|---|
| JWT Authentication & Password Hashing | **Implemented & Verified** | Full pass in `test_auth.py` and `test_roles.py` |
| Super Admin TOTP 2FA Verification | **Implemented & Verified** | RFC 6238 time-based tokens verified in `test_email_otp.py` |
| 8-Language NLP Detector & Lexical Parser | **Implemented & Verified** | Unicode range & lexical marker matrix verified in `test_ai_production.py` |
| Qwen3 Grounded Function Tool Calling | **Implemented & Verified** | Function schemas defined; tested with mock and live Ollama |
| Zero-Hallucination Guardrail Check | **Implemented & Verified** | Empty database search returns explicit empty message in target language |
| Multi-Criteria Property Search & Filter | **Implemented & Verified** | Verified in `test_search.py` and `test_properties.py` |
| Haversine Nearby Radius Discovery | **Implemented & Verified** | Accurate within floating point spherical radius in `tools.py` |
| Statistical Investment CAGR / Yield Model | **Implemented & Verified** | Locality benchmarks (Baner 9.5%, Kharadi 10.0%, etc.) in `investment_analysis.py` |
| Leaflet Geospatial Interactive Map | **Implemented & Verified** | Implemented in `PropertyMap.tsx` with dynamic pin synchronization |
| Role-Based Portals (Buyer, Owner, Agent, Builder) | **Implemented & Verified** | Verified in `App.tsx`, `AgentPortal.tsx`, `BuilderPortal.tsx` |
| Super Admin Console (Port 8001 Gateway) | **Implemented & Verified** | 19 administrative pages verified in `super-admin/frontend/src/pages/` |
| Document Upload & SHA-256 Hashing | **Implemented & Verified** | Enforces 10MB limit, mime checking, and sha256 checksum in `verification.py` |
| RERA Registry Cross-Verification Schema | **Implemented & Verified** | Table `rera_registrations` with promoter and validity checks in `rera.py` |
| 3D Building Floor & Unit Grid Booking | **Implemented & Verified** | Atomic unit reservation verified in `test_building_3d.py` |
| 3D Room Walkthrough Camera Path | **Partially Implemented** | Walkthrough rooms operational; `camera_path` schema alignment noted in test |
| Real-time WebRTC / Socket.io Audio STT | **Planned Future Scope** | Web Speech API implemented; full duplex streaming planned |
| Automated MahaRERA Portal Web Scraper | **Planned Future Scope** | Database schema ready; automated live scraper planned for future release |

---

## 3. Placeholders Checklist (Student Action Required)

Before final submission to the examination panel at PRPCEM, the student must update the following bracketed placeholders in `SAI_Smart_AI_Property_Finder_Thesis.docx`:

### A. Academic & Institutional Placeholders
- `[NAME OF STUDENT 1]` : Full Name of Student 1 (e.g., Mr. Lovesh Bodhani / Student Lead)
- `[ROLL NO 1]` : University Roll Number of Student 1
- `[NAME OF STUDENT 2]` : Full Name of Student 2
- `[ROLL NO 2]` : University Roll Number of Student 2
- `[NAME OF STUDENT 3]` : Full Name of Student 3
- `[ROLL NO 3]` : University Roll Number of Student 3
- `[NAME OF STUDENT 4]` : Full Name of Student 4
- `[ROLL NO 4]` : University Roll Number of Student 4
- `[NAME OF PROJECT GUIDE]` : Full Name of Faculty Project Guide (e.g., Prof. / Dr. [Guide Name])
- `[GUIDE DESIGNATION]` : Official Designation (e.g., Assistant Professor, Dept. of AI&DS)
- `[NAME OF HOD]` : Full Name of Head of Department, AI&DS (e.g., Dr. [HOD Name])
- `[NAME OF PRINCIPAL]` : Full Name of Principal, PRPCEM (e.g., Dr. P. M. Jawandhiya)
- `[SUBMISSION DATE]` : Date of Official Submission (e.g., May 2026)
- `[INTERNAL EXAMINER SIGNATURE & DATE]` : Sign and date by appointed internal examiner
- `[EXTERNAL EXAMINER SIGNATURE & DATE]` : Sign and date by university appointed external examiner

### B. Empirical & Benchmark Measurement Placeholders
In accordance with academic integrity guidelines, unmeasured benchmarks are marked with placeholders so students can record actual lab hardware observations:
- `[ADD VERIFIED API LATENCY TEST RESULT]` : Measure average GET `/api/properties` response time under 100 concurrent requests (e.g., `42 ms ± 6 ms`).
- `[ADD VERIFIED LLM INFERENCE TIME]` : Measure Qwen3 token generation latency on your local workstation (e.g., `1.85 seconds for 120 tokens`).
- `[ADD VERIFIED MEMORY CONSUMPTION]` : Record RAM utilization of FastAPI + Uvicorn process (e.g., `148 MB at idle, 312 MB under load`).
- `[ADD VERIFIED DATABASE QUERY BENCHMARK]` : Record execution time for spatial radius search over 1,000 indexed records (e.g., `8.4 ms`).

### C. Live Screenshot Replacements
The thesis document contains high-resolution annotated screenshot placeholder cards in Chapter 4, Chapter 5, and Appendix A. If desired, students may take live screenshots of the running web application (`http://localhost:5173` and `http://localhost:5174`) and replace the cards:
1. **Screenshot 4.1**: Capture landing page hero search and language selector at `http://localhost:5173`.
2. **Screenshot 4.2**: Open the Sign-Up modal, choose a role, and capture the form.
3. **Screenshot 4.3**: Open the Login modal, input credentials, and capture the TOTP 2FA challenge screen.
4. **Screenshot 4.4**: Log in as `buyer@sai.in` and capture the Buyer dashboard with saved favorites.
5. **Screenshot 4.5**: Log in as `seller@sai.in` and capture the Owner listing table.
6. **Screenshot 4.6**: Log in as `agent@sai.in` and capture the Agent lead inbox.
7. **Screenshot 4.7**: Log in as `builder@sai.in` and capture the Builder tower/unit allocation matrix.
8. **Screenshot 4.8**: Log in to `http://localhost:5174` as Super Admin (`admin@sai.in`) and capture the telemetry dashboard.
9. **Screenshot 5.1**: Navigate to the Search page, toggle the Leaflet Map view, and capture the clustered pins.
10. **Screenshot 5.2**: Select 2-3 properties and capture the Side-by-Side Comparison modal.
11. **Screenshot 5.3**: Open the AI Chatbot modal, type a query in Marathi or Hindi, and capture the response cards.
12. **Screenshot 5.4**: In Super Admin console, open the Documents queue and capture the OCR review pane.
13. **Screenshot 5.5**: On a 3D-enabled property, open the 3D Walkthrough modal and capture the Three.js room view.
14. **Screenshot 5.6**: On property details, scroll down to the Nearby Facilities section and capture the distance list.
15. **Screenshot 5.7**: In Super Admin console, navigate to Audit Logs and capture the administrative event log table.
16. **Screenshot A.1**: Capture the sample JSON API response from `GET /api/properties/1` in Postman or Swagger UI.

### D. Appendix G: Publication and Certificate Placeholders
- `[CONFERENCE / JOURNAL NAME]` : Insert title of research journal or conference (e.g., International Journal of Scientific Research in Engineering and Management - IJTI).
- `[PAPER TITLE]` : E.g., *"SAI: A Domain-Grounded Multilingual Conversational Framework and Geospatial Intelligence Engine for Real Estate Discovery"*.
- `[PAPER REGISTRATION ID / DOI]` : Insert assigned DOI or paper ID.
- `[INSERT SCANNED ACCEPTANCE CERTIFICATE]` : Paste scanned publication certificate image if applicable.

---
*Report compiled in strict accordance with the academic guidelines of PRPCEM Amravati and Sant Gadge Baba Amravati University.*
