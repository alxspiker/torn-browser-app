# Torn Browser App

A cross-platform desktop application for Torn.com with enhanced features and userscript capabilities.

## Overview

Torn Browser App is a specialized browser built specifically for the online text-based RPG game [Torn.com](https://www.torn.com). It provides a streamlined browsing experience with additional features designed to enhance gameplay:

- **Live Player Stats**: View your energy, nerve, happiness, life, chain count, money, and points in real-time through the Torn API
- **Userscript Support**: Create, edit, install and manage userscripts directly within the app
- **Automatic Updates**: Userscripts can be configured to automatically check for and install updates
- **API Integration**: Built-in Torn API client for accessing game data without leaving the browser
- **Cooldown Timers**: Track medical, drug, and booster cooldowns
- **Multiple Profiles**: Support for multiple player profiles with separate settings and userscripts
- **Customization**: Dark mode support and customizable interface

## Installation

### Prerequisites
- Node.js (>= 16.x)
- npm (>= 8.x)

### Setup
1. Clone the repository:
   ```
   git clone https://github.com/alxspiker/torn-browser-app.git
   ```

2. Install dependencies:
   ```
   cd torn-browser-app
   npm install
   ```

3. Start the application:
   ```
   npm start
   ```

### Building for Distribution
To create distributable packages for different platforms:
```
npm run build
```

This will generate executables for your platform in the `dist` directory.

## Features

### Userscript Manager
- Create and edit userscripts with syntax highlighting
- Import/export userscripts as JSON
- Enable/disable scripts individually
- Automatic script injection based on URL patterns
- Script validation and error checking
- Auto-update support for scripts with update URLs

### API Integration
- Real-time player stats display
- Automatic refresh at customizable intervals
- API key management
- Comprehensive data access through Torn.com API

### Browser Features
- Standard navigation controls (back, forward, refresh)
- Address bar with URL input
- Web standards compliance
- Enhanced security with contextIsolation
- Desktop notifications for energy/nerve full status

## Development

### Project Structure
- `/css` - Stylesheets for the application
- `/js` - JavaScript modules for different app features
- `/templates` - HTML templates for UI components
- `/userscripts` - Default and example userscripts
- `main.js` - Main Electron process
- `preload.js` - Preload script for secure IPC
- `index.html` - Main application UI

### Technologies Used
- Electron (v36.1.0)
- CodeMirror (v5.65.14) - For code editing with syntax highlighting
- Moment.js (v2.29.4) - For date and time handling
- JSHint (v2.13.6) - For JavaScript validation
- Electron Store (v8.1.0) - For data persistence

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/alxspiker/torn-browser-app/issues) on GitHub.
