const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    toggleTheme: () => ipcRenderer.send('toggle-theme'),
    requestInitialTheme: () => ipcRenderer.send('request-initial-theme'),
    onThemeUpdate: (callback) => ipcRenderer.on('theme-status', (_, theme) => callback(theme)),
    toggleSentAudio: (enabled) => ipcRenderer.send('toggle-sent-audio', enabled),
    requestSentAudioSetting: () => ipcRenderer.send('request-sent-audio-setting'),
    onSentAudioSetting: (callback) => ipcRenderer.on('sent-audio-setting', (_, enabled) => callback(enabled)),
    toggleBubbleAudio: (enabled) => ipcRenderer.send('toggle-bubble-audio', enabled),
    requestBubbleAudioSetting: () => ipcRenderer.send('request-bubble-audio-setting'),
    onBubbleAudioSetting: (callback) => ipcRenderer.on('bubble-audio-setting', (_, enabled) => callback(enabled)),
    observeIncomingMessages: () => observeIncomingMessages(),
    playBubbleSound: () => playBubbleSound(),
});

const sentAudio = new Audio();

// Receive sent sound path from main.js
ipcRenderer.on('set-sent-audio-path', (_, audioPath) => {
    sentAudio.src = audioPath;
    //console.log("✅ Audio path set:", audioPath);
});

const bubbleAudio = new Audio();

// Receive bubble sound path from main.js
ipcRenderer.on('set-bubble-audio-path', (_, audioPath) => {
    bubbleAudio.src = audioPath;
    //console.log("✅ Bubble audio loaded:", audioPath);
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
// ----------- Received Message Sound Logic ----------- //
// Bubble Audio Toggle
const bubbleAudioToggleButton = document.createElement('button');
bubbleAudioToggleButton.style.border = 'solid 1px orange';
bubbleAudioToggleButton.style.background = 'transparent';
bubbleAudioToggleButton.style.cursor = 'pointer';
bubbleAudioToggleButton.style.fontSize = '16px';
bubbleAudioToggleButton.style.color = 'orange';
settingsContainer.appendChild(bubbleAudioToggleButton);

let bubbleAudioEnabled = true;
ipcRenderer.send('request-bubble-audio-setting');

ipcRenderer.on('bubble-audio-setting', (_, enabled) => {
    bubbleAudioEnabled = enabled;
    bubbleAudioToggleButton.textContent = enabled ? 'Bubble Sound ON:🔊' : 'Bubble Sound OFF:🔕';
});

bubbleAudioToggleButton.addEventListener('click', () => {
    bubbleAudioEnabled = !bubbleAudioEnabled;
    ipcRenderer.send('toggle-bubble-audio', bubbleAudioEnabled);
    bubbleAudioToggleButton.textContent = bubbleAudioEnabled ? 'Bubble Sound ON:🔊' : 'Bubble Sound OFF:🔕';
});

    // ✅ Play Bubble Sound
    const playBubbleSound = () => {
    if (bubbleAudioEnabled && bubbleAudio.src) {
        bubbleAudio.currentTime = 0;
        bubbleAudio.play().catch(() => {});
    }
};

    let messageObserver = null;
    let retryTimeout = null;
    let isAppFocused = true; // Track app focus state

    // ✅ Listen for app focus/blur events from the main process
    ipcRenderer.on('window-focus', () => {
        isAppFocused = true;
    });
    
    ipcRenderer.on('window-blur', () => {
        isAppFocused = false;
    });

    // ✅ Watch for Incoming Messages
    const observeIncomingMessages = () => {
        const parentContainer = document.querySelector('[data-e2e-message-wrapper]')?.parentNode;
    
        if (!parentContainer) {
            retryTimeout = setTimeout(observeIncomingMessages, 2000);
            return;
        }
    
        if (messageObserver) return; // Prevent duplicate observers
    
        messageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.matches('mws-message-wrapper[is-outgoing="false"][is-unread="true"]')) {
                        if (isAppFocused) {
                            playBubbleSound();
                        }
                    }
                });
            });
        });

        messageObserver.observe(parentContainer, { childList: true, subtree: true });

        if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
        }
    };
    // Start observing once the page is loaded
    observeIncomingMessages();
// ----------- Received Message Sound Logic End ----------- //

});
