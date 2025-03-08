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
            preload: path.join(__dirname, 'preload.js'), // Use a Preload script for IPC communication
            nodeIntegration: false, // Prevents direct access to Node.js in renderer.js (for security)
            contextIsolation: true, // Ensures scripts run in an isolated environment
            webSecurity: false, // Required to allow preload on external URLs
        }
    });

    // Load Google Messages
    mainWindow.loadURL('https://messages.google.com/web');

    // Use a persistent session
    const persistSession = session.fromPartition('persist:google-messages');

    // Ensure session is saved when closing
    mainWindow.on('close', async () => {
        await persistSession.cookies.flushStore();
    });

    // Get saved theme or use system preference
    const savedTheme = store.get('theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light');
    nativeTheme.themeSource = savedTheme;

    // Send theme status when page loads
    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('theme-status', nativeTheme.themeSource);
        console.log("✅ Sent initial theme status:", nativeTheme.themeSource);
    });

    // Handle theme toggle request from `preload.js`
    ipcMain.on('toggle-theme', () => {
        const newTheme = nativeTheme.themeSource === "dark" ? "light" : "dark";
        nativeTheme.themeSource = newTheme;
        store.set('theme', newTheme);
        console.log("✅ Theme changed to:", newTheme);
        mainWindow.webContents.send('theme-status', newTheme);
    });

    // Send initial theme if requested by preload
    ipcMain.on('request-initial-theme', () => {
        mainWindow.webContents.send('theme-status', nativeTheme.themeSource);
    });

    // Uncomment to open DevTools for debugging
    mainWindow.webContents.openDevTools();
});

// Ensure the app quits properly on non-MacOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


