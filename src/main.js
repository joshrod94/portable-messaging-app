const { app, BrowserWindow, session, ipcMain, nativeTheme, shell, protocol, URL } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store').default;

app.setAppUserModelId('com.github.joshrod94.portable-messaging-app');

const store = new Store();
let mainWindow;

app.whenReady().then(() => {

    // Register Secure Custom Protocol for MP3 Files
    protocol.registerFileProtocol('audio-protocol', (request, callback) => {
        const filePath = request.url.replace('audio-protocol://getAudioFile/', '');
        try {
            return callback({ path: filePath });
        } catch (error) {
            console.error("Failed to load audio:", error);
            return callback({ error: -6 }); // Error -6: FILE_NOT_FOUND
        }
    });
    
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.resolve(__dirname, 'assets', 'Messenger.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            devTools: false,
        }
    });

    // Load Google Messages
    mainWindow.loadURL('https://messages.google.com/web');

    // Persistent session
    const persistSession = session.fromPartition('persist:google-messages');

    // Flush cookies on close
    mainWindow.on('close', async () => {
        await persistSession.cookies.flushStore();
    });

    // Detect when the window is focused
    mainWindow.on('focus', () => {
        mainWindow.webContents.send('window-focus');
    });

    // Detect when the window is blurred (user switches apps)
    mainWindow.on('blur', () => {
        mainWindow.webContents.send('window-blur');
    });

    // Detect when the window is minimized
    mainWindow.on('minimize', () => {
        mainWindow.webContents.send('window-blur');
    });

    // Detect when the window is restored from minimize
    mainWindow.on('restore', () => {
        mainWindow.webContents.send('window-focus');
    });

    // Detect when a notification is shown and inform preload.js
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'notifications') {
            mainWindow.webContents.send('notification-received');
        }
        callback(true);
    });

    // Send initial theme and audio settings once page loads
    mainWindow.webContents.once('did-finish-load', () => {
        const savedTheme = store.get('theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
        nativeTheme.themeSource = savedTheme;

        mainWindow.webContents.send('theme-status', savedTheme);

        const sentAudioEnabled = store.get('sentAudioEnabled', true);
        mainWindow.webContents.send('sent-audio-setting', sentAudioEnabled);
        ipcMain.on('request-sent-audio-path', () => {
            const sentAudioPath = path.resolve(__dirname, 'assets', 'sent.mp3');
            mainWindow.webContents.send('set-sent-audio-path', sentAudioPath);
        });

        const sentAudioPath = path.resolve(__dirname, 'assets', 'sent.mp3');
        mainWindow.webContents.send('set-sent-audio-path', sentAudioPath);
        //console.log("✅ Sent Audio path:", sentAudioPath);

        const bubbleAudioPath = path.resolve(__dirname, 'assets', 'bubble.mp3');
        mainWindow.webContents.send('set-bubble-audio-path', bubbleAudioPath);
        //console.log("✅ Receive bubble audio path:", bubbleAudioPath);
        ipcMain.on('request-bubble-audio-path', () => {
            const bubbleAudioPath = path.resolve(__dirname, 'assets', 'bubble.mp3');
            mainWindow.webContents.send('set-bubble-audio-path', bubbleAudioPath);
        });
        
        const notificationAudioPath = path.resolve(__dirname, 'assets', 'notification.mp3');
        mainWindow.webContents.send('set-notification-audio-path', notificationAudioPath);
        //console.log("✅ Receive notification audio path:", notificationAudioPath);
        ipcMain.on('request-notification-audio-path', () => {
            const notificationAudioPath = path.resolve(__dirname, 'assets', 'notification.mp3');
            mainWindow.webContents.send('set-notification-audio-path', notificationAudioPath);
        });
    });

    // Theme toggle handler
    ipcMain.on('toggle-theme', () => {
        const newTheme = nativeTheme.themeSource === "dark" ? "light" : "dark";
        nativeTheme.themeSource = newTheme;
        store.set('theme', newTheme);
        mainWindow.webContents.send('theme-status', newTheme);
    });

    ipcMain.on('request-initial-theme', () => {
        mainWindow.webContents.send('theme-status', nativeTheme.themeSource);
    });

    // Sent Audio toggle handlers
    ipcMain.on('toggle-sent-audio', (_, enabled) => {
        store.set('sentAudioEnabled', enabled);
        mainWindow.webContents.send('sent-audio-setting', enabled);
    });

    ipcMain.on('request-sent-audio-setting', () => {
        const enabled = store.get('sentAudioEnabled', true);
        mainWindow.webContents.send('sent-audio-setting', enabled);
    });

    // Handle Bubble Audio Toggle
    ipcMain.on('toggle-bubble-audio', (_, enabled) => {
        store.set('bubble-audio-enabled', enabled);
        mainWindow.webContents.send('bubble-audio-setting', enabled);
    });
    
    ipcMain.on('request-bubble-audio-setting', () => {
        const bubbleAudioEnabled = store.get('bubble-audio-enabled', true);
        mainWindow.webContents.send('bubble-audio-setting', bubbleAudioEnabled);
    });

    //Handle Notification Sound Toggle
    ipcMain.on('toggle-notification-audio', (_, enabled) => {
        store.set('notification-audio-enabled', enabled);
        mainWindow.webContents.send('notification-audio-setting', enabled);
    });

    ipcMain.on('request-notification-audio-setting', () => {
        const notificationAudioEnabled = store.get('notification-audio-enabled', true);
        mainWindow.webContents.send('notification-audio-setting', notificationAudioEnabled);
    });
    
    // Intercept links & open in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' }; // Prevents Electron from opening a new window
    });

    // Ensure ALL link clicks open in default browser
    const { URL } = require('url'); // Import URL module

    mainWindow.webContents.on('will-navigate', (event, url) => {
        try {
            const parsedUrl = new URL(url); // Parse the URL properly

            if (parsedUrl.hostname !== 'messages.google.com') { 
                event.preventDefault(); // Prevent Electron from navigating
                shell.openExternal(url); // Open in system browser
            }
        } catch (error) {
            console.error("Invalid URL blocked:", url);
            event.preventDefault();
        }
    });
    // ----------- Clear App Data on Unpair ----------- //
    ipcMain.on('clear-app-data', async () => {
        try {
            const persistSession = session.fromPartition('persist:google-messages');

            // **Enable DevTools Protocol**
            const wc = mainWindow.webContents;
            await wc.debugger.attach("1.3");

            // **Send the exact DevTools Command:**
            await wc.debugger.sendCommand("Storage.clearDataForOrigin", {
                origin: "https://messages.google.com",
                storageTypes: "all"
            });

            // **Detach Debugger to Free Resources**
            await wc.debugger.detach();

            // **Quit the App After Data is Fully Cleared**
            setTimeout(() => {
                app.quit();
            }, 1500); 

        } catch (error) {
            console.error("Error clearing app data:", error);
        }
    });
    // ----------- Clear App Data on Unpair End ----------- //
    
    // Uncomment below to debug with DevTools
    //mainWindow.webContents.openDevTools();

    // Make Sure App Quits on Close
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
});
