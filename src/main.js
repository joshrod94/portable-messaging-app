const { app, BrowserWindow, session, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const Store = require('electron-store').default;

app.setAppUserModelId('com.github.joshrod94.Google-Messages-App');

const store = new Store();
let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'icon_transparent.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
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

    // Send initial theme and audio settings once page loads
    mainWindow.webContents.once('did-finish-load', () => {
        const savedTheme = store.get('theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
        nativeTheme.themeSource = savedTheme;

        mainWindow.webContents.send('theme-status', savedTheme);
        console.log("✅ Theme loaded:", savedTheme);

        const sentAudioEnabled = store.get('sentAudioEnabled', true);
        mainWindow.webContents.send('sent-audio-setting', sentAudioEnabled);
        console.log("✅ Sent audio setting:", sentAudioEnabled);

        const audioPath = `file://${path.join(__dirname, 'assets', 'sent.mp3')}`;
        mainWindow.webContents.send('set-audio-path', audioPath);
        console.log("✅ Audio path sent:", audioPath);
    });

    // Theme toggle handler
    ipcMain.on('toggle-theme', () => {
        const newTheme = nativeTheme.themeSource === "dark" ? "light" : "dark";
        nativeTheme.themeSource = newTheme;
        store.set('theme', newTheme);
        mainWindow.webContents.send('theme-status', newTheme);
        console.log("✅ Theme toggled to:", newTheme);
    });

    ipcMain.on('request-initial-theme', () => {
        mainWindow.webContents.send('theme-status', nativeTheme.themeSource);
    });

    // Sent Audio toggle handlers
    ipcMain.on('toggle-sent-audio', (_, enabled) => {
        store.set('sentAudioEnabled', enabled);
        mainWindow.webContents.send('sent-audio-setting', enabled);
        console.log("✅ Sent audio toggled to:", enabled);
    });

    ipcMain.on('request-sent-audio-setting', () => {
        const enabled = store.get('sentAudioEnabled', true);
        mainWindow.webContents.send('sent-audio-setting', enabled);
        console.log("✅ Initial sent audio setting:", enabled);
    });

    // Uncomment below to debug with DevTools
    // mainWindow.webContents.openDevTools();
});
    // Make Sure App Quits on Close
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
});
