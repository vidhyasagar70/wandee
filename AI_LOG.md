# AI Development Log & Transparency Report

---

## 1. AI Tools Used

- **Cursor / Claude 3.5 Sonnet / Gemini 3.6 Flash**: Used for rapid component generation, backend API route scaffolding, and test suite execution.

---

## 2. What AI Was Used For

- **Form Scaffolding**: Generating initial React boilerplate for dynamic form element rendering (`number`, `select`, `radio`, `checkbox`).
- **Express & Mongoose Boilerplate**: Scaffolding basic CRUD route structures (`GET /api/config/active`, `POST /api/estimate`, `GET/PUT /api/admin/config`).
- **Data Seeding**: Generating realistic seed objects for Roofing Configuration v3 and mock historical homeowner leads.

---

## 3. Key Correction & Refactoring Event

> **Client-Side Calculation Rejection**:
> During initial scaffolding, the AI assistant attempted to calculate the estimate range directly inside the React frontend wizard (`EstimatorWizard.jsx`) to calculate live previews.
> 
> **Correction Implemented**:
> This approach was explicitly rejected because client-side pricing calculation exposes proprietary pricing multipliers and rates to end users via browser DevTools. The calculation logic was completely removed from the frontend and refactored into a pure server-side calculation service (`backend/services/calculator.js`), enforcing that all estimates are evaluated securely via `POST /api/estimate`.

---

## 4. What Was Handwritten & Substantially Verified

- **Defensive Data Coercion (`safeParseFloat`)**: Hand-crafted numerical coercion utilities handling string multipliers (`"1.12"`), empty strings, and missing schema variables safely without throwing runtime `NaN` errors.
- **Dynamic Answers UI Resilience**: Hand-written lead spec inspector in the Owner Dashboard that dynamically maps question keys to labels and gracefully renders legacy fields (`chimney_count`, `legacy_gutters`) without breaking layout.
- **Auth Guard Middleware**: Custom Express middleware handling both `Bearer` token and `Basic` auth header evaluation against environment secrets.
- **UI Aesthetics & Responsive Styling**: Polish of mobile-first card grids, progress bars, and modal overlays using Tailwind CSS.
