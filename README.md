# 🚜 Smart Farmer Assistance Platform

A unified, real-time, ground-zero digital agriculture platform connecting **Farmers ↔ Procurement Centres ↔ Centre Managers ↔ Administrators**.

Designed for real-world agricultural operations across Indian APMC Mandis, the platform eliminates predatory middlemen, replaces physical gate queues with digital queue tokens, aggregates live government MSP and market prices, and delivers AI-powered agronomic guidance.

---

## 🌟 Key Features

### 👨‍🌾 Farmer Portal
- **Profile & Land Records**: Personal details, landholdings in acres, soil preferences, and multi-channel alert settings.
- **Profile Photo Upload**: Secure image upload with format/size validation and Cloudinary/local fallback.
- **Crop Cultivation Portfolio**: Full CRUD for crops, sowing dates, expected harvest windows, and estimated yield.
- **Digital Queue Token System**: Book slots at APMC procurement centres before leaving home. Receive unique token numbers (`T-YYYYMMDD-XXXX`).
- **Live Queue Tracker**: Real-time position tracking (`#1`, `#2`, `#3`), countdown of farmers ahead, and live estimated wait time via Socket.IO.
- **Interactive Procurement Locator**: Google Maps integration with driving directions, real-time silo capacity utilization, and intake speed monitoring.
- **MSP & Market Rates**: Official Government Minimum Support Prices approved by the CACP, daily APMC mandi arrivals from `data.gov.in`, and an instant **Crop Value Calculator** (`Quantity × MSP`).
- **AI Kisan Sahayak Suite**:
  - 🤖 **Context-Grounded Chatbot**: Converses with real database awareness of local centres, queue lengths, and weather.
  - 🌾 **AI Crop Recommender**: Tailors crop options by soil type, season, water availability, and land size.
  - 🔬 **Leaf Disease Doctor**: Multimodal plant pathology diagnosis from leaf photos with organic/chemical remedies.
  - 💧 **Smart Irrigation Advisor**: Combines crop growth stage with 7-day precipitation forecasts to prevent over-watering.
  - 🏢 **Optimal Centre Finder**: Algorithms score nearby centres balancing travel distance, queue wait, and available capacity.

### 🏢 Centre Manager Desk
- **Live Weighing Bay Console**: Real-time dashboard for calling waiting vehicles, initiating quality verification, and completing procurement.
- **Capacity & Processing Rate Slider**: Live adjustment of silo storage and intake speeds (Qtl/hour) broadcasting instantly over WebSocket to all farmers.
- **Queue Controls**: Pause/resume bay queue, call next, skip absent farmers, or cancel with audit trail.

### 🛡️ State Agriculture Administration Hub
- **Statewide Analytics**: Real database metrics for total farmers, active centres, pending requests, and silo fill percentages.
- **Farmers Directory**: Searchable registry with crop acreage oversight and account activation controls.
- **MSP Price Master**: Publish official government support prices with duplicate prevention (`Crop + Season + Marketing Year`).
- **Emergency Alert Broadcaster**: Push urgent weather advisories, pest warnings, and procurement notices.
- **Compliance Audit Trail**: Forensic audit log recording all price changes, queue overrides, and capacity modifications.

---

## 🏗️ Architecture & Tech Stack

```
smart-farmer-assistance/
├── client/                     # React 18 + TypeScript + Vite + Tailwind CSS + TanStack Query + Socket.IO Client
├── server/                     # Node.js + Express + TypeScript + Socket.IO + Prisma ORM
├── shared/                     # Shared DTOs, Enums, Socket Event Constants
├── prisma/
│   ├── schema.prisma           # 17-model PostgreSQL schema
│   └── seed.ts                 # Database seeding with CACP prices & APMC centres
├── .env.example
├── package.json
└── README.md
```

### Technologies Used
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router v6, Lucide React, Socket.IO Client.
- **Backend**: Node.js, Express.js, TypeScript, Socket.IO, Prisma ORM, Multer, Zod, JWT, bcryptjs.
- **Database**: PostgreSQL (Production/Hosted via Neon/Docker) with 17 relational models, enums, composite unique constraints, and foreign key cascades.
- **External Telemetry**:
  - **Weather**: Open-Meteo REST API (100% free, no API key required).
  - **Mandi Data**: Official `data.gov.in` Agmarknet API integration.
  - **Mapping**: Google Maps Platform with interactive coordinate directions.
  - **AI Engines**: Google Generative AI (Gemini 1.5 Flash) with agronomic contextual injection.
  - **Communications**: Twilio SMS, WhatsApp Cloud API, and in-app real-time socket events.

---

## 🗄️ Database Architecture (Prisma Models)

1. `User`: Core authentication entity with role-based access (`FARMER`, `PROCUREMENT_CENTRE_MANAGER`, `ADMIN`).
2. `FarmerProfile`: 1:1 profile extension storing bio, land area, and profile picture.
3. `Crop`: Master agricultural commodity catalog (Wheat, Paddy, Mustard, Cotton, etc.).
4. `FarmerCrop`: Specific crop planting records for each farmer's land.
5. `ProcurementCentre`: Physical purchase hubs with GPS coordinates, storage limits, and intake rates.
6. `CentreCrop`: Many-to-many relationship defining which crops each centre accepts and daily limits.
7. `CentreManager`: Assignment of authorized managers to procurement depots.
8. `ProcurementRequest`: Formal harvest procurement records.
9. `QueueToken`: Real-time digital queue token with sequential numbering, position, and statuses (`WAITING`, `CALLED`, `PROCESSING`, `COMPLETED`, `SKIPPED`, `CANCELLED`).
10. `Notification`: In-app notification inbox records.
11. `NotificationPreference`: User preferences for In-App, SMS, WhatsApp, and Web Push.
12. `GovernmentCropPrice`: Official CACP MSP price benchmarks with unique constraint `[cropName, season, marketingYear]`.
13. `MarketPrice`: Daily APMC mandi arrival records.
14. `WeatherRecord`: Historical and live agro-meteorological observations.
15. `Alert`: Emergency agricultural broadcasts by priority and location.
16. `AuditLog`: Immutable forensic compliance log tracking all system mutations.
17. `PushSubscription`: Web push notification subscriptions.

---

## ⚡ Getting Started Locally

### Prerequisites
- Node.js (v18 or v20+ recommended, v24 supported)
- npm (v9+)
- PostgreSQL database (Local or free cloud database from [Neon.tech](https://neon.tech))

### 1. Installation
Clone the repository and install all workspace dependencies from the root directory:
```bash
cd smart-farmer-assistance
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your database URL and secrets:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/smartfarmer?schema=public"
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters"
AI_PROVIDER=gemini
AI_API_KEY="your-google-ai-studio-gemini-key"
```

### 3. Database Migration & Seeding
Generate the Prisma Client, run migrations, and seed with real government CACP prices, APMC centres, and test accounts:
```bash
cd server
npx prisma generate
npx prisma db push
npm run prisma:seed
cd ..
```

### 4. Start Development Server
Run backend and frontend concurrently:
```bash
npm run dev:server
# In another terminal:
npm run dev:client
```
The application will be accessible at:
- **Client (Frontend)**: `http://localhost:5173`
- **Server (API & WebSocket)**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`

---

## 🔑 Pre-Seeded Test Credentials

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| 👨‍🌾 **Farmer** | `farmer.ramesh@smartfarmer.gov.in` | `Farmer@12345` | Manage crops, book queue tokens, track wait time, use AI |
| 🏢 **Manager** | `manager.karnal@smartfarmer.gov.in` | `Manager@12345` | Call farmers to bay, start weighing, adjust live silo capacity |
| 🛡️ **Admin** | `admin@smartfarmer.gov.in` | `Admin@12345` | Statewide statistics, MSP price publishing, audit logs |

*(One-click quick login buttons for these roles are conveniently provided on the `/login` screen).*

---

## 🌐 External Services Configuration

### 1. Weather (Open-Meteo)
- **Status**: 100% Free, open-access, zero API key required.
- Fetches real-time temperature, wind speed, relative humidity, and precipitation probability by coordinates.

### 2. Google Maps Platform
- Get a free key at [Google Cloud Console](https://console.cloud.google.com/).
- Enable **Maps JavaScript API** and **Directions API**.
- Set `GOOGLE_MAPS_API_KEY` in `.env`.
- If unset, the platform provides interactive geo-locator links directly to Google Maps navigation coordinates.

### 3. Google Gemini AI (Kisan Sahayak)
- Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
- Set `AI_PROVIDER=gemini` and `AI_API_KEY=your_key` in `.env`.
- Supports conversational agronomic advice, leaf disease image analysis, and crop recommendations.

### 4. Image Storage (Cloudinary)
- Register for a free account at [Cloudinary](https://cloudinary.com).
- Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
- If unset, the platform automatically stores uploaded photos securely on the local server in `/uploads`.

### 5. SMS & WhatsApp (Twilio)
- Optional: Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`.
- The application isolates SMS failures so that digital queues continue advancing seamlessly even during telecommunication outages.

---

## 🛡️ Security & Quality Standards
- **Role-Based Backend Authorization**: Guaranteed on the Express layer via `authenticate` and `requireRole` middlewares.
- **Strict Input Validation**: Every request payload is checked using type-safe Zod schemas.
- **Password Protection**: Passwords hashed with `bcryptjs` (salt rounds = 10); secrets never returned in API responses.
- **Audit Logging**: Every price update, capacity modification, and queue action is recorded with actor ID, role, and diff payload.
- **Honest States (Rule #2)**: Absolutely zero fake demo data. If weather, market feeds, or centres are empty, honest explanatory banners are rendered.

---

## 🚀 Production Build
```bash
# Build shared library, server, and client
npm run build

# Start production server
cd server
npm start
```
