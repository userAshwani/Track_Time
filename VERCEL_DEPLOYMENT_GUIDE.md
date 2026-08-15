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
```

Use the same MongoDB URI from your local `web/.env.local`.

Also add the auth and Firebase variables used by the production login flow:

```env
AUTH_SECRET=use_a_long_random_secret_at_least_32_characters
SUPERADMIN_EMAIL=your_superadmin_email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_gmail_address
SMTP_APP_PASSWORD=your_gmail_app_password
EMAIL_FROM="Track Time <your_gmail_address>"
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
FIREBASE_WEB_API_KEY=your_firebase_web_api_key
```

In Firebase Console, enable Authentication > Sign-in method > Google, then add your Vercel domain, for example `track-time-web-git-main-codebyashwani.vercel.app`, under Authentication > Settings > Authorized domains.

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
