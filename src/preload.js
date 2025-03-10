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
    toggleNotificationAudio: (enabled) => ipcRenderer.send('toggle-notification-audio', enabled),
    requestNotificationAudioSetting: () => ipcRenderer.send('request-notification-audio-setting'),
    onNotificationAudioSetting: (callback) => ipcRenderer.on('notification-audio-setting', (_, enabled) => callback(enabled)),
    observeIncomingMessages: () => observeIncomingMessages(),
    playBubbleSound: () => playBubbleSound(),
});

const sentAudio = new Audio();

// Receive sent sound path from main.js
ipcRenderer.on('set-sent-audio-path', (_, audioPath) => {
    sentAudio.src = `audio-protocol://getAudioFile/${audioPath}`;
    //console.log("Sent path loaded:", audioPath);
});

const bubbleAudio = new Audio();

// Receive bubble sound path from main.js
ipcRenderer.on('set-bubble-audio-path', (_, audioPath) => {
    bubbleAudio.src = `audio-protocol://getAudioFile/${audioPath}`;
    //console.log("Bubble audio loaded:", audioPath);
});

const notificationAudio = new Audio();

// Receive notification sound path from main.js
ipcRenderer.on('set-notification-audio-path', (_, audioPath) => {
    notificationAudio.src = `audio-protocol://getAudioFile/${audioPath}`;
    //console.log("Notification audio loaded:", audioPath);
});


window.addEventListener('DOMContentLoaded', () => {
//----------Settings Sidebar---------- //
    // Settings Sidebar Container
    const settingsContainer = document.createElement('div');
    settingsContainer.style.position = 'fixed';
    settingsContainer.style.top = '0';
    settingsContainer.style.right = '-300px'; // Hidden by default
    settingsContainer.style.width = '300px';
    settingsContainer.style.height = '100vh';
    settingsContainer.style.background = '#4285F4';
    settingsContainer.style.boxShadow = '-2px 0 5px rgba(0,0,0,0.3)';
    settingsContainer.style.padding = '20px';
    settingsContainer.style.transition = 'right 0.3s ease';
    settingsContainer.style.zIndex = '10002'; 
    settingsContainer.style.pointerEvents = 'auto';
    settingsContainer.style.display = 'flex';
    settingsContainer.style.flexDirection = 'column';
    settingsContainer.style.alignItems = 'start';
    settingsContainer.style.gap = '15px';
    document.body.appendChild(settingsContainer);

    // Add Close Button (X)
    const closeButton = document.createElement('button');
    closeButton.textContent = '❌';
    closeButton.style.alignSelf = 'flex-end';
    closeButton.style.border = 'none';
    closeButton.style.background = 'transparent';
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => toggleSettings(false));
    settingsContainer.appendChild(closeButton);

    // Function to Toggle Sidebar
    const toggleSettings = (show) => {
        settingsContainer.style.right = show ? '0' : '-300px';
    };

    // Settings Button (Always Visible, Bottom Right)
    const settingsButton = document.createElement('button');
    settingsButton.textContent = '⚙️ Settings';
    settingsButton.style.position = 'fixed';
    settingsButton.style.bottom = '20px';
    settingsButton.style.right = '20px';
    settingsButton.style.padding = '10px 15px';
    settingsButton.style.border = 'none';
    settingsButton.style.background = '#B0B0B0';
    settingsButton.style.color = 'white';
    settingsButton.style.fontSize = '16px';
    settingsButton.style.cursor = 'pointer';
    settingsButton.style.borderRadius = '5px';
    let isSettingsOpen = false;
    settingsButton.addEventListener('click', () => {
        isSettingsOpen = !isSettingsOpen;
        toggleSettings(isSettingsOpen);
    });
    document.body.appendChild(settingsButton);
//----------Settings Sidebar End---------- //
//----------Theme Settings---------- //
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
//----------Theme Settings End---------- //
//----------Sent Audio Settings---------- //
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
    
        if (sentAudioEnabled) {
            ipcRenderer.send('request-sent-audio-path');
        }
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
//----------Sent Audio Settings End---------- //
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
    
        if (bubbleAudioEnabled) {
            ipcRenderer.send('request-bubble-audio-path');
            ipcRenderer.send('request-bubble-audio-path');
        }
    });

    // Play Bubble Sound
    const playBubbleSound = () => {
        if (bubbleAudioEnabled && bubbleAudio.src) {
            bubbleAudio.load();
            bubbleAudio.currentTime = 0;
            bubbleAudio.play().catch(() => {});
        }
    };

    let messageObserver = null;
    let retryTimeout = null;
    let isAppFocused = true; // Track app focus state

    // Listen for app focus/blur events from the main process
    ipcRenderer.on('window-focus', () => {
        isAppFocused = true;
    });
    
    ipcRenderer.on('window-blur', () => {
        isAppFocused = false;
    });

    // Watch for Incoming Messages
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
// ----------- Notification Sound Logic ----------- //
    // Notification Audio Toggle
    const notificationAudioToggleButton = document.createElement('button');
    notificationAudioToggleButton.style.border = 'solid 1px orange';
    notificationAudioToggleButton.style.background = 'transparent';
    notificationAudioToggleButton.style.cursor = 'pointer';
    notificationAudioToggleButton.style.fontSize = '16px';
    notificationAudioToggleButton.style.color = 'orange';
    settingsContainer.appendChild(notificationAudioToggleButton);

    let notificationAudioEnabled = true;
    ipcRenderer.send('request-notification-audio-setting');

    ipcRenderer.on('notification-audio-setting', (_, enabled) => {
        notificationAudioEnabled = enabled;
        notificationAudioToggleButton.textContent = enabled ? 'Notification Sound ON:🔔' : 'Notification Sound OFF:🔕';
    });

    notificationAudioToggleButton.addEventListener('click', () => {
    notificationAudioEnabled = !notificationAudioEnabled;
    ipcRenderer.send('toggle-notification-audio', notificationAudioEnabled);

    if (notificationAudioEnabled) {
        ipcRenderer.send('request-notification-audio-path');
    }
});

    // Play notification sound when a desktop notification appears
    ipcRenderer.on('notification-received', () => {
        if (notificationAudioEnabled && notificationAudio.src) {
            notificationAudio.currentTime = 0;
            notificationAudio.play().catch(() => {});
        }
    });
// ----------- Notification Sound Logic End ----------- //

});
