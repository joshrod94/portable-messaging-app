const { contextBridge, ipcRenderer } = require('electron');
const customTitlebar = require('./titlebar/titlebar.js');

contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('titlebar-minimize'),
    maximizeWindow: () => ipcRenderer.send('titlebar-toggle-maximize'),
    closeWindow: () => ipcRenderer.send('titlebar-close'),
    getAppIconPath: () => ipcRenderer.invoke('get-app-icon-path'),
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
    observeIncomingMessages: () => observeIncomingMessages()
});

// Set Audio Paths
let sentAudioPath = '';
let bubbleAudioPath = '';
let notificationAudioPath = '';

ipcRenderer.on('set-sent-audio-path', (_, filePath) => {
    sentAudioPath = filePath;
    //console.log('Sent audio path set:', filePath);
});

ipcRenderer.on('set-bubble-audio-path', (_, filePath) => {
    bubbleAudioPath = filePath;
    //console.log('Bubble audio path set:', filePath);
});

ipcRenderer.on('set-notification-audio-path', (_, filePath) => {
    notificationAudioPath = filePath;
    //console.log('Notification audio path set:', filePath);
});

const fixContentLayout = () => {
    // Find the content container
    const contentContainer = document.querySelector('body');
    if (contentContainer) {
        contentContainer.style.padding = '0 0 24px 0';
        contentContainer.style.overflow = 'auto';
    }
};

// Wait for the app to fully render before applying fixes
setTimeout(fixContentLayout, 10);

// Re-apply fixes if window is resized
window.addEventListener('resize', fixContentLayout);

window.addEventListener('DOMContentLoaded', () => {
    // Initialize custom titlebar
    customTitlebar.init();

//----------Settings Sidebar---------- //
    // Settings Sidebar Container
    const settingsContainer = document.createElement('div');
    settingsContainer.style.position = 'fixed';
    settingsContainer.style.top = '0';
    settingsContainer.style.right = '-300px'; // Hidden by default
    settingsContainer.style.width = '300px';
    settingsContainer.style.height = '100vh';
    settingsContainer.style.background = '#8ab4f89d';
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
    settingsButton.style.top = '50px';
    settingsButton.style.left = '175px';
    settingsButton.style.zIndex = '10003'; 
    settingsButton.style.padding = '10px 15px';
    settingsButton.style.border = 'none';
    settingsButton.style.background = '#8ab4f8';
    settingsButton.style.color = '#000';
    settingsButton.style.fontSize = '16px';
    settingsButton.style.cursor = 'pointer';
    settingsButton.style.borderRadius = '20px';
    let isSettingsOpen = false;
    settingsButton.addEventListener('click', () => {
        isSettingsOpen = !isSettingsOpen;
        toggleSettings(isSettingsOpen);
    });
    document.body.appendChild(settingsButton);

    // Update settings button color based on theme
    ipcRenderer.on('theme-status', (_, theme) => {
        settingsButton.style.color = theme === 'dark' ? '#000' : '#fff';
        settingsButton.style.background = theme === 'dark' ? '#8ab4f8' : '#1a73e8';
        settingsButton.style.boxShadow = theme === 'dark' ? 'none' : '0 2px 4px rgba(0,0,0,0.3)';
    });
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
    document.body.addEventListener('click', async (event) => {
        const sendButton = event.target.closest('button.send-button');
        if (sendButton && !sendButton.disabled && sentAudioEnabled) {
            ipcRenderer.send('play-audio', 'sent.mp3');
            //console.log('Sent audio played');
        }
    });

    document.body.addEventListener('keydown', async (event) => {
        const activeElement = document.activeElement;
        if (event.key === 'Enter' && activeElement.matches('textarea[data-e2e-message-input-box]') && sentAudioEnabled) {
            ipcRenderer.send('play-audio', 'sent.mp3');
            //console.log('Sent audio played');
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
        if (bubbleAudioEnabled) {
            ipcRenderer.send('play-audio', 'bubble.mp3');
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
            retryTimeout = setTimeout(observeIncomingMessages, 4000);
            return;
        }
    
        if (messageObserver) return; // Prevent duplicate observers
    
        messageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.matches('mws-message-wrapper[is-outgoing="false"][is-unread="true"]')) {
                        if (isAppFocused) {
                            playBubbleSound();
                            //console.log('Bubble audio played');
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
    ipcRenderer.on('notification-received', async () => {
        if (notificationAudioEnabled) {
            ipcRenderer.send('play-audio', 'notification.mp3');
            //console.log('Notification audio played');
        }
    });
// ----------- Notification Sound Logic End ----------- //
// ----------- Unpair Detection & Data Clearing ----------- //
    const observeUnpairButton = () => {
        const observer = new MutationObserver(() => {
            const unpairButton = document.querySelector('button[data-e2e-action-button-confirm]');

            if (unpairButton && unpairButton.closest('.mat-mdc-dialog-container')?.querySelector('.mat-mdc-dialog-title')?.textContent?.includes("Unpair this device?")) {
                
                unpairButton.addEventListener('click', () => {
                    ipcRenderer.send('clear-app-data');
                }, { once: true });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    };

    // Start observing when the page loads
    observeUnpairButton();
// ----------- Unpair Detection & Data Clearing End ----------- //

});
