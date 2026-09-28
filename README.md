# 🌿 WasteWise — Canteen Food Waste Management Platform

**WasteWise** is a modern, full-stack food waste monitoring and optimization platform designed for institutional canteens and dining facilities. It helps canteen administrators monitor food waste, identify consumption patterns, track cost loss, and receive smart rule-based recommendations to reduce food waste.

---

## 🌟 Key Features

- 📊 **Real-time Analytics Dashboard** — Dynamic KPIs, area charts for waste trends, category breakdowns, and meal-wise waste metrics.
- 🎯 **Monthly Goals & Targets** — Progress tracking for waste percentage targets, daily cost loss limits, and reduction goals.
- 📝 **Daily Waste Logging** — Easy meal-wise food waste recording with automated cost calculation and severity classification (`Low`, `Moderate`, `High`, `Critical`).
- 📁 **Bulk CSV Import** — Drag-and-drop CSV parser with schema validation, error highlighting, and batch database import.
- 📄 **Branded PDF & CSV Reports** — Generate and export reports with custom date ranges, meal filters, charts, and key advisories.
- 💡 **Rule-Based Recommendation Engine** — Automated pattern analysis detecting overproduction, spoilage trends, and cost recovery opportunities.
- ⚙️ **Customizable Settings** — User profile management, target thresholds configuration, email/push notification alerts, and full Dark Mode engine.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript 5
- **Build Tool**: Vite 8
- **Styling**: Vanilla CSS Design System with CSS Custom Properties & HSL token scaling
- **Data Visualization**: Recharts
- **PDF Generation**: jsPDF
- **CSV Parsing**: PapaParse
- **Icons**: Lucide React

### Backend
- **Framework**: Python FastAPI
- **Server**: Uvicorn ASGI
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT Bearer Tokens with Bcrypt password hashing
- **Recommendation System**: Heuristic Rule Engine

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python seed.py               # Seed database with sample data & admin user
uvicorn main:app --reload    # Runs API on http://localhost:8000
```

### 2. Frontend Setup
```bash
npm install
npm run dev                  # Runs Web App on http://localhost:5173
```

### 3. Production Deployment

The frontend is a Vite app for Vercel; the FastAPI backend is configured as a
Render Blueprint in `render.yaml`.

1. Push this project to GitHub.
2. In Render, create a new Blueprint from the repository and deploy the
   `wastewise-api` service. Copy its public URL, such as
   `https://wastewise-api.onrender.com`.
3. In Vercel, import the same repository. Set **Root Directory** to the
   repository root containing this `package.json` (not `backend/`). Use the
   Vite framework preset, `npm run build` as the build command, and `dist` as
   the output directory.
4. In the Vercel project's environment variables, set
   `VITE_API_URL` to the Render service URL, with no trailing slash. Apply it
   to Production and Preview, then redeploy.

The Vercel frontend cannot reach `localhost:8000` on your computer. The
backend seeds an empty database with the demo account and sample data on
startup. Once both services are live, share the Vercel deployment URL and the
default login below with your viewer.

---

## 🔐 Default Credentials

| Field | Value |
|---|---|
| **Email** | `naise.shekhar@vsit.edu.in` |
| **Password** | `admin@123` |

---

## 📄 License

Distributed under the MIT License.
