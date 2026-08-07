# Track Time

Track Time is a monorepo for a next-generation time and task management platform. It is designed around four time horizons:

- `1_Day` for daily execution
- `1_Week` for weekly commitments
- `1_Month` for monthly delivery planning
- `1_Year` for annual strategic work

The repository contains a Next.js web application that also acts as the backend API, plus an Expo React Native mobile application that consumes the same API.

## Tech Stack

- Web and backend: Next.js App Router
- API layer: Next.js Route Handlers under `web/src/app/api`
- Database: MongoDB with Mongoose
- Cache: Upstash Redis
- Authentication: Email OTP with httpOnly session cookies
- Email delivery: SMTP through Nodemailer
- Mobile: React Native with Expo
- Styling: Tailwind CSS for the web dashboard
- Repository style: npm workspaces monorepo

## Folder Structure

```text
Track_Time/
├─ web/
│  ├─ lib/
│  │  ├─ dbConnect.js        MongoDB serverless connection utility
│  │  └─ redis.js            Upstash Redis utility
│  ├─ models/
│  │  ├─ Task.js             Mongoose Task schema
│  │  ├─ User.js             Auth user and role schema
│  │  ├─ OtpToken.js         Email OTP schema
│  │  └─ Session.js          Login session schema
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ api/tasks/       GET and POST task API routes
│  │  │  └─ dashboard/       Main web dashboard
│  │  └─ components/
│  │     └─ TaskCard.js      Dashboard task card component
│  ├─ package.json
│  └─ vercel.json
├─ mobile/
│  ├─ screens/
│  │  └─ HomeScreen.js       Sample mobile screen for daily tasks
│  ├─ services/
│  │  └─ api.js              Mobile API client
│  ├─ App.tsx
│  └─ package.json
├─ package.json              Root workspace scripts
├─ package-lock.json         Root npm lockfile
├─ .gitignore                Ignore rules for both apps
└─ README.md
```

## Why There Is A Root node_modules Folder

This project uses npm workspaces. When you run `npm install` from the root, npm installs and hoists workspace dependencies into the root `node_modules` folder. That root `node_modules` belongs to the full monorepo and supports both `web` and `mobile`.

You may also see `mobile/node_modules` because Expo created/install-managed mobile dependencies during scaffolding. Both `node_modules` folders are local development artifacts.

They are ignored by Git and should not be pushed to GitHub.

## First-Time Setup

From the root folder:

```bash
npm install
```

This installs dependencies for the root workspace, `web`, and `mobile`.

## Environment Variables

Environment files are ignored by Git. Create them locally and add the production values in Vercel.

### Web Environment

Create:

```text
web/.env.local
```

Use:

```env
MONGODB_URI=your_mongodb_connection_string
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_gmail_address
SMTP_APP_PASSWORD=your_gmail_app_password
EMAIL_FROM="Track Time <your_gmail_address>"
AUTH_SECRET=use_a_long_random_secret_at_least_32_characters
SUPERADMIN_EMAIL=your_superadmin_email
```

### Mobile Environment

After the web app is deployed on Vercel, create:

```text
mobile/.env
```

Use:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-vercel-domain.vercel.app
```

For local Android emulator testing:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
```

For a physical phone on the same Wi-Fi:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:3000
```

## Run The Web App Locally

From the root:

```bash
npm run dev:web
```

Open:

```text
http://localhost:3000/dashboard
```

If you are not logged in, the app redirects to:

```text
http://localhost:3000/login
```

The API runs on the same local server:

```text
http://localhost:3000/api/tasks
http://localhost:3000/api/tasks?timeHorizon=1_Day
```

## Run The Mobile App Locally

From the root:

```bash
npm run start:mobile
```

Then use the Expo terminal options to open Android, iOS, or Expo Go.

Android emulator:

```bash
npm run android:mobile
```

iOS simulator on macOS:

```bash
npm run ios:mobile
```

Expo web preview:

```bash
npm run web:mobile
```

## Validate Before Pushing

From the root:

```bash
npm run lint:web
npm run build:web
npm run typecheck:mobile
```

## API Overview

### Authentication

Request OTP:

```http
POST /api/auth/request-otp
```

Body:

```json
{
  "email": "user@example.com"
}
```

Verify OTP:

```http
POST /api/auth/verify-otp
```

Body:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

If the email is new, the user is created automatically. If the email already exists, the user is logged in. The configured `SUPERADMIN_EMAIL` receives the `superadmin` role.

### Fetch Tasks

```http
GET /api/tasks
```

Optional filter:

```http
GET /api/tasks?timeHorizon=1_Day
```

Valid `timeHorizon` values:

```text
1_Day
1_Week
1_Month
1_Year
```

### Create Task

```http
POST /api/tasks
```

Example body:

```json
{
  "title": "Prepare daily operations report",
  "description": "Compile execution updates and outstanding blockers.",
  "status": "pending",
  "timeHorizon": "1_Day",
  "timeAllocated": 120,
  "timeSpent": 30,
  "isAlarmSet": true,
  "alarmTime": "2026-08-08T09:00:00.000Z",
  "pushToken": "expo_push_token_here"
}
```

`timeAllocated` and `timeSpent` are stored in minutes.

## Deploy Web To Vercel

1. Push this repository to GitHub.
2. In Vercel, import the GitHub repository.
3. Set the Vercel Root Directory to:

```text
web
```

4. Keep Framework Preset as Next.js.
5. Use:

```text
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

6. Add these environment variables in Vercel:

```env
MONGODB_URI=your_mongodb_connection_string
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_gmail_address
SMTP_APP_PASSWORD=your_gmail_app_password
EMAIL_FROM="Track Time <your_gmail_address>"
AUTH_SECRET=use_a_long_random_secret_at_least_32_characters
SUPERADMIN_EMAIL=your_superadmin_email
```

7. Deploy.
8. Open:

```text
https://your-vercel-domain.vercel.app/dashboard
```

Login page:

```text
https://your-vercel-domain.vercel.app/login
```

Superadmin analytics:

```text
https://your-vercel-domain.vercel.app/superadmin
```

The backend API will be available on the same Vercel domain:

```text
https://your-vercel-domain.vercel.app/api/tasks
```

## Connect Mobile To Vercel API

After Vercel deployment, copy your Vercel domain into:

```text
mobile/.env
```

Example:

```env
EXPO_PUBLIC_API_BASE_URL=https://track-time.vercel.app
```

Restart Expo after changing this value:

```bash
npm run start:mobile
```

## Git Commands

From the root:

```bash
git status
git add .
git commit -m "Update Track Time"
git push
```

The repository should be managed only from the root. The `web` and `mobile` folders are not separate Git repositories.
