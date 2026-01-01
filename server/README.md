# Wedding RSVP API (Express + MySQL)

Backend-only REST API for managing wedding invitations & RSVP submissions.

## Setup

1. Create `.env` from `.env.example`.
2. Install deps:

```bash
cd server
npm install
```

3. Start:

```bash
npm run dev
```

Health check: `GET http://localhost:4000/health`

## Deploy to Vercel

Vercel does **not** run long-lived Node servers (no `app.listen()` in production). Instead, this project exports the Express app as a **Serverless Function**.

This repository already contains the needed files:

-   [api/index.js](api/index.js) (Vercel Function entry)
-   [src/app.js](src/app.js) (exports the Express app)
-   [vercel.json](vercel.json) (routes `/guest`, `/admin`, `/superadmin` to the function)

### Steps

1. In Vercel, click **Add New → Project**.
2. Import your Git repo.
3. Set **Root Directory** to `server`.
4. Set environment variables (Project Settings → Environment Variables):

-   `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
-   `SUPERADMIN_API_KEY`, `ADMIN_API_KEY`
-   `INVITE_URL_BASE` (optional)

5. Deploy.

After deploy, your endpoints will be available at:

-   `https://<your-project>.vercel.app/health`
-   `https://<your-project>.vercel.app/guest/...`
-   `https://<your-project>.vercel.app/admin/...`
-   `https://<your-project>.vercel.app/superadmin/...`

### MySQL connectivity note

Your MySQL server must be reachable from Vercel (public host, correct firewall/allowlist, etc.). If your DB is private/network-restricted, you’ll need to expose it securely or use a hosted MySQL provider / proxy that supports serverless environments.

## Auth

Admin / Superadmin endpoints require an API key:

-   Header: `Authorization: Bearer <KEY>`
-   Or: `x-api-key: <KEY>`

Keys are read from env:

-   `SUPERADMIN_API_KEY`
-   `ADMIN_API_KEY`

## Endpoints

### Super Admin

Create invitation (generates 32-char token, returns invitation URL):

```bash
curl -X POST "http://localhost:4000/superadmin/invitations" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPERADMIN_API_KEY" \
  -d '{
    "name": "Christopher & Felicia",
    "number_of_guests": 2,
    "is_family": true,
    "type": "both"
  }'
```

Soft-delete invitation by token:

```bash
curl -X DELETE "http://localhost:4000/superadmin/invitations/<url_token>" \
  -H "Authorization: Bearer $SUPERADMIN_API_KEY"
```

### Guest (public, token-based)

Fetch invitation (no database IDs exposed):

```bash
curl "http://localhost:4000/guest/invitations/<url_token>"
```

Submit RSVP (blocked if `responded_at` already set):

```bash
curl -X POST "http://localhost:4000/guest/invitations/<url_token>/rsvp" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Chris",
    "is_attending": true,
    "teapai": "malam",
    "wishes": "Congratulations!"
  }'
```

Notes:

-   `teapai` is required if the invitation is `is_family = true`.
-   Captures `submitted_ip` and `user_agent`.

### Admin (event day)

List invitations with filters:

```bash
curl "http://localhost:4000/admin/invitations?is_attending=true&type=both" \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

Update event-day fields:

```bash
curl -X PATCH "http://localhost:4000/admin/invitations/<url_token>" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -d '{
    "actual_attendance": 2,
    "gave_gift": true,
    "admin_note": "Arrived at 19:10"
  }'
```

Summary (attendance + souvenir count):

```bash
curl "http://localhost:4000/admin/summary" \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

Filter params supported on admin endpoints:

-   `is_attending` (true/false)
-   `is_family` (true/false)
-   `type` (resepsi|holy_matrimony|both)
