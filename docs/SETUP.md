# Setup Guide

## Prerequisites

- Node.js (v14+)
- npm (v6+)
- Python (v3.8+)
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/alxspiker/torn-browser-app.git
cd torn-browser-app
```

### 2. Set up the Python backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

### 4. Configure your Torn API key

Create a `.env` file in the backend directory with your Torn API key:

```
TORN_API_KEY=your_api_key_here
```

## Running the App

### Development Mode

1. Start the backend server:

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

2. Start the frontend development server:

```bash
cd ../frontend
npm start
```

### Building for Android

```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

Then build the APK from Android Studio.

### Building for iOS

```bash
cd frontend
npm run build
npx cap sync ios
npx cap open ios
```

Then build the IPA from Xcode.

## Troubleshooting

If you encounter any issues, check the logs in:

- Backend: `backend/logs/app.log`
- Frontend: Browser console during development
