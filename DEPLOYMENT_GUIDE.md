# Deployment Guide for Hostinger (Shared Hosting)

This project is set up to work on Hostinger plans that **do not** support Node.js applications.

## 🚀 The Architecture
- **Frontend**: Built as a **Static Site (SSG)** and hosted as standard HTML/JS on `meet.thelarasoft.com`.
- **Backend**: Standard Laravel PHP app on `apimeet.thelarasoft.com`.
- **API**: All server-side logic (LiveKit tokens, host actions, file uploads) has been moved to the Laravel backend.

## 1. GitHub Secrets
Go to your GitHub Repository **Settings > Secrets and variables > Actions** and add:

| Secret Name | Example Value |
| :--- | :--- |
| `HOSTINGER_HOST` | `in-mum-web1994.main-hosting.eu` (or your IP) |
| `HOSTINGER_USER` | `u394293657` |
| `HOSTINGER_PASSWORD` | `YOUR_SSH_PASSWORD` |
| `HOSTINGER_PORT` | `65002` |
| `NEXT_PUBLIC_LIVEKIT_URL` | `wss://larameet-xxxx.livekit.cloud` |
| `NEXT_PUBLIC_API_URL` | `https://apimeet.thelarasoft.com/api` |

## 2. Target Directories
- **Frontend**: `domains/meet.thelarasoft.com/public_html`
- **Backend**: `domains/apimeet.thelarasoft.com/public_html`

## 3. Hostinger Configuration

### 🌎 Frontend (meet.thelarasoft.com)
- **Static Export**: The GitHub Action builds the app using `output: 'export'`.
- **Routing**: I added a `.htaccess` file in `frontend/public/` which will automatically handle Next.js client-side routing on the server. No Node.js manager is required.

### 🐘 Backend (apimeet.thelarasoft.com)
1. **Public Folder**: I added a `.htaccess` to the backend root to redirect traffic to the `public/` folder.
2. **Environment**: Manually create the `.env` file in `domains/apimeet.thelarasoft.com/public_html/.env` with your database and LiveKit credentials.
3. **Database**: Ensure you have created the database in HPanel and updated the `.env` file.

## 4. Troubleshooting
- If you get "404 Not Found" on room pages, ensure the `.htaccess` file was uploaded to the root of `meet.thelarasoft.com`.
- Ensure `NEXT_PUBLIC_API_URL` includes `https://`.
