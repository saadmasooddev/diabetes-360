# Overview

HealthSync/Diabetes 360 is a full-stack health tracking web application designed for managing diabetes-related health data. It features a robust authentication system and an interactive dashboard for visualizing health metrics. The application aims to provide a comprehensive platform for users to track their health, access resources, and connect with healthcare services, ultimately supporting better diabetes management. It uses React, Express, PostgreSQL, and a monorepo structure with TypeScript and shadcn/ui.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Project Structure

The application uses a monorepo structure with `client/` for the React frontend, `server/` for the Express.js backend, and `shared/` for common types and utilities, ensuring consistent data models across the stack.

## Frontend Architecture

The frontend is built with React, Vite, TanStack Query for server state management, Wouter for routing, and Zustand for client state. UI components are from shadcn/ui, based on Radix UI primitives and styled with Tailwind CSS, following a custom "New York" theme. Form handling uses React Hook Form with Zod for validation. 

The application features authentication pages (Login, Sign Up, Forgot Password) and core application pages:
- **Home**: Marketing landing page with hero section, stats, and feature highlights
- **Dashboard**: Main health tracking dashboard with metric cards (glucose, steps, water intake), trend arrows, and interactive charts
- **Health Assessment** (`/dashboard/health-assessment`): Comprehensive health analysis page with circular gauge charts showing daily/weekly/monthly averages for glucose, hydration, and activity metrics
- **Instant Consultation** (`/dashboard/consultation`): Doctor consultation page with grid layout displaying doctor cards showing availability status, specialty, experience, ratings, and consultation buttons
- **Find a Doctor** (`/doctors`): Search and browse doctors page with search functionality, specialty filter tabs, and 2-column responsive grid displaying doctor cards with online/offline status, experience, ratings, and consult buttons
- **Metrics History**: Historical health data visualization with time range filtering

Additional placeholder pages exist for future features like Food Scanner and an AI chatbot (DiaBot). A feature-based folder structure organizes code for scalability.

Mock data is centralized in the `/mocks` folder following React development best practices.

## Backend Architecture

The backend is an Express.js server developed with TypeScript and ESM modules. It includes JSON body parsing, URL-encoded support, and centralized error handling. API routes are prefixed with `/api`. A storage abstraction layer supports both in-memory development storage (MemStorage) and a planned PostgreSQL implementation using Drizzle ORM.

## Database Architecture

PostgreSQL is used as the database, configured for Neon serverless, with Drizzle ORM for type-safe SQL querying and schema management. The schema, defined in `shared/schema.ts`, includes `users` (with UUIDs, unique usernames, hashed passwords) and `health_metrics` (tracking blood sugar, blood pressure, heart rate, weight, steps, and water intake, linked to users). Drizzle Kit manages database migrations.

## Recent Updates (October 22, 2025)

### Find a Doctor Page
- Created two-step Find a Doctor flow at `/dashboard/doctors` with search, filter, and booking functionality:
  1. **Step 1 - Doctor List**: Search bar for name/specialty, specialty filter tabs (All Doctors, Diabetologists, Nutritionists, Health Coaches), 2-column responsive grid displaying all doctors
  2. **Step 2 - Book Consultation**: Calendar for date selection, time picker with AM/PM toggle, hospital location selection (South City Hospital, Liaquat National Hospital), and "Proceed Booking" button
- Implemented React state management (`useState`) to track:
  - `currentStep`: Controls which step is shown (doctor list/booking)
  - `selectedDoctor`: Tracks which doctor user selected for consultation
  - `selectedDate`: User's chosen appointment date
  - `selectedTime`: User's chosen appointment time with AM/PM
  - `selectedHospital`: User's chosen hospital location
- Created custom Calendar component in `/components/common/Calendar.tsx` using date-fns for date manipulation
- Created custom TimePicker component in `/components/common/TimePicker.tsx` with hour/minute inputs and AM/PM toggle
- Centralized mock data:
  - `/mocks/doctors.ts`: 9 doctors across 4 specialties
  - `/mocks/hospitals.ts`: 2 hospital locations with IDs and names
- Each doctor card shows: profile image, online/offline status, name, specialty, experience, 5-star ratings with Math.floor() for accurate rendering, and "Consult Now" button
- Booking screen includes: back navigation, doctor info display, interactive calendar with month navigation, time picker, hospital selection with visual feedback, and proceed booking button (disabled until date and hospital selected)
- Real-time search and filter with React state management
- All interactive elements have data-testid attributes for comprehensive testing
- Feature-based organization: page located in `features/dashboard/pages/FindDoctor.tsx`

### Instant Consultation Page
- Created three-step consultation flow at `/dashboard/consultation` following Figma design specifications:
  1. **Step 1 - Concern Selection**: User selects their concern (Diabetologist, Nutritionist, Health Coach, Endocrinologist) from card-based UI with icons, then clicks "Consult Now" button
  2. **Step 2 - Doctor List**: Shows filtered doctors based on selected concern with back navigation
  3. **Step 3 - Payment**: Payment screen with order details (amount, tax, total), payment method selection (Bank Transfer, Credit/Debit Card, Mobile Wallet), and "Proceed Payment" button
- Implemented React state management (`useState`) to track:
  - `currentStep`: Controls which step is shown (concern/doctors/payment)
  - `selectedConcern`: Tracks user's concern selection
  - `selectedDoctor`: Tracks which doctor user selected for consultation
- DoctorCard component with online/offline status indicators, profile images, specialty information, experience, and 5-star ratings
- PaymentScreen component with order summary, dynamic date/time display, radio group for payment methods
- 2-column responsive grid layout (desktop) that adapts to single column on mobile
- Mock data centralized following React development guidelines:
  - `/mocks/doctors.ts`: 9 doctors across 4 specialties with varied names and experience
  - `/mocks/concerns.ts`: 4 concern types with associated icons
- All interactive elements have data-testid attributes for comprehensive testing
- Feature-based organization: page located in `features/dashboard/pages/InstantConsultation.tsx`

### Health Assessment Page
- Created new Health Assessment page at `/dashboard/health-assessment` accessible from the main dashboard
- Implemented custom circular gauge charts using SVG for visual health metric displays
- Shows glucose, hydration, and activity analysis with daily, weekly, and monthly averages
- All gauges have unique data-testid attributes for testing (e.g., `gauge-glucose-daily-average`, `gauge-hydration-weekly-average`)
- Responsive flexbox layout with proper centering on all screen sizes
- Updated Sidebar to show Health Assessment as an expandable sub-item under My Dashboard
- Fixed gauge overflow issues by adjusting SVG radius and stroke width

### Dashboard Improvements
- Fixed dashboard centering by removing hardcoded margins and using flex utilities
- Implemented functional "Add New Log" dialog with single text input and validation
- Added trend arrows (green up/red down) to all metric cards comparing latest vs previous readings
- Integrated water intake tracking throughout the application (database schema, API, UI)
- React Query cache invalidation ensures real-time UI updates after metric submissions

## Authentication Strategy

The application uses email/password authentication with bcrypt for password hashing and client-side state management with Zustand, persisted to localStorage. The system supports user registration, login, and a password recovery flow, with planned enhancements for session-based authentication, CSRF protection, and rate limiting.

# External Dependencies

-   **Database Provider**: Neon Serverless PostgreSQL, connected via `@neondatabase/serverless`.
-   **Session Management**: `connect-pg-simple` for PostgreSQL-backed session storage in Express.
-   **Development Tools**: Vite for frontend builds, TSX for TypeScript execution in Node.js, and esbuild for production server bundling. Replit-specific plugins enhance the development experience.
-   **Environment Variables**: `DATABASE_URL` (PostgreSQL connection string), `NODE_ENV`, and `REPL_ID`.