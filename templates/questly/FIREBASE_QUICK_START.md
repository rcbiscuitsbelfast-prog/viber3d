# Firebase Quick Start Guide

## ✅ What's Been Set Up

1. **Firebase Authentication** - Real email/password auth (no more mocks!)
2. **Firebase Storage** - File uploads for thumbnails, audio, etc.
3. **Firebase Firestore** - Already configured for world storage
4. **GitHub Pages Integration** - Environment variables injected during build

## 🚀 What You Need to Do

### Step 1: Get Your Firebase Config

1. Go to https://console.firebase.google.com
2. Select your project (or create one)
3. Click ⚙️ → **Project Settings**
4. Scroll to **"Your apps"** → Click **Web icon** (`</>`)
5. Copy these values from the `firebaseConfig`:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId` (optional)

### Step 2: Enable Firebase Services

**Authentication:**
- Go to **Authentication** → **Get Started**
- Enable **Email/Password** provider

**Firestore:**
- Go to **Firestore Database** → **Create Database**
- Start in **test mode**
- Choose a location

**Storage:**
- Go to **Storage** → **Get Started**
- Start in **test mode**
- Choose same location as Firestore

### Step 3: Add GitHub Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets (click **New repository secret** for each):

```
VITE_FIREBASE_API_KEY = (your apiKey)
VITE_FIREBASE_AUTH_DOMAIN = (your authDomain)
VITE_FIREBASE_PROJECT_ID = (your projectId)
VITE_FIREBASE_STORAGE_BUCKET = (your storageBucket)
VITE_FIREBASE_MESSAGING_SENDER_ID = (your messagingSenderId)
VITE_FIREBASE_APP_ID = (your appId)
VITE_FIREBASE_MEASUREMENT_ID = (your measurementId - optional)
```

**Important:** Names must match exactly (including `VITE_` prefix)!

### Step 4: Push to GitHub

After adding secrets, push any commit to trigger the GitHub Pages workflow. The build will now include your Firebase config.

## 🧪 Testing Locally (Optional)

Create `templates/questly/.env.local`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Then run `pnpm dev` in `templates/questly/`

## 📋 What Works Now

- ✅ Users can sign up with email/password
- ✅ Users can sign in
- ✅ Auth state persists across page refreshes
- ✅ Worlds can be saved to Firestore
- ✅ Thumbnails can be uploaded to Storage
- ✅ Audio files can be uploaded for NPC dialogue

## 🔒 Security Rules Setup

See `FIREBASE_SETUP_GITHUB_PAGES.md` for detailed security rules configuration.

## ❓ Need Help?

Check `FIREBASE_SETUP_GITHUB_PAGES.md` for detailed troubleshooting and security rules.
