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
- Created three-step Find a Doctor flow at `/dashboard/doctors` with search, filter, booking, and confirmation:
  1. **Step 1 - Doctor List**: Search bar for name/specialty, specialty filter tabs (All Doctors, Diabetologists, Nutritionists, Health Coaches), 2-column responsive grid displaying all doctors
  2. **Step 2 - Book Consultation**: Calendar for date selection, time picker with AM/PM toggle, hospital location selection (South City Hospital, Liaquat National Hospital), and "Proceed Booking" button
  3. **Step 3 - Confirmation**: Displays booking confirmation with doctor info, selected date/time, hospital location, and "Appointment Booked" success banner
- Implemented React state management (`useState`) to track:
  - `currentStep`: Controls which step is shown (1, 2, or 3)
  - `selectedDoctor`: Tracks which doctor user selected for consultation
  - `bookingDetails`: Stores date, time, and hospital for confirmation screen
  - Search query and specialty filter for doctor list
- Created custom Calendar component in `/components/common/Calendar.tsx` using date-fns for date manipulation
- Created custom TimePicker component in `/components/common/TimePicker.tsx` with hour/minute inputs and AM/PM toggle
- Centralized mock data:
  - `/mocks/doctors.ts`: 9 doctors across 4 specialties
  - `/mocks/hospitals.ts`: 2 hospital locations with IDs and names
- Each doctor card shows: profile image, online/offline status, name, specialty, experience, 5-star ratings with Math.floor() for accurate rendering, and "Consult Now" button
- Booking screen includes: back navigation, doctor info display, interactive calendar with month navigation, time picker, hospital selection with visual feedback, and proceed booking button (disabled until date and hospital selected)
- Confirmation screen displays: back navigation, doctor name and specialty, formatted date (e.g., "4 June 2025"), time (e.g., "7:45 PM"), hospital location, and green success banner
- Date formatting uses date-fns format() function to match Figma design
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

### Tips & Exercises Page
- Created Tips & Exercises page at `/tips` with four main sections following Figma design:
  1. **Header Banner**: Teal gradient banner with "Upgrade to get personalized Tips & Exercises" and "See Plans" button
  2. **Health Tips Carousel**: Horizontal sliding carousel with prev/next buttons and dot indicators, displaying diabetes health tips
  3. **Exercise Plans Grid**: 4-column responsive grid showing Morning Walk, Strength Training, Yoga or Stretching, and locked Custom Exercise with images, duration, descriptions, and "Start Now" buttons
  4. **Weekly Challenges Grid**: 3-column grid showing weekly challenges with progress tracking and premium lock states
- Implemented React state management (`useState`) for carousel functionality:
  - `currentTipIndex`: Tracks current visible tip in carousel
  - Full-width slides (100%) with translateX animation for smooth transitions
- Carousel features:
  - Chevron navigation buttons with hover states
  - Dot pagination with active state indicator (elongated dot)
  - Smooth 300ms CSS transitions
  - Accessible with aria-label attributes on all controls
- Mock data centralized in `/mocks/tipsExercises.ts`:
  - `healthTips`: 4 diabetes health tips with advice
  - `exercisePlans`: 4 exercise plans with images, duration, descriptions, and locked states
  - `weeklyChallenges`: 3 weekly challenges with goals, progress tracking, and locked states
- Premium/locked features indicated with:
  - Lock icons in circular teal backgrounds
  - "Subscribe to Premium" overlay messages
  - Grayed out cards with semi-transparent overlays
- Responsive design: Grid adapts from 4 columns (lg) to 2 columns (md) to 1 column (mobile)
- All interactive elements have data-testid attributes and aria-label for accessibility
- Feature-based organization: page located in `features/dashboard/pages/TipsExercises.tsx`

### Food Scanner Page
- Created three-step Food Scanner flow at `/food-scanner`:
  1. **Step 1 - Upload**: Large upload area with dashed border, upload icon, "Upload Picture" button
  2. **Step 2 - Scanning**: Image grayed out (grayscale filter + brightness reduction), animated teal scanning line moving up and down, "Scanning.." button disabled
  3. **Step 3 - Results**: Comprehensive food analysis with 2-column grid layout showing Food Overview, Breakdown Section, Personalized Insight, and Nutritional Highlight
- Implemented React state management (`useState`) to track:
  - `currentStep`: Controls which step is shown (upload/scanning/results)
  - `selectedFile`: Tracks uploaded image file
  - `previewUrl`: Stores image preview URL
  - `scanLinePosition`: Controls scanning animation position
- Image preview uses `object-fit: cover` to fill entire upload div (min-height: 400px)
- Scanning animation implemented with `useEffect` hook:
  - Teal line (#00856F) moves up and down with box-shadow glow effect
  - Animation runs for 3 seconds before transitioning to results
  - Ultra-smooth animation: updates every 10ms with 0.8% increments and CSS transitions
- Mock nutrition data centralized in `/mocks/scanResults.ts` with TypeScript interfaces
- **Results screen layout (2-column grid)**:
  - **Left Column**:
    - **Food Overview**: Food image (rounded), food name, and food category
    - **Breakdown Section**: Progress bars for Carbs, Fiber, Sugars, Protein, Fat, and Calories with Good/Average/Danger zones. Protein locked with premium message, other items show grayed/active states
  - **Right Column**:
    - **Personalized Insight**: Lock icon with "Subscribe to Premium" message
    - **Nutritional Highlight**: Food image, Carbohydrate Count display (28g), and locked Glycemic Index requiring premium access
- Custom `ProgressBar` component with three-zone color system (green/yellow/red) and position indicator
- Premium/locked features indicated with Lock icons and subscription messages
- Header with back navigation button appears after upload
- Button text dynamically changes: "Upload Picture" → "Scan" → "Scanning.."
- All interactive elements have data-testid attributes for comprehensive testing
- Feature-based organization: page located in `features/dashboard/pages/FoodScanner.tsx`

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