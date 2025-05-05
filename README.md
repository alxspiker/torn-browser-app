# Torn Browser App

A cross-platform desktop application for Torn.com with enhanced features and userscript capabilities.

## Features

- **Torn.com Integration**: Direct integration with Torn.com API for real-time player stats
- **Userscript Manager**: Create, edit, and manage custom JavaScript for Torn.com
- **Multiple User Profiles**: Support for multiple users with separate settings and userscripts
- **Dark Mode**: Customizable dark mode for comfortable viewing
- **Quick Navigation**: Shortcuts to important Torn.com pages
- **Enhanced Browser**: Built on Electron with full web browser capabilities

## Screenshots

*(Screenshots will be added in a future update)*

## Installation

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Installation Steps

1. Clone the repository:
   ```
   git clone https://github.com/alxspiker/torn-browser-app.git
   ```

2. Navigate to the project directory:
   ```
   cd torn-browser-app
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the application:
   ```
   npm start
   ```

## Building for Distribution

To build the application for your platform:

```
npm run build
```

This will create executables in the `dist` directory.

## User Guide

### Setting Up

1. **API Key**: To use the Torn.com API integration, enter your API key in your profile settings. You can get your API key from [Torn.com settings](https://www.torn.com/preferences.php#tab=api).

2. **User Profiles**: Create multiple profiles for different Torn accounts or configurations.

3. **Userscripts**: Use the built-in userscript manager to enhance your Torn.com experience.

### Userscript Manager

The userscript manager allows you to create and manage JavaScript code that runs on specific Torn.com pages:

1. Click the "📜" button in the browser toolbar to open the userscript manager
2. Create a new script or edit existing ones
3. Set a URL pattern to control where the script runs
4. Save your changes

### Sample Userscripts

The application comes with several sample userscripts to enhance your Torn.com experience:

- **Energy Bar Enhancer**: Shows additional information about energy regeneration
- **Market Helper**: Adds features to market pages like price comparisons
- **Battles Enhancer**: Improves the battle interface with quick heal buttons and keyboard shortcuts

## Configuration

### Settings

The application settings can be accessed by clicking the gear icon in the top-right corner:

- **General**: Configure startup behavior and browser settings
- **Appearance**: Change visual settings including dark mode and font size
- **Torn.com**: Torn-specific settings like API refresh intervals

### Keyboard Shortcuts

- **Ctrl+U**: Open userscript manager
- **Ctrl+,**: Open settings
- **Alt+Left/Right**: Navigate back/forward
- **Ctrl+R**: Reload page
- **Ctrl+N**: New window

## Development

### Project Structure

- `main.js`: Electron main process
- `renderer.js`: Main UI logic
- `preload.js`: Secure bridge between main and renderer
- `api.js`: Torn.com API integration
- `utils.js`: Utility functions
- `userscripts/`: Sample userscripts

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License

## Acknowledgments

- [Electron](https://www.electronjs.org/) for the application framework
- [Torn.com](https://www.torn.com) for the game and API
- All the contributors and users who have provided feedback

## Disclaimer

This application is not affiliated with, endorsed, or sponsored by Torn.com. Use at your own risk and ensure you comply with Torn.com's terms of service regarding third-party applications and API usage.
