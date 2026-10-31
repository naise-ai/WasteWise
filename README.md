# 🌿 WasteWise — Canteen Food Waste Management Platform

**WasteWise** is a modern, full-stack food waste monitoring and optimization platform designed for institutional canteens and dining facilities. It helps canteen administrators monitor food waste, identify consumption patterns, track cost loss, and receive smart rule-based recommendations to reduce food waste.

---

## 🌟 Key Features

- 📊 **Real-time Analytics Dashboard** — Dynamic KPIs, area charts for waste trends, category breakdowns, and meal-wise waste metrics.
- 🎯 **Monthly Goals & Targets** — Progress tracking for waste percentage targets, daily cost loss limits, and reduction goals.
- 📝 **Daily Waste Logging** — Easy meal-wise food waste recording with automated cost calculation and severity classification (`Low`, `Moderate`, `High`, `Critical`).
- 🤝 **Food Rescue Network** — Canteens post safe surplus with pickup deadlines; registered NGOs and community partners reserve and confirm collections.
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
- **Database**: PostgreSQL in production; SQLite for local development
- **Authentication**: JWT Bearer Tokens with Bcrypt password hashing
- **Recommendation System**: Heuristic Rule Engine

### App packaging
- **Android**: Capacitor wrapper around the existing Vite/React app
- **Windows**: Electron desktop app packaged as a Windows NSIS installer

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

### 3. Hosted backend and web deployment

The FastAPI backend and persistent PostgreSQL database are configured together
in the Render Blueprint `render.yaml`. It uses paid Render plans (Starter web
service and Basic PostgreSQL) so production data is stored in a managed
database rather than ephemeral service storage.

1. Push the repository to GitHub and create a Render Blueprint from it.
2. In Render's protected environment-variable setup, configure
   `WASTEWISE_BOOTSTRAP_EMAIL` and `WASTEWISE_BOOTSTRAP_PASSWORD` for the first
   administrator. Use your own account email and a unique password of at least
   12 characters. Optionally set `WASTEWISE_BOOTSTRAP_NAME` and
   `WASTEWISE_BOOTSTRAP_CANTEEN`. Do not put these values in Git, the frontend,
   or a public issue. Render generates `JWT_SECRET_KEY`; `DATABASE_URL` is
   supplied by the Blueprint from the managed PostgreSQL database.
3. Deploy `wastewise-api` and copy its public Render URL (for example,
   `https://wastewise-api.onrender.com`).
4. For the hosted web UI, import the repository into Vercel with the repository
   root (the directory containing this `package.json`) as **Root Directory**,
   `npm run build` as the build command, and `dist` as the output directory.
   Set `VITE_API_URL` to the Render URL with no trailing slash, then redeploy.

The API is reachable over HTTPS by the web frontend and installed apps, so
users can sign in from different devices. Production startup creates only the
explicitly configured administrator; it does not seed the demo account or
sample records. Local development retains the demo seed described below.

### 4. Install the phone app (no APK required)

The frontend is also an installable Progressive Web App (PWA). After deploying
the frontend to an HTTPS URL and configuring it to use the hosted API, open that
URL in Chrome on Android, sign in, then select **Install app** from the browser
menu (or **Add to Home screen**). WasteWise will appear on the phone like an
app and open without the browser address bar. The frontend shell can open
offline after a first visit; API features still require an internet connection.

For a quick local preview on your phone, connect the laptop and phone to the
same Wi-Fi and run `npm run dev:lan` from the repository root. Open
`http://<laptop-ip>:5173` on the phone; find the laptop IP with `ipconfig` on
Windows. Keep the Vite terminal open. API requests are proxied by Vite to the
local backend on port 8000, so start that service too.

To install the PWA on the laptop during development, open `http://localhost:5173`
in Chrome or Edge and use the browser's **Install app** option. The service
worker is enabled on secure contexts such as localhost. A phone can preview the
LAN address over HTTP, but browsers do not allow PWA installation or service
workers from an ordinary `http://<laptop-ip>` address. To install it on the
phone, deploy the frontend to an HTTPS URL as described above, then open that
URL on the phone and choose **Install app** or **Add to Home screen**.

### 5. Android app (native APK)

Install Node.js/npm and Android Studio with an Android SDK. From the repository
root in PowerShell:

```powershell
npm ci
$env:VITE_API_URL = "https://your-wastewise-api.onrender.com"
npm run android:init       # First time only: builds the UI and creates android/
npm run android:sync       # Repeat after UI/config changes
npm run android:open       # Opens the native project in Android Studio
```

In Android Studio, allow Gradle sync to finish, select an emulator/device, and
run the app. To make an installable APK, use **Build > Build Bundle(s) / APK(s)
> Build APK(s)**. Android Studio will show the APK location. The app packages
the built UI and connects to the hosted backend; the phone does not need to run
the API locally.

### 6. Windows desktop installer

On Windows, from the repository root:

```powershell
npm ci
$env:VITE_API_URL = "https://your-wastewise-api.onrender.com"
npm run desktop:package
```

The script builds the UI and creates an NSIS installer under `release/`.
Run the generated `WasteWise Setup *.exe` to install it.
`npm run desktop:dev` builds and launches the desktop app without packaging an
installer.

---

## 🔐 Local demo credentials

| Field | Value |
|---|---|
| **Email** | `naise.shekhar@vsit.edu.in` |
| **Password** | `admin@123` |

Food rescue partner demo:

| Field | Value |
|---|---|
| **Email** | `rescue@wastewise.org` |
| **Password** | `rescue@123` |

Rescue partners can also create an organization account from the Rescue Partner sign-in tab.

These credentials are for local development/demo use only. They are not
provisioned in a Render production deployment. Configure production account
credentials through Render's protected environment-variable settings above.

---

## 📄 License

Distributed under the MIT License.
