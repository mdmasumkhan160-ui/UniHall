# UniHall (Frontend + Backend)

UniHall is a full-stack hall allotment system:

- **Backend:** Node.js + Express + MySQL/MariaDB (REST API)
- **Frontend:** React + Vite + Tailwind

## Prerequisites

- **Node.js 18+** (and npm)
- **MySQL or MariaDB** (the included dump was generated from MariaDB 10.4)
- (Optional) **Git**

Default local ports:

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## Quick Start (Full-Stack)

### 0) Get the code

If you’re using Git:

```bash
git clone <your-repo-url>
cd UniHall
```

If you downloaded a ZIP, extract it and open the `UniHall/` folder.

### 1) Set up the database

The repo includes a SQL dump at `unihall.sql`. It does **not** create the database for you, so create it first.

**Windows (PowerShell):**

```powershell
# Create DB
mysql -u root -p -e "CREATE DATABASE unihall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema + seed data
mysql -u root -p unihall < unihall.sql
```

**macOS / Linux:**

```bash
# Create DB
mysql -u root -p -e "CREATE DATABASE unihall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema + seed data
mysql -u root -p unihall < unihall.sql
```

If you prefer phpMyAdmin / MySQL Workbench, create a database named `unihall` and import `unihall.sql` into it.

### 2) Run the backend

Open a terminal:

**Windows (PowerShell):**

```powershell
cd Backend
Copy-Item .env.example .env
notepad .env
npm install
npm run dev
```

**macOS / Linux:**

```bash
cd Backend
cp .env.example .env
nano .env
npm install
npm run dev
```

Edit `Backend/.env` with your DB credentials:

```dotenv
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=unihall
JWT_SECRET=change_me
```

Health check:

- `GET http://localhost:5000/api/health`

Uploads:

- The backend serves the `uploads/` folder at `http://localhost:5000/uploads/...`
- Make sure these folders exist (can be empty):
  - `uploads/exam-results/`
  - `uploads/pending/`
  - `uploads/profile-photos/`
  - `uploads/seat-plans/`

Create them quickly:

**Windows (PowerShell):**

```powershell
New-Item -ItemType Directory -Force -Path uploads/exam-results,uploads/pending,uploads/profile-photos,uploads/seat-plans | Out-Null
```

**macOS / Linux:**

```bash
mkdir -p uploads/exam-results uploads/pending uploads/profile-photos uploads/seat-plans
```

### 3) Run the frontend

Open a second terminal:

**Windows (PowerShell):**

```powershell
cd frontend
"VITE_API_BASE_URL=http://localhost:5000/api" | Out-File -Encoding utf8 .env
npm install
npm run dev
```

**macOS / Linux:**

```bash
cd frontend
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env
npm install
npm run dev
```

Open:

- `http://localhost:5173`

---

## Frontend-only (UI / localStorage mode)

If you only want to run the UI (no backend/database), you can still start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Note: parts of the UI call the API via `VITE_API_BASE_URL` (defaulting to `http://localhost:5000/api`). For full functionality, run the backend.

---

## Common Troubleshooting

- **Backend exits with “Unable to connect to MySQL”**

  - Confirm MySQL/MariaDB is running.
  - Double-check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `Backend/.env`.
  - Ensure the database `unihall` exists and `unihall.sql` was imported.

- **Port already in use**

  - Backend: change `PORT` in `Backend/.env`.
  - Frontend: change `server.port` in `frontend/vite.config.js`.

- **Large request payload errors**
  - Backend is configured with JSON body limit `25mb` (see `Backend/src/app.js`).

---

## Useful Notes

- Backend docs: `Backend/README.md`
- Frontend docs: `frontend/README.md`
- Admin credentials (if applicable): `frontend/ADMIN_CREDENTIALS.md`

Optional helper:

- `tools/create-minimal.ps1` can generate a clean minimal copy for running locally.
