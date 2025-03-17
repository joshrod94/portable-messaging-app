const { app, BrowserWindow, session, ipcMain, nativeTheme, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const sound = require('sound-play');

app.setAppUserModelId('Portable Messaging App');

const store = new Store();
let mainWindow;

app.whenReady().then(() => {
    
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Portable Messaging App for Google Messages',
        icon: app.isPackaged 
        ? path.join(process.resourcesPath, 'assets', 'Messenger_256.ico')
        : path.join(__dirname, 'assets', 'Messenger_256.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            devTools: !app.isPackaged,
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
        mainWindow.setTitle('Portable Messaging App for Google Messages');

        const savedTheme = store.get('theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
        nativeTheme.themeSource = savedTheme;

        mainWindow.webContents.send('theme-status', savedTheme);

        const sentAudioEnabled = store.get('sentAudioEnabled', true);
        mainWindow.webContents.send('sent-audio-setting', sentAudioEnabled);
        ipcMain.on('request-sent-audio-path', () => {
            const sentAudioPath = path.resolve(__dirname, 'assets', 'sent.mp3');
            mainWindow.webContents.send('set-sent-audio-path', sentAudioPath);
        });

        // Simplify to just send filenames
        const audioDir = app.isPackaged 
            ? path.join(process.resourcesPath, 'assets') 
            : path.join(__dirname, 'assets');

        mainWindow.webContents.send('set-sent-audio-path', path.join(audioDir, 'sent.mp3'));
        mainWindow.webContents.send('set-bubble-audio-path', path.join(audioDir, 'bubble.mp3'));
        mainWindow.webContents.send('set-notification-audio-path', path.join(audioDir, 'notification.mp3'));


        ipcMain.on('request-sent-audio-path', () => {
            mainWindow.webContents.send('set-sent-audio-path', 'sent.mp3');
            //console.log('Sent audio path requested');
        });

        ipcMain.on('request-bubble-audio-path', () => {
            mainWindow.webContents.send('set-bubble-audio-path', 'bubble.mp3');
            //console.log('Bubble audio path requested');
        });

        ipcMain.on('request-notification-audio-path', () => {
            mainWindow.webContents.send('set-notification-audio-path', 'notification.mp3');
            //console.log('Notification audio path requested');
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
    
    // Handle Audio Playback for the 3 sounds
    ipcMain.on('play-audio', (_, filePath) => {
        const resolvedPath = path.join(__dirname, 'assets', filePath);
         console.log("Playing sound:", resolvedPath);
        sound.play(resolvedPath)
            .then(() => {
                //console.log("Sound played successfully");
            })
            .catch((err) => {
                //console.error("Sound play error:", err);
            });
    });

    // Intercept links & open in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' }; // Prevents Electron from opening a new window
    });

    // Ensure ALL link clicks open in default browser

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
            }, 2000); 

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
