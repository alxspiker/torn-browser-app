"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    appId: 'com.tornbrowser.app',
    appName: 'Torn Browser',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
        cleartext: true,
        allowNavigation: ['*.torn.com']
    },
    plugins: {
        CapacitorHttp: {
            enabled: true
        }
    }
};
exports.default = config;
