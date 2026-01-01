This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

## Backend-only API

This is a backend-only Next.js (App Router) API project. The root page returns 404 by design.

### Environment

Create a `.env.local` file (or set env vars in your host) based on `.env.example`.

MySQL connection (used server-side only):

-   `MYSQL_HOST`
-   `MYSQL_PORT` (optional, defaults to `3306`)
-   `MYSQL_USER`
-   `MYSQL_PASSWORD`
-   `MYSQL_DATABASE`

API protection:

-   `SUPERADMIN_API_KEY`
-   `ADMIN_API_KEY`

Invitation URL generation (superadmin create response):

-   `INVITE_BASE_URL` (e.g. `https://your-domain.com`)
-   `INVITE_PATH_PREFIX` (default `/invite`)

The MySQL pool is created in [src/db/connection.ts](src/db/connection.ts) (loads env via `dotenv`).

### API Routes

-   `POST /api/superadmin/invitations` (protected)
-   `DELETE /api/superadmin/invitations/:token` (protected, soft delete)
-   `GET /api/guest/invitations/:token` (public)
-   `PATCH /api/guest/invitations/:token` (public, prevents double submit)
-   `GET /api/admin/invitations` (protected, supports filters)
-   `PATCH /api/admin/invitations/:token` (protected)
-   `GET /api/admin/summary` (protected, supports filters)

### Curl Examples

Create an invitation (superadmin):

```bash
curl -X POST http://localhost:3000/api/superadmin/invitations \
	-H "Authorization: Bearer $SUPERADMIN_API_KEY" \
	-H "Content-Type: application/json" \
	-d '{
		"name": "John Doe",
		"number_of_guests": 2,
		"is_family": true,
		"type": "both"
	}'
```

Fetch invitation (guest):

```bash
curl http://localhost:3000/api/guest/invitations/<token>
```

Submit RSVP (guest):

```bash
curl -X PATCH http://localhost:3000/api/guest/invitations/<token> \
	-H "Content-Type: application/json" \
	-d '{
		"display_name": "John & Family",
		"is_attending": "yes",
		"teapai": "pagi",
		"wishes": "Congratulations!"
	}'
```

Admin list (filters are optional):

```bash
curl "http://localhost:3000/api/admin/invitations?is_attending=yes&type=both" \
	-H "Authorization: Bearer $ADMIN_API_KEY"
```

Admin update event-day fields:

```bash
curl -X PATCH http://localhost:3000/api/admin/invitations/<token> \
	-H "Authorization: Bearer $ADMIN_API_KEY" \
	-H "Content-Type: application/json" \
	-d '{
		"actual_attendance": 2,
		"gave_gift": true,
		"admin_note": "Arrived at 19:10"
	}'
```

Admin summary:

```bash
curl "http://localhost:3000/api/admin/summary" \
	-H "Authorization: Bearer $ADMIN_API_KEY"
```

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
