# Vercel Deployment Guide

Use this checklist after pushing the full `Track_Time` folder to GitHub.

## 1. Push The Monorepo To GitHub

From the project root:

```bash
git status
git add .
git commit -m "Initial Track Time monorepo"
git branch -M main
git remote add origin https://github.com/userAshwani/Track_Time.git
git push -u origin main
```

If the remote already exists:

```bash
git remote set-url origin https://github.com/userAshwani/Track_Time.git
git push -u origin main
```

## 2. Create The Vercel Project

1. Open Vercel.
2. Import the GitHub repository: `userAshwani/Track_Time`.
3. Set the Vercel project Root Directory to:

```text
web
```

4. Keep the framework as Next.js.
5. Use these commands:

```text
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

The `web/vercel.json` file already contains the matching deployment configuration.

## 3. Add Environment Variables In Vercel

In the Vercel project settings, add these variables:

```env
MONGODB_URI=your_mongodb_connection_string
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
```

Use the same MongoDB URI from your local `web/.env.local`.

## 4. Deploy

After the first deploy completes, open:

```text
https://your-vercel-domain.vercel.app/dashboard
```

The backend API will run on the same Vercel domain:

```text
https://your-vercel-domain.vercel.app/api/tasks
https://your-vercel-domain.vercel.app/api/tasks?timeHorizon=1_Day
```

## 5. Connect The Mobile App To The Live API

After the Vercel deployment is live, create `mobile/.env` locally:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-vercel-domain.vercel.app
```

Then restart Expo:

```bash
npm run start:mobile
```

For local mobile testing before Vercel:

```env
# Android emulator
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000

# Physical phone on same Wi-Fi
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:3000
```

## 6. Important Git Safety Notes

Do not commit these files or folders:

```text
node_modules/
web/.next/
web/.env.local
mobile/.env
.vercel/
```

The root `.gitignore` already protects these paths.
