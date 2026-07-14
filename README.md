# Amplocate — Frontend

React web app for Amplocate: reliable EV charger discovery, community verification, and risk-free trip planning.

## Stack
React 19 · Vite · Tailwind CSS v4 · React Router v7 · Leaflet (OpenStreetMap/Carto tiles) · Lucide icons

## Local development
```bash
npm install
npm run dev            # http://localhost:5173
```
Point it at your backend with a `.env` file:
```
VITE_API_BASE_URL=http://localhost:8000
```

## Build
```bash
npm run build          # outputs to dist/
```

## Deploy (Vercel)
Import this repo in Vercel — framework preset **Vite** is auto-detected.
Set the environment variable `VITE_API_BASE_URL` to your backend URL
(e.g. `https://amplocate-api.onrender.com`), then deploy.

Backend repo: amplocate-backend (FastAPI).
