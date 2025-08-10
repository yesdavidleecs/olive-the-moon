# Firebase Setup Instructions

This guide will help you set up Firebase to store your coupon values online, so they sync across all devices.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "birthday-coupons")
4. Disable Google Analytics (not needed for this project)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In your Firebase project, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" for now
4. Select your preferred location (choose closest to you)
5. Click "Enable"

## Step 3: Set Security Rules

1. In Firestore, click on the "Rules" tab
2. Replace the default rules with these (allows read/write without authentication):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /coupons/{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click "Publish"

**Note**: These rules allow anyone to read/write. For better security, you can add authentication later.

## Step 4: Get Your Firebase Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the "</>" (Web) icon
5. Register your app with a nickname (e.g., "birthday-web")
6. Click "Register app"
7. Copy the configuration object that appears

## Step 5: Update Your Code

1. Open `firebase-config.js`
2. Replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

## Step 6: Test Your Setup

1. Commit and push your changes to GitHub
2. Visit your GitHub Pages site
3. Open a coupon and try redeeming an amount
4. Open the same coupon on a different device/browser
5. The balance should be synchronized!

## How It Works

- **Online Storage**: Values are stored in Firebase Firestore (Google's cloud database)
- **Automatic Sync**: Changes sync across all devices instantly
- **Offline Fallback**: If Firebase is unavailable, it falls back to localStorage
- **Dual Storage**: Data is saved both online and locally for redundancy

## Switching Between Local and Online Storage

In `coupon.html`, you can switch between storage modes:

### For Online Storage (Firebase):
```html
<script src="coupon-firebase.js"></script>
<!-- <script src="coupon.js"></script> -->
```

### For Local Storage Only:
```html
<!-- <script src="coupon-firebase.js"></script> -->
<script src="coupon.js"></script>
```

## Troubleshooting

### If values aren't syncing:
1. Check browser console for errors (F12 → Console)
2. Verify your Firebase config is correct
3. Check Firestore Rules are set to allow read/write
4. Ensure you're connected to the internet

### To view your data in Firebase:
1. Go to Firebase Console → Firestore Database
2. You'll see a "coupons" collection
3. Each coupon is a document with balance and history

## Security Considerations

The current setup allows anyone to modify values. For production use, consider:
1. Adding Firebase Authentication
2. Restricting write access to authenticated users
3. Using more restrictive Firestore rules

## Costs

Firebase offers a generous free tier:
- 50,000 reads/day
- 20,000 writes/day
- 1GB storage

This is more than enough for personal use!