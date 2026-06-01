# Aggregator Monorepo Starter

Full-stack monorepo starter for a product comparison system.

## Tech Stack

* Frontend: Next.js + TypeScript + Tailwind CSS + Firebase Auth (client SDK)
* Backend: Node.js + Express + TypeScript + PostgreSQL + Firebase Admin

## Project Structure

* `frontend/` Next.js app with scalable folders:

  * `src/components`
  * `src/pages`
  * `src/services`
  * `src/utils`
  * `src/hooks`
* `backend/` Express API with modular architecture:

  * `src/modules/auth`
  * `src/modules/user`
  * `src/modules/product`
  * `src/middleware`
  * `src/config`

## Prerequisites

Before running the project, make sure you have:

* Node.js 20+
* PostgreSQL 14+ installed and running locally
* A Firebase project

## 1) PostgreSQL Setup

This project requires a local PostgreSQL database.

### Install PostgreSQL

Download and install PostgreSQL from:

https://www.postgresql.org/download/

During installation:

* Keep the default port (`5432`) unless you need a different one.
* Remember the password you assign to the `postgres` user.

Verify the installation:

```bash
psql --version
```

### Create the Database

Connect to PostgreSQL:

```bash
psql -U postgres
```

Create the application database:

```sql
CREATE DATABASE aggregator;
```

Verify the database exists:

```sql
\l
```

Exit PostgreSQL:

```sql
\q
```

### Database Connection

The backend expects a database named `aggregator` running locally on PostgreSQL.

The default connection string is:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/aggregator
```

If your PostgreSQL password is different, update the `DATABASE_URL` value in `backend/.env`.

Example:

```env
DATABASE_URL=postgres://postgres:mypassword@localhost:5432/aggregator
```

### Automatic Table Creation

The backend automatically creates the required tables on startup:

* `users`
* `products`

No manual migration step is required for the starter project.

## 2) Configure Environment Variables

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

Create `backend/.env` from `backend/.env.example` and fill in the values:

```env
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/aggregator
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n"
```

### Firebase Setup

1. Create a Firebase project.
2. Enable Authentication in the Firebase Console.
3. Obtain your Firebase Web App configuration values and place them in `frontend/.env.local`.
4. Generate a Firebase Admin SDK service account key.
5. Copy the service account values into `backend/.env`.

**Important:** Never commit Firebase Admin credentials to source control.

## 3) Install Dependencies

From the repository root:

```bash
npm install
```

## 4) Run the Applications

Open two terminals from the repository root.

### Terminal 1 (Backend)

```bash
npm run dev:backend
```

Backend will be available at:

```text
http://localhost:4000
```

### Terminal 2 (Frontend)

```bash
npm run dev:frontend
```

Frontend will be available at:

```text
http://localhost:3000
```

## Backend API Endpoints

### Authentication

* `GET /api/auth/me`

  * Requires Firebase bearer token
  * Returns the authenticated user

### Users

* `POST /api/users`
* `GET /api/users/:id`

### Products

* `GET /api/products`
* `POST /api/products`

  * Requires Firebase bearer token
* `GET /api/products/:id`

## Notes

* Backend initializes the required database tables on startup.
* `GET /api/auth/me` automatically creates a local user record if one does not already exist.
* Keep Firebase Admin credentials on the backend only.
* Ensure PostgreSQL is running before starting the backend.
* If the backend cannot connect to PostgreSQL, verify:

  * PostgreSQL is running.
  * The `aggregator` database exists.
  * The username, password, host, and port in `DATABASE_URL` are correct.

## Troubleshooting

### PostgreSQL Connection Refused

Check that PostgreSQL is running:

```bash
pg_isready
```

### Authentication Failed for User "postgres"

Verify the password in:

```env
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/aggregator
```

### Database Does Not Exist

Create it manually:

```sql
CREATE DATABASE aggregator;
```

### Port Already in Use

If ports `3000` or `4000` are already occupied, stop the conflicting application or change the port configuration.

## Development Workflow

1. Start PostgreSQL.
2. Start the backend server.
3. Start the frontend application.
4. Authenticate using Firebase.
5. Use the frontend to interact with backend APIs.

Happy coding!
