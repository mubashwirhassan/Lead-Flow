# AI LeadFlow CRM

AI-powered lead management and sales workflow web app. Next.js + TypeScript + Tailwind + MongoDB (Mongoose).

## Quick start

1. cp .env.example .env and set DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
2. npm install
3. npm run seed
4. npm run dev

## Highlights

- Invite-only auth, no public signup. Roles: ADMIN, MANAGER, AGENT, checked server-side.
- Leads: CRUD, search, filters, assignment, status workflow, notes, activity timeline, duplicate warnings.
- Intake: public website-form endpoint, manual entry, API-key submissions.
- AI: lead analyzer, reply drafts, follow-up suggestions, permission-aware chat, Bangla/English/Banglish.
- Analytics dashboard, follow-ups, notifications, settings, API keys.
- Security: bcrypt, JWT cookies, rate limits, audit logs, soft deletes, hashed tokens.

## Deploy

docker compose up -d --build

Each client uses its own MongoDB via DATABASE_URL.
