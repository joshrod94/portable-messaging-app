const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    toggleTheme: () => ipcRenderer.send('toggle-theme'),
    requestInitialTheme: () => ipcRenderer.send('request-initial-theme'),
    onThemeUpdate: (callback) => ipcRenderer.on('theme-status', (_, theme) => callback(theme)),
    toggleSentAudio: (enabled) => ipcRenderer.send('toggle-sent-audio', enabled),
    requestSentAudioSetting: () => ipcRenderer.send('request-sent-audio-setting'),
    onSentAudioSetting: (callback) => ipcRenderer.on('sent-audio-setting', (_, enabled) => callback(enabled)),
});

const sentAudio = new Audio();

// Set audio path correctly via IPC from main
ipcRenderer.on('set-audio-path', (_, audioPath) => {
    sentAudio.src = audioPath;
    console.log("✅ Audio path set:", audioPath);
});

window.addEventListener('DOMContentLoaded', () => {
    const settingsContainer = document.createElement('div');
    settingsContainer.style.position = 'fixed';
    settingsContainer.style.top = '10px';
    settingsContainer.style.left = '10px';
    settingsContainer.style.background = 'rgb(0, 0, 0)';
    settingsContainer.style.borderRadius = '10px';
    settingsContainer.style.padding = '6px';
    settingsContainer.style.zIndex = '10000';
    settingsContainer.style.opacity = '0';
    settingsContainer.style.transition = 'opacity 0.3s ease';
    settingsContainer.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
    settingsContainer.style.display = 'flex';
    settingsContainer.style.flexDirection = 'column';
    settingsContainer.style.alignItems = 'left';
    settingsContainer.style.gap = '10px';
    document.body.appendChild(settingsContainer);

    //Hover Area
    window.addEventListener('mousemove', (e) => {
        settingsContainer.style.opacity = (e.clientX < 150 && e.clientY < 150) ? '1' : '0';
    });
//----------Theme Settings----------
    // Theme Toggle Button
    const themeToggleButton = document.createElement('button');
    themeToggleButton.style.border = 'solid 1px orange';
    themeToggleButton.style.background = 'transparent';
    themeToggleButton.style.cursor = 'pointer';
    themeToggleButton.style.fontSize = '16px';
    themeToggleButton.style.color = 'orange';
    settingsContainer.appendChild(themeToggleButton);

    ipcRenderer.send('request-initial-theme');

    ipcRenderer.on('theme-status', (_, theme) => {
        themeToggleButton.textContent = theme === 'dark' ? 'Theme:🌙' : 'Theme:🌞';
    });

    themeToggleButton.addEventListener('click', () => {
        ipcRenderer.send('toggle-theme');
    });
//----------Theme Settings End----------   
//----------Sent Audio Settings----------
    // Sent Audio Toggle Button
    const sentAudioToggleButton = document.createElement('button');
    sentAudioToggleButton.style.border = 'solid 1px orange';
    sentAudioToggleButton.style.background = 'transparent';
    sentAudioToggleButton.style.cursor = 'pointer';
    sentAudioToggleButton.style.fontSize = '16px';
    sentAudioToggleButton.style.color = 'orange';
    settingsContainer.appendChild(sentAudioToggleButton);

    let sentAudioEnabled = true;

    ipcRenderer.send('request-sent-audio-setting');

    ipcRenderer.on('sent-audio-setting', (_, enabled) => {
        sentAudioEnabled = enabled;
        sentAudioToggleButton.textContent = enabled ? 'Sent Sound ON:🔔' : 'Sent Sound OFF:🔕';
    });

    sentAudioToggleButton.addEventListener('click', () => {
        sentAudioEnabled = !sentAudioEnabled;
        ipcRenderer.send('toggle-sent-audio', sentAudioEnabled);
    });

    // Sent message sound events
    document.body.addEventListener('click', (event) => {
        const sendButton = event.target.closest('button.send-button');
        if (sendButton && !sendButton.disabled && sentAudioEnabled) {
            sentAudio.currentTime = 0;
            sentAudio.play().catch(console.error);
        }
    });

    document.body.addEventListener('keydown', (event) => {
        const activeElement = document.activeElement;
        if (event.key === 'Enter' && activeElement.matches('textarea[data-e2e-message-input-box]') && sentAudioEnabled) {
            sentAudio.currentTime = 0;
            sentAudio.play().catch(console.error);
        }
    });
//----------Sent Audio Settings End----------
});
