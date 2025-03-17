const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

class CustomTitlebar {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    try {
      // Read CSS file
      const cssContent = fs.readFileSync(path.join(__dirname, 'titlebar.css'), 'utf8');
      
      // Instead of reading the HTML file and using innerHTML, create the elements directly
      this.createTitlebarDOM();
      
      // Add CSS
      const style = document.createElement('style');
      style.textContent = cssContent;
      document.head.appendChild(style);
      
      // Rest of initialization
      this.setAppIcon();
      this.addControlListeners();
      this.setupThemeWatcher();
      
      document.body.style.marginTop = '36px';
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing custom titlebar:', error);
    }
  }
  
  createTitlebarDOM() {
    // Create the main titlebar container
    const titlebar = document.createElement('div');
    titlebar.id = 'app-titlebar';
    
    // Create drag region
    const dragRegion = document.createElement('div');
    dragRegion.className = 'titlebar-drag-region';
    titlebar.appendChild(dragRegion);
    
    // Left section with icon
    const leftSection = document.createElement('div');
    leftSection.className = 'titlebar-left';
    
    const iconContainer = document.createElement('div');
    iconContainer.className = 'titlebar-icon';
    
    const appIcon = document.createElement('img');
    appIcon.id = 'titlebar-app-icon';
    appIcon.alt = 'App Icon';
    
    iconContainer.appendChild(appIcon);
    leftSection.appendChild(iconContainer);
    
    // Center section with title
    const centerSection = document.createElement('div');
    centerSection.className = 'titlebar-center';
    
    const titleSpan = document.createElement('span');
    titleSpan.id = 'titlebar-title';
    titleSpan.textContent = 'Portable Messaging App for Google Messages';
    
    centerSection.appendChild(titleSpan);
    
    // Right section with control buttons
    const rightSection = document.createElement('div');
    rightSection.className = 'titlebar-right';
    
    // Minimize button
    const minimizeButton = this.createButton('minimize-button', this.createMinimizeSVG());
    
    // Maximize button
    const maximizeButton = this.createButton('maximize-button', this.createMaximizeSVG());
    
    // Close button
    const closeButton = this.createButton('close-button', this.createCloseSVG());
    
    rightSection.appendChild(minimizeButton);
    rightSection.appendChild(maximizeButton);
    rightSection.appendChild(closeButton);
    
    // Assemble the titlebar
    titlebar.appendChild(dragRegion);
    titlebar.appendChild(leftSection);
    titlebar.appendChild(centerSection);
    titlebar.appendChild(rightSection);
    
    // Insert at the beginning of body
    document.body.insertBefore(titlebar, document.body.firstChild);
  }
  
  createButton(id, svgElement) {
    const button = document.createElement('div');
    button.className = 'titlebar-button';
    button.id = id;
    button.appendChild(svgElement);
    return button;
  }
  
  createMinimizeSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('viewBox', '0 0 12 12');
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '10');
    rect.setAttribute('height', '1');
    rect.setAttribute('x', '1');
    rect.setAttribute('y', '5.5');
    rect.setAttribute('fill', 'currentColor');
    
    svg.appendChild(rect);
    return svg;
  }
  
  createMaximizeSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('viewBox', '0 0 12 12');
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '9');
    rect.setAttribute('height', '9');
    rect.setAttribute('x', '1.5');
    rect.setAttribute('y', '1.5');
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', 'currentColor');
    rect.setAttribute('stroke-width', '1');
    
    svg.appendChild(rect);
    return svg;
  }
  
  createCloseSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('viewBox', '0 0 12 12');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M 1,1 L 11,11 M 1,11 L 11,1');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.1');
    
    svg.appendChild(path);
    return svg;
  }

  setAppIcon() {
    const iconElement = document.getElementById('titlebar-app-icon');
    if (iconElement) {
      // Use a protocol that Electron allows for local resources
      ipcRenderer.invoke('get-app-icon-path').then(iconPath => {
        // Convert the path to a proper electron protocol URL
        iconElement.src = `electron-app://icon?path=${encodeURIComponent(iconPath)}`;
      }).catch(err => {
        console.error('Failed to get app icon path:', err);
      });
    }
  }

  addControlListeners() {
    // No change to this method
    document.getElementById('minimize-button')?.addEventListener('click', () => {
      ipcRenderer.send('titlebar-minimize');
    });
    
    document.getElementById('maximize-button')?.addEventListener('click', () => {
      ipcRenderer.send('titlebar-toggle-maximize');
    });
    
    document.getElementById('close-button')?.addEventListener('click', () => {
      ipcRenderer.send('titlebar-close');
    });
  }

  setupThemeWatcher() {
    // No change to this method
    ipcRenderer.on('theme-status', (_, theme) => {
      if (theme === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    });

    // Request initial theme
    ipcRenderer.send('request-initial-theme');
  }
}

module.exports = new CustomTitlebar();