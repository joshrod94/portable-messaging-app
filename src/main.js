const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store').default;

const store = new Store();
let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false, // Prevents direct access to Node.js in renderer.js (for security)
            contextIsolation: true, // Ensures scripts run in an isolated environment
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js') // Use a Preload script for IPC communication
        }
    });

    // Use a persistent session
    const persistSession = session.fromPartition('persist:google-messages');

    // Load Google Messages
    mainWindow.loadURL('https://messages.google.com/web');

    // Ensure session is saved when closing
    mainWindow.on('close', async () => {
        // Save session cookies
        persistSession.cookies.flushStore();
    });

    // mainWindow.webContents.openDevTools(); <-- Uncomment to open DevTools
});

// Ensure the app quits properly on non-MacOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});


