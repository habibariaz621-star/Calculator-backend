# Advanced Calculator

A full-stack scientific calculator app with user authentication. The frontend is built with React + Vite, and the backend is an Express API backed by MongoDB with JWT-based authentication.

## Project Overview

Users register and log in, and only authenticated users can access the calculator. The calculator supports basic arithmetic (`+`, `−`, `×`, `÷`) and scientific functions (`sin`, `cos`, `tan`, `√`, `log`), a DEG/RAD angle mode toggle, full keyboard support, and a locally saved calculation history.

**Tech stack**

- **Frontend:** React 19, Vite, Tailwind CSS, React Router, mathjs
- **Backend:** Node.js, Express 5, MongoDB (Mongoose), JWT, bcryptjs
- **Auth:** JSON Web Tokens stored client-side; protected calculator route on the server

**Project structure**

```
Calculator-backend/
├── backend/                # Express API
│   ├── config/db.js        # MongoDB connection
│   ├── controllers/        # auth & calculator logic
│   ├── middleware/         # JWT auth middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API route definitions
│   └── server.js           # App entry point
├── src/                    # React frontend
│   ├── context/            # Auth context (login/register/logout)
│   ├── pages/              # Login, Register, Calculator
│   └── App.jsx             # Routes & route guards
├── .env                    # Environment variables
└── vite.config.js          # Vite config (dev proxy to backend)
```

## Installation Steps

### Prerequisites

- Node.js 18+ and npm
- A MongoDB connection string (e.g. MongoDB Atlas)

### 1. Clone and install

```bash
git clone <repository-url>
cd Calculator-backend
```

Install frontend dependencies (run from the project root):

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
npm install
cd ..
```

### 2. Configure environment variables

Create/update the `.env` file in the project root (see [Environment Variables](#environment-variables) below).

### 3. Run the app

Start the backend (from the `backend/` folder):

```bash
cd backend
npm run dev
```

In a separate terminal, start the frontend (from the project root):

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` (or the next free port) and proxies `/api` requests to the backend on port `5000`.

### Available scripts

**Frontend (project root)**

- `npm run dev` — start the Vite dev server
- `npm run build` — build for production
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint

**Backend (`backend/`)**

- `npm run dev` — start the server with file watching
- `npm start` — start the server

## Environment Variables

All variables live in the root `.env` file.

| Variable        | Required | Used by  | Description                                                                                  |
| --------------- | -------- | -------- | -------------------------------------------------------------------------------------------- |
| `MONGO_URI`     | Yes      | Backend  | MongoDB connection string.                                                                   |
| `JWT_SECRET`    | Yes      | Backend  | Secret used to sign and verify JWT tokens. Use a long, random value in production.           |
| `PORT`          | No       | Backend  | Port the API listens on. Defaults to `5000`.                                                 |
| `CLIENT_URL`    | No       | Backend  | Comma-separated list of allowed CORS origins (in addition to localhost).                     |
| `VITE_API_URL`  | No       | Frontend | API base URL. Leave unset in development so Vite proxies `/api`. Set it for production builds. |

**Example `.env`**

```env
# Backend
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=Cluster0
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000

# Frontend (leave unset in dev; set for production)
# VITE_API_URL=https://your-api.example.com
```

> Note: `.env` contains secrets and should not be committed to version control.

## API Endpoints

Base URL: `http://localhost:5000`

All responses are JSON and include a `success` boolean.

### Auth

#### `POST /api/auth/register`

Register a new user.

**Request body**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Success response (`201`)**

```json
{
  "success": true,
  "message": "Registration successful",
  "token": "<jwt>",
  "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com" }
}
```

Validation: `name`, `email`, and `password` are required; password must be at least 6 characters. Returns `409` if the email already exists.

#### `POST /api/auth/login`

Authenticate an existing user.

**Request body**

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Success response (`200`)**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "<jwt>",
  "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com" }
}
```

Returns `401` for invalid credentials.

### Calculator (protected)

#### `GET /api/calculator`

Verifies that the user is authenticated and may access the calculator. Requires a valid JWT.

**Headers**

```
Authorization: Bearer <jwt>
```

**Success response (`200`)**

```json
{
  "success": true,
  "message": "Calculator access granted",
  "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com" }
}
```

Returns `401` if the token is missing, invalid, or the user no longer exists.

### Misc

| Method | Endpoint | Description                       |
| ------ | -------- | --------------------------------- |
| `GET`  | `/`      | Health check; confirms API is up. |
