# Message Board

A small message board built with Node.js, Express, plain HTML/CSS/JavaScript, and optional Supabase storage. The frontend and API are served from the same Express server. No login is required.

## Run locally

Requirements: Node.js 18 or newer and npm.

```sh
npm install
npm start
```

Open <http://localhost:3000>. Without Supabase environment variables, posts are kept in memory and disappear when the server restarts.

## Use Supabase

Create a Supabase project, then run the SQL in [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor. Add the project URL and anon key to a local `.env` file using [`.env.example`](.env.example) as a template. The key stays on the server; do not put it in `public/` or commit `.env`.

Restart the app after setting the variables. When both values are present, posts are read from and written to the Supabase `posts` table. The schema grants public read and insert access for this no-login app, so anyone who can reach the app can post. Apply appropriate rate limits or access controls before deploying it publicly.

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
