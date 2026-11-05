# Message Board

A small message board built with Node.js, Express, plain HTML/CSS/JavaScript, and Supabase storage. The frontend and API are served from the same Express server. No login is required.

## Run locally

Requirements: Node.js 18 or newer and npm.

1. Create a Supabase project.
2. Run the SQL in [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor. This creates the table if needed, enables RLS, and removes the app's former public policies without deleting rows.
3. Copy [`.env.example`](.env.example) to `.env` and set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` from the project's API settings.
4. Start the server:

   ```sh
   npm install
   npm start
   ```

Open <http://localhost:3000>. The Supabase client and secret key are used only by the Express server; never put the secret key in `public/` or commit `.env`. The server validates posts and accesses the table with the secret key, which bypasses RLS. The schema grants `service_role` only the `SELECT` and `INSERT` table privileges needed by the API. RLS remains enabled, and this setup does not add public policies.

## Test the API

With the server running, create a post:

```sh
curl -X POST http://localhost:3000/api/posts \
	-H 'Content-Type: application/json' \
	-d '{"name":"Ada","message":"Hello, board!"}'
```

Fetch posts (newest first):

```sh
curl http://localhost:3000/api/posts
```

`POST /api/posts` requires a non-empty `name` (up to 80 characters) and `message` (up to 2,000 characters). It responds with the created post and HTTP `201`; `GET /api/posts` responds with an array of posts.

### Test without losing existing data

To avoid changing production data, first test against a separate Supabase project or a database backup. Applying the schema is non-destructive: it uses `CREATE TABLE IF NOT EXISTS` and only removes the two named public policies; it does not truncate or drop the table. `GET /api/posts` is read-only. A successful `POST` adds one row, so use a clearly identifiable test message and leave existing rows untouched. Do not run `supabase db reset`, `TRUNCATE`, or `DROP TABLE` against a database whose posts you need to keep.
