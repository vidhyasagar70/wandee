# AI Assistance Log & Engineering Transparency Report

This document provides a transparent account of how AI assistance was leveraged during the development of the **Wantace Config-Driven Estimator & Owner Panel**, detailing tool usage, scaffolding assistance, critical human overrides, and verified custom logic.

---

## 1. Tools Used

- **Cursor IDE / Claude 3.5 Sonnet / ChatGPT**: Utilized for initial route scaffolding, Mongoose schema definitions, Tailwind CSS layout framing, and initial markdown generation.

---

## 2. What AI Was Used For

- **API Endpoint Scaffolding**: Initial skeleton for Express routes (`GET /api/config/active`, `POST /api/estimate`, `GET/PUT /api/admin/config`).
- **Mongoose Schema Drafts**: Drafting baseline schemas for `Config` (versioning, questions, modifiers) and `Lead` (captured answers, contact details, estimates).
- **Tailwind Component Framing**: Generating initial UI layouts for step-by-step wizard containers, modal dialogs, and responsive table structures.

---

## 3. Specific Disagreements & Critical Corrections

### 🚨 Critical Correction: Client-Side Pricing Calculation Rejection

#### AI Proposal:
During initial component scaffolding of `EstimatorWizard.jsx`, the AI generated client-side calculation logic inside a `useMemo` hook to update and display quote ranges live on the client browser while the user filled out form fields.

#### Human Review & Rejection:
This proposal was explicitly **rejected** during architecture review for two core engineering reasons:
1. **Business Logic & Security Violation**: Calculating prices on the frontend exposes proprietary material rates, tear-off costs, and pitch multipliers to end users via browser developer tools.
2. **Rejection Criteria Check**: The Wantace specification explicitly mandates that *all pricing formulas and calculations must live strictly on the backend API and cannot be manipulated or executed on the client*.

#### Resolution Implemented:
The client-side calculation logic was completely purged from the frontend. The entire calculation engine was rewritten into an isolated, pure server-side service (`backend/services/calculator.js`). The frontend wizard was refactored to submit answers via `POST /api/estimate`, receiving the final calculated price range back from the server.

---

## 4. Human Ownership & Manual Code Engineering

The following critical components were handwritten, debugged, and manually verified:

1. **Defensive Float Normalization (`safeParseFloat`)**:
   - Wrote safe coercion utilities in `calculator.js` to parse string multipliers (e.g. `"1.12"`) from seed data and user input without throwing runtime `NaN` errors.

2. **Legacy Leads Rendering Guard (`renderLeadAnswers`)**:
   - Engineered the dynamic answer inspector in `OwnerDashboard.jsx` using `Object.entries()` to dynamically render legacy fields (e.g. `config_version: 1` with keys like `chimney_count` or `gutter_replace`) gracefully with custom field badges without crashing the UI.

3. **Multi-Format Authentication Middleware (`middleware/auth.js`)**:
   - Implemented custom auth middleware supporting both HTTP `Bearer` token and `Basic` auth header formats against `process.env.ADMIN_SECRET`.

4. **Mobile Responsiveness & Step Validation**:
   - Hand-crafted step transition validation, error state clearance, and mobile touch targets across wizard and dashboard screens.
