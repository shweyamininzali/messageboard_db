# Message Board

A small real-time chat room built with Node.js, Express, plain HTML/CSS/JavaScript, and Supabase. Messages are persisted in the `posts` table and delivered to connected browsers through Supabase Realtime and a server-sent event stream. No login is required; the display name is supplied with each message.

## Run locally

Requirements: Node.js 18 or newer and npm.

1. Create a Supabase project.
2. Run the SQL in [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor. This creates the table if needed, enables RLS, removes the app's former public policies without deleting rows, and adds the table to Supabase Realtime's publication.
3. Copy [`.env.example`](.env.example) to `.env` and set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` from the project's API settings.
4. Start the server:

   ```sh
   npm install
   npm start
   ```

Open <http://localhost:3000>. The Supabase client and secret key are used only by the Express server; never put the secret key in `public/` or commit `.env`. The server validates messages and accesses the table with the secret key, which bypasses RLS. The schema grants `service_role` only the `SELECT` and `INSERT` table privileges needed by the API. RLS remains enabled, and this setup does not add public policies. The API returns the most recent 100 messages; all messages remain stored in Supabase.

The browser opens `/api/posts/stream` to receive new messages. The Express service maintains the Supabase Realtime subscription and forwards inserts to its connected browsers; the secret key is never sent to the browser. When hosting on Render, use a long-running Web Service (not a static site) and set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in its Environment settings.

## Test the chat

With the server running, create a post:

```sh
curl -X POST http://localhost:3000/api/posts \
	-H 'Content-Type: application/json' \
	-d '{"name":"Ada","message":"Hello, board!"}'
```

Fetch recent messages:

```sh
curl http://localhost:3000/api/posts
```

`POST /api/posts` requires a non-empty `name` (up to 80 characters) and `message` (up to 2,000 characters). It responds with the created message and HTTP `201`; `GET /api/posts` responds with an array of the latest 100 messages. Open the chat in two browser windows to check that a message appears in both without refreshing.

### Test without losing existing data

To avoid changing production data, first test against a separate Supabase project or a database backup. Applying the schema is non-destructive: it uses `CREATE TABLE IF NOT EXISTS` and only removes the two named public policies; it does not truncate or drop the table. `GET /api/posts` is read-only. A successful `POST` adds one row, so use a clearly identifiable test message and leave existing rows untouched. Do not run `supabase db reset`, `TRUNCATE`, or `DROP TABLE` against a database whose posts you need to keep.
