# RealSync – Full-Stack CRM for Lead & Contract Management

A solo-developed, full-stack client onboarding and management dashboard using Django REST Framework (backend) and React + Vite + TypeScript + Tailwind CSS (frontend). Designed for managing real estate or client service workflows with agents, leads, and contracts.

---

## ✅ COMPLETED PHASES

### PHASE 0: PROJECT FOUNDATION
- Initialized GitHub repository and GitHub Codespaces
- Created Django project and virtual environment
- Installed Django REST Framework and CORS headers
- Created React app using Vite + TypeScript
- Installed and verified Tailwind CSS
- Configured PostCSS and TypeScript settings
- Created shared Axios instance (`api.ts`)
- Removed deprecated `core` app
- Created custom user model (`Agent`) in `users` app
- Ran initial migrations without conflicts

### PHASE 1: APP ARCHITECTURE & ROUTING

**Backend:**
- Created apps: `users`, `leads`, `contracts`
- Set `AUTH_USER_MODEL` to `users.Agent`
- Configured `backend/urls.py` with DRF router
- Confirmed successful admin and API configuration

**Frontend:**
- Created folder structure under `/frontend/src/`
- Built reusable `AppLayout` with navigation
- Configured routes: `/leads`, `/contracts`, `/settings`
- Created placeholder pages and layout logic

✅ *Deliverable:* Routed layout works with sidebar navigation and React Router

### PHASE 2: DATA MODELING

- Defined and migrated models:
  - ✅ `Agent` (custom user)
  - ✅ `Lead` (name, contact info, property address, status choices, FK to Agent)
  - ✅ `Contract` (PDF upload, status choices, FK to Lead)
- Used `choices` for statuses on Lead and Contract models
- Registered models in Django admin
- Confirmed visibility and admin functionality

✅ *Deliverable:* Models visible and manageable via Django admin

### PHASE 3: API DEVELOPMENT (Django REST Framework)

- Created serializers for Agent, Lead, and Contract
- Implemented `ModelViewSet` for each model
- Used `DefaultRouter` for routing endpoints
- Created custom ping view at `/api/ping/`
- Verified API endpoints:
  - `GET/POST /api/leads/`
  - `GET/POST /api/contracts/`
- Implemented and passed all backend tests
  - Used `SimpleUploadedFile` to test contract uploads

✅ *Deliverable:* Fully tested and working API endpoints with CRUD support

### PHASE 4: FRONTEND FEATURES

**Leads Page:**
- Fetched and displayed lead list from API
- Added searchable dropdown at top (sticky UI)
- Enabled selection of individual lead with details view

**Contracts Page:**
- Fetched and displayed contracts with status and document
- Enabled document links and display with fetch hooks

**Frontend Utility:**
- Created reusable API services for leads and contracts
- Integrated Tailwind for responsive styling
- Search, filter, and status tags added for better UX

✅ *Deliverable:* API-integrated React pages for leads and contracts

---

## 🚧 UPCOMING PHASES

### PHASE 5: FEATURE COMPLETION *(Current Phase)*

- Create `LeadForm` and `ContractForm` components (shared for create/update)
- Add modal-based or inline editing UI using `Dialog` or `Drawer`
- Enable file upload via `FormData` with PDF preview
- Create reusable hooks (`useLeads`, `useContracts`) to manage API calls
- Add Delete functionality with confirmation dialogs
- Implement toast notifications (e.g., `react-hot-toast`) for actions
- Add spinners/loading states during submission and fetch

📌 *Deliverable:* Fully functional CRUD forms and feedback mechanisms for Leads & Contracts

### PHASE 6: AUTHENTICATION

- Implement login/logout with JWT or Django session auth
- Protect routes and pages based on user authentication
- Store and refresh auth tokens on frontend

📌 *Deliverable:* Auth flow with route protection and login state

### PHASE 7: TESTING & ERROR HANDLING

- Add Django unit tests for all views and models
- Add frontend error boundaries and toast messages
- Improve API failure UX (fallbacks, retries)

📌 *Deliverable:* Resilient and stable application behavior

### PHASE 8: UI DESIGN POLISH

- Improve layout and spacing with Tailwind
- Add Lucide or Heroicons for visual feedback
- Implement dark mode and mobile responsiveness

📌 *Deliverable:* Responsive and polished UI with accessibility in mind

### PHASE 9: DEPLOYMENT

**Backend:**
- Deploy Django backend to Render, Railway, or EC2

**Frontend:**
- Deploy Vite/React frontend to Vercel or Netlify

**Other:**
- Add `.env` variables for production URLs
- Optional CI/CD using GitHub Actions

📌 *Deliverable:* Production-ready deployment of full-stack RealSync

---

## 📁 PROJECT STRUCTURE

### Frontend (`/frontend/src/`)
- api/ → Axios instance + API services
- assets/ → Static assets like SVGs
- components/ → Reusable components (e.g., LeadCard, LeadForm, Modal)
- layouts/ → Shared layouts (AppLayout, AuthLayout)
- pages/ → LeadsPage, ContractsPage, SettingsPage
- types/ → TypeScript interfaces for models
- utils/ → Formatting, validation, helpers
- hooks/ → Custom hooks (e.g., useLeads, useContracts)
- main.tsx → React entry point


### Backend (`/backend/`)
- backend/ → Django project settings, URLs, wsgi/asgi
- users/ → Custom Agent user model, admin, serializers
- leads/ → Lead model, serializers, views, tests
- contracts/ → Contract model, uploads, serializers, views
- manage.py → Django CLI
- db.sqlite3 → SQLite dev DB (ignored in Git)

### Git Ignored Files

- .env/ → Python virtual environment
- node_modules/ → Frontend dependencies
- pycache/ → Python bytecode cache
- db.sqlite3 → Local dev database


---

## 💡 Notes

- All backend tests pass using `python manage.py test`
- Frontend and backend are decoupled and communicate via REST
- Uses `multipart/form-data` for file uploads
- Code committed to GitHub after every phase milestone
- Hooks and components are modularized for scaling to additional features like AI and open house check-ins
