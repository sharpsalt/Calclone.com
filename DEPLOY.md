Deploying Calclone — Vercel (frontend) + Render (backend)

Overview
- Frontend: deploy static site (Vite) to Vercel.
- Backend: deploy full Node app + background worker to Render (Docker). Use Render-managed Postgres and Redis or your own providers.

Pre-reqs
- GitHub repo containing this code.
- Vercel and Render accounts (connect GitHub).

Files added
- `render.yaml` — Render manifest template (repo root).
- `frontend/vercel.json` — Vercel build config for the frontend (placed inside `frontend/`).

Quick steps — commit & push
1. Commit files and push to GitHub:

```bash
git add render.yaml frontend/vercel.json DEPLOY.md
git commit -m "chore: add deploy config for Vercel (frontend) and Render (backend)"
git push origin main
```

Vercel — frontend (recommended)
1. In Vercel, click "New Project" → Import Git Repository.
2. When prompted for root directory, set it to `frontend` (important for monorepos).
3. Confirm Build Command: `npm run build` and Output Directory: `dist` (Vite default).
4. Add Environment Variables (Settings → Environment Variables):
   - `PUBLIC_BASE_URL` = https://<your-vercel-domain>
   - `API_BASE_URL` = https://<your-backend-render-url>  (set this after backend is deployed)
5. Deploy (Vercel will run `npm ci` then `npm run build`).

Render — backend + worker
Option A: Use `render.yaml` (push + import)
1. In Render, create a new account service and choose "Connect a repository".
2. Render will detect `render.yaml` in the repo — follow prompts to create services.
3. Replace `<your-github-repo>` in `render.yaml` if needed or create services manually in the Render UI.

Option B: Create services manually in Render UI
1. Create a new **Web Service**:
   - Root dir: `backend`
   - Environment: Docker (use `backend/Dockerfile`) or Node (you can set Build Command `npm run build` and Start Command `npm run start`).
   - Set Auto-Deploy from the branch you push.
2. Create a new **Background Worker**:
   - Root dir: `backend`
   - Start Command: `npm run worker:emails`
3. Create a **Managed Postgres** in Render (Dashboard → Databases → Create Database).
   - Copy `DATABASE_URL` from the DB details and add it to both the web service and worker service environment variables.
4. Create a **Redis** instance (Render's Redis or an external provider), get `REDIS_URL` and set it in both services.

Required environment variables (backend service + worker)
- `DATABASE_URL` — Postgres connection string (prod)
- `REPLICA_DATABASE_URL` — optional read-replica
- `REDIS_URL` — Redis connection
- `NODE_ENV=production`
- `API_BASE_URL` — backend public URL (e.g., https://api.calclone.example)
- `PUBLIC_BASE_URL` — frontend URL (e.g., https://calclone.example)
- Email provider secrets (one of the following):
  - SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - or `SENDGRID_API_KEY`
  - or `RESEND_API_KEY`
- `FROM_EMAIL`, `DEV_ADMIN_EMAIL`, `HOST_NOTIFICATION_EMAIL`, `DEFAULT_USERNAME`

Run migrations / seed
- From Render: open a one-off shell or job and run:

```bash
cd backend
npm ci
npm run migrate
npm run seed   # optional: seed demo data
```

Post-deploy checks
- Confirm web service responds: `curl $API_BASE_URL/health` (if health endpoint available) or visit the public app.
- Confirm worker is running and able to connect to Redis (check logs).
- Create a test booking and verify email delivery (MailHog for staging, SMTP/SendGrid/Resend for production).

Notes & next steps
- Keep secrets in the Render/Vercel UI — do not commit them to the repo.
- If you want, I can:
  - Create GitHub Actions to auto-deploy, or
  - Generate a Render `render.yaml` with exact repo name/branch, or
  - Provision Render Postgres/Redis (requires Render account access).

If you'd like, I can now:
- (A) Fill `render.yaml` with your GitHub repo path and finalize it, push, and walk you through Render UI steps, or
- (B) Walk you through connecting the frontend project to Vercel interactively.

Tell me which of (A) or (B) you want next and I'll proceed.