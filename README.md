# Wantace Config-Driven Roofing Estimator & Owner Panel

> **The 24-Hour Build: SDE Intern Take-Home Task Submission**  
> A high-performance, mobile-first, config-driven roofing estimate wizard and owner management panel. Built using **React (Vite)**, **Tailwind CSS**, **Node.js (Express)**, and **MongoDB**.

---

## 🌐 Live Production URLs

- **Public Estimator Wizard**: [https://wandee.vercel.app/](https://wandee.vercel.app/)
- **Owner Panel / Admin Dashboard**: [https://wandee.vercel.app/admin](https://wandee.vercel.app/admin)
- **Backend API Service**: [https://wandee.onrender.com](https://wandee.onrender.com)

---

## 🔑 Test Credentials (Marcus & Dale Access)

- **Admin Secret Key / Password**: `admin_secret_key`
- **Authentication Method**: Token-based secret key gate on frontend & HTTP `Bearer` / `Basic` auth header check on backend routes (`/api/admin/*`).

---

## 🚀 Project Overview & Architecture

The application is architected around a strict **Config-Driven Pattern** to empower business owners (like Dale) to update pricing, questions, and material rates in real time without needing code deployments:

1. **Frontend (React + Vite + Tailwind CSS)**:
   - **Zero Hardcoded Schema**: All questions, labels, options, rates, units, and multipliers are dynamically fetched at runtime from `GET /api/config/active`.
   - **Step-by-Step Estimator Wizard**: Responsive UI featuring live progress tracking, numeric boundary validation, unit badges (`sq ft`), and instant calculation results.
   - **Owner Administration Panel**: Protected `/admin` interface for editing questions, material rates, pitch/story multipliers, and viewing captured homeowner leads.

2. **Backend API (Node.js + Express + MongoDB / Mongoose)**:
   - **Server-Side Pricing Engine**: Pricing calculations (`Base`, `Subtotal`, `Total`, `Range Low/High`) live strictly on the server in `POST /api/estimate` to prevent client-side manipulation.
   - **Defensive Type Normalization**: String multipliers (e.g. `"1.12"`) in seed/database schemas are safely parsed via `safeParseFloat()` before computation.
   - **Dynamic Historical Leads Storage**: Homeowner estimates are stored with non-strict schemas to render legacy lead specs (e.g. `config_version: 1` with fields like `chimney_count` or `gutter_replace`) gracefully without runtime errors.

---

## 🛠️ Local Setup Guide (Fresh Git Clone)

### Prerequisites

- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI.

---

### Step 1: Clone Repository

```bash
git clone https://github.com/vidhyasagar70/wandee.git
cd wandee
```

---

### Step 2: Configure Environment Variables

#### Backend `.env` (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/wandee_estimator
ADMIN_SECRET=admin_secret_key
```

#### Frontend `.env` (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### Step 3: Install Dependencies

```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

---

### Step 4: Seed Database

Populate MongoDB with the default Roofing Configuration (Version 3) and sample historical leads:

```bash
cd ../backend
npm run seed
```

---

### Step 5: Start Development Servers

Run backend and frontend servers concurrently:

```bash
# Terminal 1: Start Node/Express API Server (http://localhost:5000)
cd backend
npm run dev

# Terminal 2: Start React/Vite Frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/config/active` | Fetches active question schema for public wizard | None (Public) |
| `POST` | `/api/estimate` | Validates answers, executes pricing engine, saves lead | None (Public) |
| `GET` | `/api/admin/config` | Fetches complete config schema (includes inactive questions) | `Bearer <ADMIN_SECRET>` |
| `PUT` | `/api/admin/config` | Updates questions, rates, multipliers, global modifiers | `Bearer <ADMIN_SECRET>` |
| `GET` | `/api/admin/leads` | Retrieves captured homeowner leads sorted by date | `Bearer <ADMIN_SECRET>` |
| `GET` | `/health` | API health check & MongoDB connection status | None (Public) |

---

## 🧪 Verification & Testing Commands

```bash
# Verify backend server syntax & health
cd backend
npm start

# Verify frontend build & bundle optimization
cd frontend
npm run build
```
