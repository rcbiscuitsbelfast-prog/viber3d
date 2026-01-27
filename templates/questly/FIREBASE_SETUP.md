# Firebase Setup Guide

## Overview

Questly now supports Firebase Firestore for cloud storage of world configurations. All data is stored locally in the browser (localStorage) by default, with optional cloud storage via Firebase.

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter project name (e.g., "questly")
4. Follow the setup wizard

### 2. Enable Firestore

1. In Firebase Console, go to "Firestore Database"
2. Click "Create Database"
3. Start in **test mode** (we'll add security rules later)
4. Choose a location close to your users

### 3. Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname
5. Copy the `firebaseConfig` object

### 4. Set Environment Variables

Create a `.env.local` file in `templates/questly/`:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important:** Add `.env.local` to `.gitignore` to keep credentials secure!

### 5. Firestore Security Rules (Optional - for later)

When you're ready to add authentication, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Worlds collection
    match /worlds/{worldId} {
      // Allow read if public or owner
      allow read: if resource.data.metadata.isPublic == true 
                  || resource.data.metadata.userId == request.auth.uid;
      
      // Allow write if owner
      allow write: if request.auth != null 
                   && request.resource.data.metadata.userId == request.auth.uid;
    }
  }
}
```

## Current Features

### ✅ Implemented

- **LocalStorage**: Always saves to browser storage
- **Firebase Storage**: Optional cloud storage (when configured)
- **Auto-save**: Every 30 seconds to localStorage
- **Manual Save**: Ctrl+S or button click
- **Load from localStorage**: Browse and load saved worlds
- **Load from Firebase**: Coming soon (when auth is added)

### 🔄 Coming Soon

- User authentication (login/signup)
- Load worlds from Firebase
- Share worlds (public/private)
- World thumbnails
- World versioning

## Usage

### Without Firebase (Current Default)

- All worlds save to browser localStorage
- Works offline
- Data persists in browser
- No account needed

### With Firebase (When Configured)

1. Set environment variables (see above)
2. Restart dev server: `npm run dev`
3. "Save to Cloud" button becomes active
4. Worlds save to both localStorage AND Firebase
5. Can access from any device (after auth is added)

## Data Structure

### Firestore Collection: `worlds`

```typescript
{
  config: {
    // Full WorldConfig object
    version: "1.0.0",
    roughness: 26,
    islandSize: 44,
    // ... all world settings
  },
  metadata: {
    name: "My World",
    description: "Optional description",
    userId: "user_id_here", // null until auth is added
    createdAt: Timestamp,
    updatedAt: Timestamp,
    isPublic: false,
    thumbnailUrl: null // Future: base64 or URL
  }
}
```

## Troubleshooting

### Firebase Not Working?

1. Check browser console for errors
2. Verify environment variables are set correctly
3. Make sure `.env.local` is in `templates/questly/` directory
4. Restart dev server after adding env vars
5. Check Firebase Console for any errors

### "Firebase not configured" Message?

- This is normal if you haven't set up Firebase yet
- The app works fine with localStorage only
- Set environment variables to enable cloud storage

## Next Steps

1. **Phase 4.2**: Builder UI enhancements
2. **Phase 5**: Character system
3. **Phase 6**: Quest system
4. **Phase 8**: Add authentication
5. **Phase 10**: Publishing and sharing
