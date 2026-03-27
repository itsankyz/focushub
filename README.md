<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Shivam Optical - Visionary Curator

This app supports:
- local-only mode (data saved on your system via browser storage)
- hybrid mode (InfinityFree cloud database + local backup cache)

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Enable InfinityFree Cloud + Local Backup

1. Copy `.env.example` to `.env.local`
2. Set `VITE_API_BASE_URL` to your deployed PHP API path
3. Upload files from `infinityfree-api` to your InfinityFree hosting (for example `/htdocs/api`)
4. Copy `infinityfree-api/config.example.php` to `config.php` and set DB credentials + secret
5. Set `allowed_origin` in `config.php` to your Vercel domain (example: `https://your-app.vercel.app`)
6. Run SQL from `infinityfree-api/schema.sql` in phpMyAdmin
7. Verify API is up: `GET https://your-domain.infinityfreeapp.com/api/health`
8. In Vercel project settings, add env var:
   - `VITE_API_BASE_URL=https://your-domain.infinityfreeapp.com/api`

API routes expected by frontend:
- `POST /auth/register`
- `POST /auth/login`
- `GET /sync/pull`
- `POST /sync/push`
- `GET /health`

## Deploy frontend to Vercel

1. Push this project to GitHub
2. Import the repository in Vercel
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy (SPA rewrite is already configured in `vercel.json`)

## Production completion checklist

- [ ] InfinityFree API files uploaded (`index.php`, `db.php`, `.htaccess`, `config.php`)
- [ ] MySQL schema imported (`infinityfree-api/schema.sql`)
- [ ] `jwt_secret` changed to a long random secret
- [ ] `allowed_origin` set to exact Vercel URL
- [ ] Vercel env var `VITE_API_BASE_URL` configured
- [ ] Create first admin account from app login/register screen
- [ ] Verify create/update flows for customers, sales, prescriptions
- [ ] Verify customer Excel export with OD/OS/PD/frame/lens/total columns
- [ ] Test logout/login and data persistence after page refresh
