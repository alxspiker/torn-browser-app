# Quick Start Guide

This guide will help you get the Torn Browser app up and running quickly.

## Project Overview

This project has two main components:

1. **Python Backend**: Handles API requests to Torn.com and provides data to the frontend
2. **Capacitor Frontend**: Provides the UI and WebView for browsing Torn.com with userscripts

## Prerequisites

Before you begin, make sure you have these installed:

- [Node.js](https://nodejs.org/) (v14 or newer)
- [Python](https://www.python.org/) (v3.8 or newer)
- [Android Studio](https://developer.android.com/studio) (for Android builds)
- [Xcode](https://developer.apple.com/xcode/) (for iOS builds, macOS only)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/alxspiker/torn-browser-app.git
cd torn-browser-app
```

### 2. Set Up the Backend

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from example)
cp .env.example .env
# Edit the .env file to add your Torn API key
```

### 3. Set Up the Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

### 4. Run the Application (Development Mode)

#### Start the Backend Server

```bash
# From the backend directory with venv activated
python app.py
```

#### Start the Frontend Development Server

```bash
# From the frontend directory
npm start
```

This will start a local development server, typically at http://localhost:3000

### 5. Build for Android

```bash
# From the frontend directory
npm run build  # Build the web assets
npx cap add android  # Only needed the first time
npx cap sync android  # Copy web assets to Android project
npx cap open android  # Open in Android Studio
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Click the "Run" button (green triangle)
3. Select a device or emulator

### 6. Build for iOS (macOS only)

```bash
# From the frontend directory
npm run build  # Build the web assets
npx cap add ios  # Only needed the first time
npx cap sync ios  # Copy web assets to iOS project
npx cap open ios  # Open in Xcode
```

In Xcode:
1. Select a development team in the Signing & Capabilities tab
2. Click the "Run" button

## Testing on Your Phone

### Android

1. Enable USB debugging on your Android device
2. Connect your phone via USB
3. Select your device in Android Studio and click Run

### iOS

1. Connect your iPhone via USB
2. Select your device in Xcode
3. Click Run

## Troubleshooting

- If you encounter CORS issues during development, make sure both frontend and backend servers are running
- For Android build issues, check that Android Studio and all SDK components are up to date
- For iOS build issues, ensure you have a valid Apple Developer account

For more detailed instructions, see the [full setup guide](docs/SETUP.md).
