# Overview

Diabetes 360 (HealthSync) is a full-stack health management platform for diabetes care. It connects patients with physicians, tracks health metrics (blood sugar, heart rate, exercise, nutrition), provides AI-powered dietary analysis and chatbot assistance, and supports appointment booking with video consultations. The application serves three user roles: Customer (patient), Physician (doctor), and Admin.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Project Structure

Monorepo with three main directories:

- `client/` — React frontend (Vite build)
- `server/` — Express.js backend (TypeScript, ESM)
- `shared/` — Shared schema definitions re-exported from server modules
- `migrations/` — Drizzle ORM SQL migration files
- `scripts/` — Utility scripts (Swagger doc generation)

## Frontend Architecture

Built with React 18, Vite, TypeScript, and Tailwind CSS. Uses a feature-based folder structure under `client/src/`.

**Routing**: Wouter — routes defined in `client/src/config/routes.ts`
**Server state**: TanStack Query v5 (object-form API only)
**Client state**: Zustand with persistence (`authStore`, `appStore`)
**API layer**: Axios with interceptors for JWT token refresh (`client/src/utils/httpClient.ts`)
**UI components**: shadcn/ui (Radix primitives) + Lucide icons
**Forms**: React Hook Form + Zod validation via `@hookform/resolvers`

### Key directories

- `client/src/features/auth/pages/` — Login, SignUp, ForgotPassword, ResetPassword, VerifyEmail
- `client/src/features/dashboard/customer/pages/` — Home, Dashboard, HealthAssessment, LogHistory, StrengthTrainingProgress, InstantConsultation, FindDoctor, FoodScanner, DiaBot, MedicalRecords, Medications, Payments, ProfileData
- `client/src/features/dashboard/doctor/` — DoctorHome, DoctorAppointments, DoctorPatients, PatientProfile, PatientAlerts
- `client/src/features/dashboard/components/` — BookingCalendar, DoctorCard, PaymentScreen, HealthTrendChart, GlucoseChartSection, NutritionProgressBar, FoodOverview, ScanningAnimation
- `client/src/components/ui/` — Base Radix UI components (button, card, dialog, input, tabs, etc.)
- `client/src/components/layout/` — Sidebar (role-based navigation)
- `client/src/components/auth/` — ProtectedRoute (permission-based access control)
- `client/src/hooks/mutations/` — useLogin, useLogout, useSignup, useTwoFactor, useBooking, useFoodScanner, useHealth, useMedical, useChat, useAdmin, usePhysician, usePatients
- `client/src/services/` — authService, bookingService, healthService, foodScannerService, notificationsService, etc.
- `client/src/stores/` — authStore (user/tokens/isAuthenticated), appStore (mealInfo, medicationInfo)
- `client/src/lib/` — Firebase Cloud Messaging config, QueryClient setup

## Backend Architecture

Express.js server with TypeScript and ESM modules. Entry point: `server/index.ts`. Configuration in `server/src/app/config/index.ts`.

### Module Pattern (Controller-Service-Repository)

All 15 backend modules live in `server/src/modules/` and follow a consistent structure:

| Module | Purpose |
|--------|---------|
| `admin` | User management, physician/customer data CRUD, system toggles |
| `auth` | Registration, login, email verification, password reset |
| `booking` | Physician availability, slot management, appointment booking |
| `chat` | AI-powered DiaBot chat, audio transcription, message history |
| `common` | Static data retrieval (roles, specialties, lookup lists) |
| `customer` | Customer profiles, health targets, consultation quotas |
| `food` | Food image scanning (AI), meal logging, nutrition tracking, recipes |
| `health` | Blood sugar, heart rate, exercise logs, daily quick logs, insights |
| `medical` | Medications, lab report uploads (PDF storage) |
| `notifications` | Push notifications via FCM, glucose alerts, automated reminders |
| `physician` | Physician profiles, specialties, locations, ratings, patient management |
| `seeding` | Database seed scripts (default settings, time zones, slot types) |
| `settings` | Free/paid tier limits, scan limits, app configuration |
| `twoFactor` | 2FA setup, TOTP generation, QR codes, backup codes |
| `user` | User profile retrieval and basic user operations |

### Shared Infrastructure (`server/src/shared/`)

- **Middleware**: `auth.ts` (JWT guard), `errorHandler.ts` (centralized error handling)
- **Services**: `ai.service.ts` (external AI API), `email.service.ts` (SendGrid), `zoom.service.ts` (Zoom meeting links), `timeZone.service.ts`, `cron-job.service.ts`
- **Utilities** (`server/src/shared/utils/`): `jwt.ts`, `cacheManager.ts` (node-cache), `utils.ts` (DateManager)

### Cron Jobs (registered in `server/index.ts`)

- Daily health summary generation (midnight)
- Daily chat memory extraction (midnight)
- Zoom meeting link processing (every 5 min)
- Inactivity push notifications (8:15 AM daily)
- Meeting reminders (every 5 min, 10-min lookahead)

### API Routes

All routes prefixed with `/api`. Route registration in `server/src/app/routes.ts`. Swagger docs available via `swagger-jsdoc` + `swagger-ui-express`.

## Database Architecture

PostgreSQL via Neon serverless (`@neondatabase/serverless`). Schema managed with Drizzle ORM (`drizzle-orm` + `drizzle-zod`). Migrations in `migrations/`. Push schema with `npm run db:push`.

### Core Tables & Relationships

**Users & Auth**
- `users` — id, email, password, role (customer/admin/physician), paymentType, timeZoneId
- `customer_data` — health profile (one-to-one with users)
- `physician_data` — specialty, fees (one-to-one with users, references physician_specialties)
- `physician_locations` — practice locations (many-to-one with users)

**Health & Metrics**
- `health_metrics` — daily blood sugar, heart rate logs (many-to-one with users)
- `exercise_logs` — physical activity records (many-to-one with users)
- `health_metric_targets` — admin-set or user-specific goals
- `daily_quick_logs` — daily snapshots of exercise, diet, sleep, stress

**Booking & Consultations**
- `availability_date` — physician availability dates
- `slots` — time slots within availability dates
- `booked_slots` — actual appointments (references customer, slot, slot_type)
- `slot_locations` — junction table linking slots to physician locations

**Medical Records**
- `medications` — prescriptions (references patient, physician, booked_slot)
- `lab_reports` — uploaded medical documents (many-to-one with users)

**Nutrition & Food**
- `logged_meals` — nutrition data from food scans (many-to-one with users)
- `daily_meal_plans` + `meal_plan_meals` — AI-generated meal plans

**AI Chat & Insights**
- `chat_messages` — DiaBot conversation history (many-to-one with users)
- `chat_memories` — AI-extracted context from conversations
- `user_emotional_state` — mood/confidence tracking

**Settings**
- `free_tier_limits` — tier-based feature limits
- `food_scan_limits` — scan usage tracking

Schema definitions are spread across `server/src/modules/*/models/*.schema.ts` and re-exported through `shared/schema.ts`.

## Authentication Strategy

- **Password hashing**: bcrypt (10 rounds)
- **Token-based auth**: JWT access tokens (configurable expiry, default 15 min) + refresh tokens (default 7 days)
- **2FA**: Speakeasy TOTP + QRCode generation + backup codes
- **Client-side**: Zustand auth store with localStorage persistence, Axios interceptors for automatic token refresh

## External Dependencies & Integrations

- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Email**: SendGrid (`@sendgrid/mail`) — verification codes, notifications
- **AI Service**: External AI API (configurable via `AI_BASE_URL`) — food scanning, chat, health summaries
- **Video Calls**: Zoom API — meeting link generation for consultations
- **Push Notifications**: Firebase Admin SDK + Firebase Cloud Messaging
- **Food Analysis**: Passio API (`PASSIO_API_KEY`)
- **Maps**: Google Maps (`@vis.gl/react-google-maps`) — physician locations
- **Geocoding**: OpenCage API — location lookups

## Environment Variables

Key environment variables (configured in `server/src/app/config/index.ts`):

- `PORT` — Server port (default: 5000)
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — JWT signing secret
- `SENDGRID_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME` — Email service
- `AI_BASE_URL` — External AI service endpoint
- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET` — Zoom integration
- `PASSIO_API_KEY` — Food analysis service
- `FIREBASE_ADMIN_SDK_PRIVATE_KEY` — Push notifications
- `FRONTEND_URL` — Frontend URL for email links
- `ACCESS_TOKEN_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN` — Token lifetimes

## Development Workflow

- **Dev command**: `npm run dev` — runs `cross-env NODE_ENV=development tsx watch server/index.ts`
- **Server port**: 5000 (configured for Replit webview)
- **Hot reload**: Vite HMR in development mode (integrated via `server/vite.ts`)
- **Build**: `npm run build` — lints server, builds client via Vite, bundles server via esbuild
- **Production**: `npm run start` — runs `node dist/index.js`
- **Database sync**: `npm run db:push` — pushes Drizzle schema to PostgreSQL
- **Seed data**: `npm run seed` — runs `server/src/modules/seeding/seed.ts`
- **Swagger docs**: `npm run swagger:generate`
- **Linting**: Biome (`npm run lint`)
- **Formatting**: Biome (`npm run format`)

## Deployment

- **Target**: Autoscale
- **Build command**: `npm run build` (lints server, builds client via Vite, bundles server via esbuild as ESM)
- **Run command**: `node ./dist/index.cjs` (configured in `.replit`)
- **Production start script**: `cross-env NODE_ENV=production node dist/index.js`
- **Note**: The esbuild step produces ESM output (`--format=esm`) to `dist/index.js`. The `.replit` deploy config references `dist/index.cjs` — verify this matches the actual build output before deploying.
