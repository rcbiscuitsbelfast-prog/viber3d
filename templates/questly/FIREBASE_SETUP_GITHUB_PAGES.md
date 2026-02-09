# Firebase Setup for GitHub Pages

This guide will help you set up Firebase Authentication and Storage for your Questly app deployed on GitHub Pages.

## Prerequisites

1. A Firebase project (create one at https://console.firebase.google.com)
2. GitHub repository with GitHub Pages enabled
3. Access to GitHub repository settings

## Step 1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll down to **"Your apps"** section
5. If you don't have a web app yet:
   - Click the **Web icon** (`</>`)
   - Register your app with a nickname (e.g., "Questly Web")
   - Copy the `firebaseConfig` object

You'll need these values:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`
- `measurementId` (optional, for Analytics)

## Step 2: Enable Firebase Services

### Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** provider:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"

### Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Start in **test mode** (for now - we'll add security rules later)
4. Choose a location close to your users
5. Click **Enable**

### Enable Storage

1. In Firebase Console, go to **Storage**
2. Click **Get Started**
3. Start in **test mode** (for now)
4. Choose the same location as Firestore
5. Click **Done**

## Step 3: Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each Firebase config value:

Add these secrets:
- `VITE_FIREBASE_API_KEY` = your `apiKey`
- `VITE_FIREBASE_AUTH_DOMAIN` = your `authDomain`
- `VITE_FIREBASE_PROJECT_ID` = your `projectId`
- `VITE_FIREBASE_STORAGE_BUCKET` = your `storageBucket`
- `VITE_FIREBASE_MESSAGING_SENDER_ID` = your `messagingSenderId`
- `VITE_FIREBASE_APP_ID` = your `appId`
- `VITE_FIREBASE_MEASUREMENT_ID` = your `measurementId` (optional)

**Important:** The secret names must match exactly (including `VITE_` prefix)!

## Step 4: Configure Firestore Security Rules

1. In Firebase Console, go to **Firestore Database** → **Rules**
2. Update the rules to allow authenticated users:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Worlds collection
    match /worlds/{worldId} {
      // Allow read if public or owner
      allow read: if resource.data.metadata.isPublic == true 
                  || resource.data.metadata.userId == request.auth.uid;
      
      // Allow write if authenticated and owner
      allow write: if request.auth != null 
                   && (request.resource.data.metadata.userId == request.auth.uid
                       || !exists(/databases/$(database)/documents/worlds/$(worldId)));
    }
  }
}
```

3. Click **Publish**

## Step 5: Configure Storage Security Rules

1. In Firebase Console, go to **Storage** → **Rules**
2. Update the rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // World thumbnails
    match /worlds/thumbnails/{worldId} {
      allow read: if true; // Public read
      allow write: if request.auth != null; // Authenticated write
    }
    
    // User audio files
    match /users/{userId}/audio/{audioId} {
      allow read: if true; // Public read
      allow write: if request.auth != null && request.auth.uid == userId; // Own files only
    }
  }
}
```

3. Click **Publish**

## Step 6: Test the Setup

1. Push a commit to trigger the GitHub Pages workflow
2. Wait for the deployment to complete
3. Visit your GitHub Pages site
4. Try signing up with a test account
5. Check the browser console for any Firebase errors

## Troubleshooting

### "Firebase not configured" Message

- Check that all GitHub Secrets are set correctly
- Verify secret names match exactly (case-sensitive)
- Make sure secrets start with `VITE_` prefix
- Re-run the GitHub Actions workflow after adding secrets

### Authentication Not Working

- Check Firebase Console → Authentication → Users (should see new users)
- Check browser console for errors
- Verify Email/Password provider is enabled
- Check Firestore rules allow authenticated writes

### Storage Upload Fails

- Check Storage rules allow authenticated writes
- Verify Storage is enabled in Firebase Console
- Check browser console for specific error messages
- Ensure file size is within limits (default: 5MB per file)

### Build Fails on GitHub Actions

- Check Actions tab for build logs
- Verify all secrets are set (missing secrets cause build failures)
- Check that `pnpm build` completes successfully locally first

## Local Development Setup

For local development, create a `.env.local` file in `templates/questly/`:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Important:** Add `.env.local` to `.gitignore` to keep credentials secure!

## Next Steps

Once Firebase is configured:

1. ✅ Users can sign up and sign in
2. ✅ Worlds can be saved to Firestore
3. ✅ Thumbnails can be uploaded to Storage
4. ✅ Audio files (NPC dialogue) can be uploaded
5. ✅ Worlds can be shared (public/private)

## Security Notes

- The Firebase config values (API keys, etc.) are safe to expose in client-side code
- Firebase Security Rules protect your data (not the config)
- Always use proper security rules in production
- Consider enabling App Check for additional security

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Firebase Console for service status
3. Verify all secrets are set correctly
4. Review Firebase Security Rules
