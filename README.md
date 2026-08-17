# Wantace Config-Driven Roofing Estimator & Owner Panel

A responsive, mobile-first, config-driven roofing estimator wizard and owner administration dashboard built with **React (Vite)**, **Tailwind CSS**, **Node.js (Express)**, and **MongoDB**.

---

## Features

- **Strictly Config-Driven UI**: Zero hardcoded questions, labels, options, or multipliers in React components. All questions and options are dynamically fetched from `GET /api/config/active`.
- **Server-Side Pricing Engine**: Pricing calculations (`Base`, `Subtotal`, `Total`, `Range Low/High`) are strictly evaluated on the server via `POST /api/estimate`.
- **Mobile-First UX**: Step-by-step wizard with animated progress indicators, numeric range validation, unit badges (`sq ft`), and clear price range confirmation cards.
- **Owner Control Panel**: Protected `/admin` area featuring:
  - **Config Editor**: Toggle active questions, edit labels, update rates, pitch/story multipliers, and global business modifiers.
  - **Leads Viewer**: Searchable leads table with an expandable specs modal that gracefully handles legacy fields without crashing.

---

## Local Setup Instructions

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: Running locally on `mongodb://127.0.0.1:27017` or via a MongoDB Atlas connection string.

---

### 1. Clone & Environment Setup

```bash
git clone <repository-url>
cd wandee
```

#### Backend Environment Variables
Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/wandee_estimator
ADMIN_SECRET=admin_secret_key
```

---

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 3. Seed Database

Seed MongoDB with the default Roofing Configuration (Version 3) and sample historical leads:

```bash
cd backend
npm run seed
```

---

### 4. Run Application

Start both the backend server and frontend development server:

```bash
# Terminal 1: Backend Server (runs on http://localhost:5000)
cd backend
npm run dev

# Terminal 2: Frontend Vite App (runs on http://localhost:5173)
cd frontend
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## Owner Panel Credentials

- **URL**: `http://localhost:5173/admin`
- **Secret Key**: `admin_secret_key`

---

## API Endpoints Overview

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/config/active` | Fetch active questions for public estimator | Public |
| `POST` | `/api/estimate` | Submit homeowner answers & contact for calculation | Public |
| `GET` | `/api/admin/config` | Fetch full config schema (including inactive) | Bearer Admin |
| `PUT` | `/api/admin/config` | Update questions, rates, multipliers & modifiers | Bearer Admin |
| `GET` | `/api/admin/leads` | Fetch captured homeowner leads | Bearer Admin |

---

## Deployment URLs

- **Frontend App**: `http://localhost:5173` (or your deployed URL)
- **Backend API**: `http://localhost:5000/api`
