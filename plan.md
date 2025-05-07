RealSync Development Plan – Solo Developer Roadmap
==================================================


PHASE 4: FRONTEND FEATURES
--------------------------------------------------

Leads:
- Display leads in a table or list
- Add create/edit/delete forms
- Filter by status or agent

Contracts:
- Upload contract PDF files
- Display contract details and download links
- Track contract status

Utilities:
- Toasts for notifications
- Loading indicators
- Form validation

Deliverable: RealSync has working lead and contract workflows


PHASE 5: AUTHENTICATION (Planned for Later)
--------------------------------------------------

- Add login/logout with JWT or Django session auth
- Store auth state in frontend (React context or store)
- Restrict routes to authenticated agents

Deliverable: Auth flow enabled with protected pages


PHASE 6: TESTING & ERROR HANDLING
--------------------------------------------------

- Write Django unit tests for models/views
- Add error handling for API failures in frontend
- Display fallback UI or messages on failure

Deliverable: App is stable with error resilience


PHASE 7: UI DESIGN POLISH
--------------------------------------------------

- Polish spacing and layout using Tailwind
- Add icon set (e.g., Lucide or Heroicons)
- Add dark mode toggle (optional)
- Test responsiveness on mobile

Deliverable: App has clean, responsive UI


PHASE 8: DEPLOYMENT
--------------------------------------------------

Backend:
- Deploy to Render, Railway, or EC2

Frontend:
- Deploy to Vercel or Netlify

Other:
- Use .env variables for API URLs
- Add simple CI/CD pipeline (optional)

Deliverable: Live deployment of RealSync with working backend and frontend


==================================================
FOLDER STRUCTURE
==================================================

Frontend (/frontend/src):

  api/            → Axios instance and API service calls
  assets/         → Static files (e.g., SVG, images)
  components/     → Reusable UI components
  layouts/        → Shared layout components (AppLayout, etc.)
  pages/          → LeadsPage, ContractsPage, SettingsPage
  types/          → TypeScript interfaces for models
  utils/          → Helpers (formatDate, validators)
  hooks/          → Custom React hooks (e.g. layout state, route utils)
  App.tsx
  main.tsx
  index.css
  vite-env.d.ts

Backend (/backend):

  backend/        → Django project root (settings, urls, wsgi)
  users/          → Custom Agent model
  leads/          → Lead models, views, serializers
  contracts/      → Contract models, views, uploads
  db.sqlte3
  mangae.py

Virtual Environment (/env)


==================================================
✅ COMPLETED PHASES
==================================================

PHASE 0: PROJECT FOUNDATION
--------------------------------------------------
- Created Django project and virtual environment
- Installed Django REST Framework and CORS headers
- Initialized React app using Vite + TypeScript
- Installed Tailwind CSS and PostCSS
- Created reusable Axios instance (`api.ts`)
- Verified Tailwind styling renders correctly (initially)
- Set up custom Agent model in `users` app
- Removed conflicting `core` app
- Resolved initial migration conflicts
--------------------------------------------------

PHASE 1: APP ARCHITECTURE & ROUTING
--------------------------------------------------

Backend:
- Created apps: `users`, `leads`, `contracts`
- Set `AUTH_USER_MODEL` to `users.Agent`
- Ran migrations successfully

Frontend:
- Created folder structure
- Built placeholder pages
- Created AppLayout component with nav links
- Configured React Router for `/leads`, `/contracts`, `/settings`

Deliverable: Routed layout works with navigation between placeholder pages
--------------------------------------------------

PHASE 2: DATA MODELING
--------------------------------------------------

Goal: Define and migrate all Django models

Models to create:
x Agent 
- Lead (name, contact, property, status, agent FK)
- Contract (PDF upload, status, linked to Lead)
- Optional: Task, Note, ActivityLog

Steps:
- Add fields and relationships to models
- Add model `choices` for status fields
- Register models in Django admin
- Run `makemigrations` and `migrate`

Deliverable: Models are migrated and visible in admin
--------------------------------------------------

PHASE 3: API DEVELOPMENT (Django REST)
--------------------------------------------------

Goal: Build RESTful API for each model

Steps:
- Create serializers for Agent, Lead, Contract
- Use ViewSets and Django REST Router
- Expose endpoints like:
    GET /leads/
    POST /leads/
    PATCH /leads/:id
    GET /contracts/
- Add permissions or authentication decorators (optional)

Deliverable: Working CRUD endpoints for each resource
--------------------------------------------------

