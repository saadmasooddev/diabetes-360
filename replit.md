# Overview

HealthSync/Diabetes 360 is a full-stack health tracking web application designed to manage diabetes-related health data. It provides a comprehensive platform for users to track health metrics, access resources, and connect with healthcare services to support better diabetes management. The application features robust authentication, an interactive dashboard for data visualization, and tools for health assessment, doctor consultations, and nutritional analysis.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Project Structure

The application uses a monorepo structure with `client/` for the React frontend, `server/` for the Express.js backend, and `shared/` for common types and utilities, ensuring consistent data models across the stack.

## Frontend Architecture

The frontend is built with React, Vite, TanStack Query for server state management, Wouter for routing, and Zustand for client state. UI components are from shadcn/ui, styled with Tailwind CSS, following a custom "New York" theme. Form handling uses React Hook Form with Zod for validation.
Key features include:
-   **Authentication Pages**: Login, Sign Up, Forgot Password.
-   **Dashboard**: Main health tracking with metric cards, trend arrows, and interactive charts.
-   **Health Assessment**: Comprehensive health analysis with circular gauge charts for glucose, hydration, and activity averages.
-   **Instant Consultation**: Three-step flow for selecting concerns, viewing filtered doctors, and processing payments.
-   **Find a Doctor**: Three-step flow for searching, filtering, booking, and confirming consultations with doctors.
-   **Metrics History**: Historical health data visualization with time range filtering.
-   **Tips & Exercises**: Personalized health tips carousel, exercise plans grid, and weekly challenges grid, with premium content differentiation.
-   **Food Scanner**: Three-step flow for uploading food images, scanning, and displaying nutritional analysis results with premium features.
-   **Medical Records**: Four sections for tracking health data: Glucose Logs, Consultations table, Medications (premium-locked with clean dashed border design), and Lab Reports with empty states and action buttons.

## Backend Architecture

The backend is an Express.js server developed with TypeScript and ESM modules. It includes JSON body parsing, URL-encoded support, and centralized error handling. API routes are prefixed with `/api`. A storage abstraction layer supports both in-memory development storage (MemStorage) and PostgreSQL.

## Database Architecture

PostgreSQL is used as the database, configured for Neon serverless, with Drizzle ORM for type-safe SQL querying and schema management. The schema includes `users` (with UUIDs, unique usernames, hashed passwords) and `health_metrics` (tracking blood sugar, blood pressure, heart rate, weight, steps, and water intake, linked to users). Drizzle Kit manages database migrations.

## Authentication Strategy

The application uses email/password authentication with bcrypt for password hashing and client-side state management with Zustand, persisted to localStorage. It supports user registration, login, and password recovery.

# External Dependencies

-   **Database Provider**: Neon Serverless PostgreSQL, connected via `@neondatabase/serverless`.
-   **Session Management**: `connect-pg-simple` for PostgreSQL-backed session storage in Express.
-   **Development Tools**: Vite for frontend builds, TSX for TypeScript execution in Node.js, and esbuild for production server bundling.