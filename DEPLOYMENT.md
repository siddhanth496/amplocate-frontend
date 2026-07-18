# Deployment — amplocate-frontend

Vite + React single-page app. Talks to the amplocate-backend API.

## Deploy on Vercel (free tier)

1. Push this repo to GitHub.
2. vercel.com → **Add New → Project** → import the `amplocate-frontend` repo.
   Vercel auto-detects Vite (build `npm run build`, output `dist`). The included
   `vercel.json` rewrites all routes to `index.html` for client-side routing.
3. Add an Environment Variable:
   ```
   VITE_API_BASE_URL = https://amplocate-api.onrender.com
   ```
   (your deployed backend URL).
4. Deploy. The backend allows all CORS origins, so no backend change is needed.

## Local dev

```bash
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev                   # http://localhost:5173
```

Run the backend separately (see amplocate-backend). Optimised for a 375×812
mobile viewport — use browser DevTools device emulation.

## Notes

- Any static host works (Netlify, Cloudflare Pages, S3+CloudFront) — just set
  `VITE_API_BASE_URL` at build time and serve `dist/` with SPA fallback to
  `index.html`.
- Env vars are baked in at **build** time; changing `VITE_API_BASE_URL` requires
  a redeploy.
