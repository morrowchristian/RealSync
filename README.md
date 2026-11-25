# RealSync — CRM for Home Service Businesses

RealSync is a full-stack CRM for home service businesses (plumbers, HVAC, electricians, roofers) that makes sure no estimate or lead goes cold. Leads, estimates, follow-ups, and contracts in one place, built with **Django REST Framework** and **React + Vite + TypeScript**.

## Live demo

- **Frontend:** https://real-sync-eta.vercel.app/
- **Backend API:** https://realsync-backend.onrender.com

Note: the backend runs on Render's free plan, so it sleeps after 15 minutes of inactivity — the first request after a pause takes a while to wake up.

## What it does

- **Leads** — Create, edit, search, filter, archive, and restore leads. Each lead has a contact card, status tracking, and a notes field.
- **Lead form** — A configurable lead-entry form with solid built-in fields and optional custom fields. An admin can choose which fields are shown and which are required from Settings.
- **Estimates** — Track estimates through sent, followed up, won, and lost.
- **Follow-ups** — Log follow-ups per lead. The dashboard shows who to contact today so nothing slips.
- **Contracts** — Create and manage contracts, with archiving and protected deletion of signed contracts.
- **Spreadsheet views** — Leads and Contracts are shown as spreadsheet-style tables; double-click a lead to open its contact card.
- **Auth & trials** — Sign up with email and password. New accounts get a 5-day trial with creation quotas (50 leads, 20 contracts, 10 custom fields). Expired trials are removed automatically.
- **Visitor demo** — A read-only demo (`/demo`) shows sample data without signing up.
- **Per-user data** — Every account only sees its own leads, estimates, follow-ups, and contracts.

## Tech stack

- **Backend:** Django 5.2, Django REST Framework, SimpleJWT, Gunicorn, WhiteNoise
- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS v3
- **Database:** Neon Postgres in production, SQLite by default locally
- **Hosting:** Render (backend), Vercel (frontend)
- **Testing:** Django test suite (backend); Jest, React Testing Library, MSW (frontend)

## Project structure

```
backend/                 # Django project
  backend/               # Project config (settings, urls, wsgi)
  users/                 # Agent/user model, auth, trials, quotas
  leads/                 # Lead and FollowUp models, API, tests
  contracts/             # Contract and Estimate models, API, tests
  manage.py
  requirements.txt
frontend/                # React + Vite app
  src/api/               # Axios instance and API services
  src/components/        # Reusable UI and form components
  src/pages/             # Dashboard, Leads, Contracts, Estimates,
                         # FollowUps, Auth, Settings, Demo
  src/__tests__/         # Jest tests with MSW
  src/utils/             # Shared helpers (e.g. request retry)
```

## Setup & run

### Backend

```bash
cd backend
python -m venv env
source env/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

By default the backend uses a local SQLite database (`db.sqlite3`). To use Postgres instead, set `DATABASE_URL` before running migrations. A superuser is created automatically on deploy via `ensure_superuser`; locally, use `python manage.py createsuperuser`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend talks to `http://localhost:8000/api/` by default. To point it at a different backend, set `VITE_API_URL` in a `.env` file (for example, `VITE_API_URL=https://realsync-backend.onrender.com/api/` for the deployed backend).

### Tests

```bash
# Backend (from backend/)
python manage.py test

# Frontend (from frontend/)
npm test
```
