# Aggregator Monorepo Starter

Full-stack monorepo starter for a product comparison system.

## Tech Stack

- Frontend: Next.js + TypeScript + Tailwind CSS + Firebase Auth (client SDK)
- Backend: Node.js + Express + TypeScript + PostgreSQL + Firebase Admin

## Project Structure

- `frontend/` Next.js app with scalable folders:
  - `src/components`
  - `src/pages`
  - `src/services`
  - `src/utils`
  - `src/hooks`
- `backend/` Express API with modular architecture:
  - `src/modules/auth`
  - `src/modules/user`
  - `src/modules/product`
  - `src/middleware`
  - `src/config`

## Prerequisites

- Node.js 20+
- PostgreSQL running locally (or a reachable DATABASE_URL)
- Firebase project

## 1) Configure Environment Variables

### Frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

A template is also available in `frontend/.env.local.example`.

### Backend

Create `backend/.env` from `backend/.env.example` and fill values:

```env
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/aggregator
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n"
```

## 2) Run Apps

Open two terminals from the repository root.

Terminal 1 (backend):

```bash
npm run dev:backend
```

Terminal 2 (frontend):

```bash
npm run dev:frontend
```

Frontend: http://localhost:3000

Backend: http://localhost:4000

## Backend API Endpoints

- Auth:
  - `GET /api/auth/me` (requires Firebase bearer token)
- Users:
  - `POST /api/users`
  - `GET /api/users/:id`
- Products:
  - `GET /api/products`
  - `POST /api/products` (requires Firebase bearer token)
  - `GET /api/products/:id`

## Notes

- Backend initializes `users` and `products` tables on startup.
- `GET /api/auth/me` creates a local user record automatically if missing.
- Keep Firebase Admin credentials on backend only.
