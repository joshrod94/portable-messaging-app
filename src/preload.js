const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '10px';       // slightly closer to top
    container.style.left = '10px';      // slightly closer to left
    container.style.background = 'rgba(0,0,0,0.4)';
    container.style.borderRadius = '20px';
    container.style.padding = '4px';    // reduced padding
    container.style.zIndex = '10000';
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.3s ease';
    container.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';

    const button = document.createElement('button');
    button.style.border = 'none';
    button.style.background = 'transparent';
    button.style.cursor = 'pointer';
    button.style.fontSize = '16px';     // reduced icon size for less distraction
    button.style.padding = '0';
    button.style.margin = '0';

    container.appendChild(button);
    document.body.appendChild(container);

    ipcRenderer.send('request-initial-theme');
    ipcRenderer.on('theme-status', (_, theme) => {
        button.textContent = theme === 'dark' ? '🌙' : '🌞';
    });

    button.addEventListener('click', () => {
        ipcRenderer.send('toggle-theme');
    });

    window.addEventListener('mousemove', (e) => {
        if (e.clientX < 50 && e.clientY < 50) { // smaller trigger area
            container.style.opacity = '1';
        } else {
            container.style.opacity = '0';
        }
    });
});

