# Track Time

Track Time is a monorepo for a next-generation time and task management platform. The product is built around four planning horizons: `1_Day`, `1_Week`, `1_Month`, and `1_Year`.

The platform currently contains a production-ready Next.js web application with API routes, MongoDB persistence, Upstash Redis caching, and an Expo mobile client that consumes the same backend API.

## Project Structure

```text
Track_Time/
├─ web/                 Next.js App Router web app and API backend
│  ├─ lib/              MongoDB and Redis utilities
│  ├─ models/           Mongoose data models
│  ├─ src/app/          Next.js pages and API routes
│  └─ vercel.json       Vercel deployment configuration for the web app
├─ mobile/              Expo React Native mobile app
│  ├─ screens/          Mobile screens
│  └─ services/         API client utilities
├─ package.json         Root npm workspace configuration
├─ package-lock.json    Root lockfile
└─ .gitignore           Root ignore rules for both apps
```

## Web App

The web app lives in `web/`.

Current capabilities:

- Enterprise-style dashboard at `/dashboard`
- Unified task API at `/api/tasks`
- `GET /api/tasks`
- `GET /api/tasks?timeHorizon=1_Day`
- `POST /api/tasks`
- MongoDB connection caching for Vercel serverless runtime
- Upstash Redis read-through caching for task lists
- Mongoose Task model with status, time horizon, time allocation, time spent, alarm time, and push token fields

## Mobile App

The mobile app lives in `mobile/`.

Current capabilities:

- Expo React Native app
- Shared API client in `mobile/services/api.js`
- `fetchTasksByHorizon(horizon)`
- `createTask(taskData)`
- Sample `HomeScreen` that loads and displays `1_Day` tasks

## Local Development

Install dependencies from the root:

```bash
npm install
```

Run the Next.js web app:

```bash
npm run dev:web
```

Open:

```text
http://localhost:3000/dashboard
```

Run the Expo mobile app:

```bash
npm run start:mobile
```

## Environment Variables

Local environment files are intentionally ignored by Git.

For the web app, create `web/.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

For the mobile app, create `mobile/.env` when you have a deployed web domain:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-vercel-domain.vercel.app
```

## Validation

From the root:

```bash
npm run lint:web
npm run build:web
npm run typecheck:mobile
```

## GitHub Repository

This project is intended to be committed and pushed from the root directory only. The `web` and `mobile` folders are app folders, not separate Git repositories.
