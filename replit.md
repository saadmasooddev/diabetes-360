# Overview

HealthSync/Diabetes 360 is a full-stack health tracking web application designed for managing diabetes-related health data. It features a robust authentication system and an interactive dashboard for visualizing health metrics. The application aims to provide a comprehensive platform for users to track their health, access resources, and connect with healthcare services, ultimately supporting better diabetes management. It uses React, Express, PostgreSQL, and a monorepo structure with TypeScript and shadcn/ui.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Project Structure

The application uses a monorepo structure with `client/` for the React frontend, `server/` for the Express.js backend, and `shared/` for common types and utilities, ensuring consistent data models across the stack.

## Frontend Architecture

The frontend is built with React, Vite, TanStack Query for server state management, Wouter for routing, and Zustand for client state. UI components are from shadcn/ui, based on Radix UI primitives and styled with Tailwind CSS, following a custom "New York" theme. Form handling uses React Hook Form with Zod for validation. The application features authentication pages (Login, Sign Up, Forgot Password) and core application pages including Home, Dashboard, and Metrics History, along with placeholders for future features like Instant Consultation, Food Scanner, and an AI chatbot (DiaBot). A feature-based folder structure organizes code for scalability.

## Backend Architecture

The backend is an Express.js server developed with TypeScript and ESM modules. It includes JSON body parsing, URL-encoded support, and centralized error handling. API routes are prefixed with `/api`. A storage abstraction layer supports both in-memory development storage (MemStorage) and a planned PostgreSQL implementation using Drizzle ORM.

## Database Architecture

PostgreSQL is used as the database, configured for Neon serverless, with Drizzle ORM for type-safe SQL querying and schema management. The schema, defined in `shared/schema.ts`, includes `users` (with UUIDs, unique usernames, hashed passwords) and `health_metrics` (tracking blood sugar, blood pressure, heart rate, weight, steps, and water intake, linked to users). Drizzle Kit manages database migrations.

## Authentication Strategy

The application uses email/password authentication with bcrypt for password hashing and client-side state management with Zustand, persisted to localStorage. The system supports user registration, login, and a password recovery flow, with planned enhancements for session-based authentication, CSRF protection, and rate limiting.

# External Dependencies

-   **Database Provider**: Neon Serverless PostgreSQL, connected via `@neondatabase/serverless`.
-   **Session Management**: `connect-pg-simple` for PostgreSQL-backed session storage in Express.
-   **Development Tools**: Vite for frontend builds, TSX for TypeScript execution in Node.js, and esbuild for production server bundling. Replit-specific plugins enhance the development experience.
-   **Environment Variables**: `DATABASE_URL` (PostgreSQL connection string), `NODE_ENV`, and `REPL_ID`.