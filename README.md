# RealSync – Full-Stack CRM for Lead & Contract Management

_Last updated: May 25, 2025_

A solo-developed, full-stack client onboarding and management dashboard using **Django REST Framework (backend)** and **React + Vite + TypeScript + Tailwind CSS (frontend)**. Designed for managing real estate or client service workflows with agents, leads, and contracts.

---

## 📦 Tech Stack
- **Backend**: Django 5.2, DRF, JWT (SimpleJWT), CORS
- **Frontend**: React 18, Vite, Tailwind CSS, TypeScript
- **Testing**: Jest, React Testing Library, MSW for API mocking
- **Build Tools**: Vite, PostCSS, ESLint
- **Other**: Docker (planned), AWS (planned)

---

## ✅ COMPLETED PHASES

### PHASE 0: PROJECT FOUNDATION
- Initialized GitHub repository and Codespaces
- Created Django project and virtual environment
- Installed DRF and CORS headers
- Created React app using Vite + TypeScript
- Installed and verified Tailwind CSS and PostCSS
- Configured shared Axios instance and initial TypeScript settings
- Set up custom user model (Agent) and initial migrations

### PHASE 1: APP ARCHITECTURE & ROUTING
- Backend apps: users, leads, contracts
- Configured DRF routers and admin interface
- Frontend routing with React Router and layout design (Leads, Contracts, Settings)

### PHASE 2: DATA MODELING
- Defined and migrated `Agent`, `Lead`, `Contract` models with proper relationships
- Set `choices` for statuses and ensured admin functionality

### PHASE 3: API DEVELOPMENT (DRF)
- Created serializers, viewsets, and routes for all models
- Added CRUD endpoints and custom `/api/ping/` for health checks
- Wrote and passed unit tests for API logic

### PHASE 4: FRONTEND FEATURES
- Integrated API services for leads and contracts
- Created `LeadsPage` and `ContractsPage` with full CRUD support
- Added `StatusTabs`, modals, and toasts for user interaction

### PHASE 5: FEATURE COMPLETION
- Implemented `LeadForm` and `ContractForm` with file upload support
- Added feedback mechanisms (spinners, toasts)
- Enabled archiving/restoring for leads and contracts
- Protected deletion of signed contracts
- Enhanced UX with search, filters, and error boundaries

### PHASE 6: AUTHENTICATION (JWT)
- Configured SimpleJWT for token-based auth
- Implemented `/api/token/` and `/api/token/refresh/` endpoints
- Verified secure access control and token refresh behavior

### PHASE 7: TESTING & ERROR HANDLING
- Reorganized Django test suite into modular folders per app
- Added backend unit tests for API endpoints, archive logic, and JWT expiration/refresh
- Implemented global `ErrorBoundary` for React crash recovery
- Wrapped major pages in `<ErrorBoundary>`
- Added `toast.error` feedback in all API error blocks
- Created reusable `handleRequest()` for API requests
- Added `EmptyState`, loading spinners, and user-friendly error fallbacks

✅ *Deliverable:* Stable and error-resilient application with complete CRUD, error handling, and authentication.

---

## 🚧 UPCOMING PHASES

### PHASE 8: UI DESIGN POLISH
- Improve layout and spacing with Tailwind
- Add icons, dark mode, and mobile responsiveness
- Enhance form validations and feedback

### PHASE 9: DEPLOYMENT
- Dockerize backend and frontend
- Deploy Django to Render/Railway/AWS, frontend to Vercel/Netlify
- Add environment variables for production
- Optional: CI/CD with GitHub Actions

---

## 📁 PROJECT STRUCTURE

### Backend (`/backend/`)
- `backend/` – Django project config (settings, urls, wsgi/asgi)
- `users/`, `leads/`, `contracts/` – Models, serializers, views, tests
- `manage.py`, `db.sqlite3`

### Frontend (`/frontend/`)
- `src/api/` – Axios instance and CRUD services
- `src/components/` – Reusable UI and form components
- `src/pages/` – Leads, Contracts, Auth, Settings pages
- `src/__tests__/` – Jest tests with MSW (Mock Service Worker)
- `src/mocks/` – Handlers for mocking backend APIs
- `vite.config.ts`, `index.css`

---

## 🔧 Setup & Run

### Backend
```bash
cd backend
python -m venv env
source env/bin/activate
pip install -r requirements.txt
python manage.py runserver
