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

---

## 🔐 Default Credentials

| Field | Value |
|---|---|
| **Email** | `naise.shekhar@vsit.edu.in` |
| **Password** | `admin@123` |

---

## 📄 License

Distributed under the MIT License.
