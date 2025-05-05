# Torn Browser App

A cross-platform mobile application for Torn.com with a Python backend and userscript capabilities.

## Features

- View Torn.com in a mobile-optimized browser
- Integrate userscripts directly in the browser
- Python backend for accessing the Torn API
- Alert functionality for in-game events
- Customizable notifications
- Works on both Android and iOS

## Technology Stack

- **Frontend**: HTML, JavaScript, CSS with Capacitor
- **Backend**: Python with Flask
- **Packaging**: Android APK and iOS IPA
- **API**: Torn.com API integration

## Setup Instructions

See the [setup guide](docs/SETUP.md) for detailed installation and configuration instructions.

## Development

This project uses Capacitor for the frontend and Flask for the Python backend. The backend handles API requests to Torn.com and sends data to the frontend for display.

## Electron Platform Setup (with @capacitor-community/electron)

If you want to build the Electron (desktop) version, you must use the community Electron plugin. The official Capacitor Electron platform is deprecated.

### Steps

1. **Install TypeScript (if not already):**
   ```
   npm install -D typescript
   ```
2. **Install the community Electron plugin:**
   ```
   npm install @capacitor-community/electron
   ```
3. **Build your frontend web assets (required!):**
   ```
   npm run build
   ```
   > This creates the `dist` folder. If you skip this, you will get an error like:
   > `Error: ENOENT: no such file or directory, lstat '.../frontend/dist'`
4. **Add the Electron platform:**
   ```
   npx cap add @capacitor-community/electron
   ```
   > If you see an error about missing `dist`, make sure you ran `npm run build` first.
5. **Commit the generated folder:**
   ```
   cd ..
   git add frontend/electron
   git commit -m "Add Electron platform using community plugin"
   git push
   ```

### Common Issues & Fixes

- **Error: ENOENT: no such file or directory, lstat '.../frontend/dist'**
  - You must run `npm run build` before adding the Electron platform.
- **TypeScript not found error:**
  - Run `npm install -D typescript` in the `frontend` directory.
- **Electron build fails in CI with 'directory name is invalid':**
  - Make sure you have committed the entire `frontend/electron` folder and its contents.
- **Vite/Rollup build fails to resolve @capacitor/storage:**
  - Use `@capacitor/preferences` instead of `@capacitor/storage` in your code. Update all imports and usage accordingly.
- **electron-builder/@electron/rebuild compatibility error (subpath './lib/src/search-module' not defined):**
  - The latest @electron/rebuild (v4.x) is not compatible with electron-builder as of May 2025. If you see errors about missing exports or subpaths, downgrade to @electron/rebuild@3.2.9:
    ```
    npm install -D @electron/rebuild@3.2.9
    ```
  - This will resolve the "subpath" and "exports" error during Electron builds.

### Additional Troubleshooting (Windows, npm, and Rollup)

- **Rollup native module error (`Cannot find module @rollup/rollup-win32-x64-msvc`):**
  - This is a known npm bug with optional dependencies, especially on Windows. If you see this error after deleting `node_modules` and `package-lock.json` and running `npm install`, you may need to manually install the missing native module:
    ```
    npm install @rollup/rollup-win32-x64-msvc
    ```
  - If the error persists, ensure you are using Node.js 18 or 20 (not 22+), and repeat the cleanup and install steps.

- **General advice:**
  - If you encounter strange npm or build errors, always try deleting `node_modules` and `package-lock.json`, then run `npm install` again.
  - If you switch Node.js versions, repeat the cleanup and install steps.

These steps are sometimes required due to upstream bugs in npm and Rollup, especially on Windows.

### Quick Setup Script (Windows)

```bat
@echo off
REM Install TypeScript if missing
npm install -D typescript
REM Build web assets (required for Electron)
npm run build
REM Install community Electron plugin
npm install @capacitor-community/electron
REM Add Electron platform
npx cap add @capacitor-community/electron
REM Stage the electron folder for commit
cd ..
git add frontend/electron
cd frontend
@echo Electron platform added and staged. Now commit and push to GitHub.
```

After this, your GitHub Actions workflow will be able to build the Electron app without errors.

## License

MIT
