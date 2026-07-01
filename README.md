# BuildX AI

AI-powered construction engineering assistant. Upload site photos, map your location, enter building specs, and get a comprehensive engineering blueprint with material estimates — powered by Google Gemini.

**Live repo:** [github.com/mahimapaseda/ThinethBuildXAI](https://github.com/mahimapaseda/ThinethBuildXAI)

## Features

- 7-phase wizard: Welcome → Map → Photos → Specs → Validate → Analyze → Results
- Google Gemini site analysis with engineering cross-validation (IS 456 / ACI 318)
- Material quantity & cost estimates
- User accounts, project save/load, admin dashboard
- Dark / light theme, mobile-responsive UI
- **Progressive Web App (PWA)** — install on Android, Windows, macOS, and iOS (Add to Home Screen)

## Quick start (local)

```bash
npm install
npm rebuild better-sqlite3   # required after Node version changes
cp .env.example .env.local   # then edit secrets (see below)
npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:3001/api (proxied via Vite in dev)

## Environment variables

Copy `.env.example` to `.env.local` (gitignored):

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Signing key for auth tokens (required in production) |
| `ADMIN_EMAIL` | Email allowed to become admin on first registration |
| `ADMIN_SECRET` | Secret code entered at signup to grant admin |
| `CORS_ORIGINS` | Comma-separated allowed frontend URLs (production) |
| `VITE_GEMINI_API_KEY` | Optional dev convenience; users can also enter key in the app UI |
| `VITE_API_URL` | API base URL (default `/api`; set to full URL when frontend and backend are on different hosts) |

**Never commit real API keys or `.env.local`.**

## Admin setup

1. Set `ADMIN_EMAIL` and `ADMIN_SECRET` in `.env.local`.
2. Register a new account with that email and enter the admin setup code on the signup form.
3. Only the **first** account with a valid admin secret becomes admin.

## Production deployment

### Vercel (recommended — frontend + API on one domain)

This repo includes `vercel.json` and `api/index.js` so the React PWA and Express API deploy together.

1. **Push to GitHub** (if not already): `https://github.com/mahimapaseda/ThinethBuildXAI`
2. **Import the repo** at [vercel.com/new](https://vercel.com/new) and sign in with **thinethdewmitha123@gmail.com** (or your Vercel account).
3. **Environment variables** — in Vercel → Project → Settings → Environment Variables, add:

| Variable | Value |
|----------|--------|
| `JWT_SECRET` | Random 64-char hex (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `ADMIN_EMAIL` | `thinethdewmitha123@gmail.com` |
| `ADMIN_SECRET` | Your private admin setup code |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full contents of `firebase-adminsdk-*.json` (one line) |
| `VITE_FIREBASE_API_KEY` | From Firebase Console → Project settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g. `gen-lang-client-09459610-efabb.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `gen-lang-client-09459610-efabb` |
| `VITE_FIREBASE_STORAGE_BUCKET` | From Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase config |
| `VITE_FIREBASE_APP_ID` | From Firebase config |
| `VITE_API_URL` | `/api` (same-origin on Vercel) |

Run `npm run vercel:env-check` for a checklist.

4. **Firebase authorized domains** — Firebase Console → Authentication → Settings → Authorized domains → add:
   - `your-project.vercel.app`
   - Any custom domain you attach in Vercel

5. **Deploy** — Vercel builds with `npm run build` and serves `dist/` plus the API at `/api/*`.

6. **Verify** — open `https://your-app.vercel.app/api/health` (should return `{"ok":true,...}`).

**Live deployment:** [https://thineth-buildx-ai.vercel.app](https://thineth-buildx-ai.vercel.app)  
Vercel project: `mahima-pasedas-projects/thineth-buildx-ai`

**CLI deploy** (optional):

```bash
npx vercel login
npx vercel --prod
```

**Note:** For durable production data, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from [Turso](https://turso.tech) (free tier). Without Turso, SQLite uses serverless `/tmp` (ephemeral across cold starts).

### Other hosts (split frontend + backend)

1. Deploy `server/` to a Node host (Railway, Render, Fly.io, VPS, etc.).
2. Set `NODE_ENV=production`, `JWT_SECRET`, `CORS_ORIGINS`, and admin env vars.
3. Build the frontend with `VITE_API_URL=https://your-api.example.com/api`.
4. Deploy the `dist/` folder to Netlify or similar.

Static-only deploys (frontend without backend) will break auth, save project, and admin features.

### PWA (installable app)

BuildX AI ships as a Progressive Web App. **HTTPS is required** in production for install prompts and service workers.

| Platform | How to install |
|----------|----------------|
| **Android (Chrome)** | Tap **Install** in the in-app banner, or browser menu → *Install app* |
| **Windows / macOS (Chrome, Edge)** | Click **Install** in the banner or the install icon in the address bar |
| **iOS (Safari)** | Tap **Share** → **Add to Home Screen** (banner shows instructions) |

After deploy, verify in Chrome DevTools → **Application** → **Manifest** and **Service workers**.

Icons are generated automatically during `npm run build` via `npm run generate:pwa-icons`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend + Vite dev server |
| `npm run server` | Backend only |
| `npm run dev:ui` | Frontend only |
| `npm run build` | Generate PWA icons + production frontend build |
| `npm run generate:pwa-icons` | Regenerate PNG icons from `public/icon.svg` |
| `npm run preview` | Preview production build |
| `npm run vercel:env-check` | List env vars needed for Vercel |

## Security notes

- SQLite database (`server/buildx.db`) and uploads are gitignored — do not commit user data.
- Rotate any API key that was shared publicly.
- Use a strong random `JWT_SECRET` in production.

## License

MIT (or as specified by repository owner)
