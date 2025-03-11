# Google Messages Portable App for Windows

A **standalone desktop app** for **Google Messages** built with **Electron**. This app provides a smooth experience with additional features such as **theme toggling**, **custom notifications**, **audio alerts**, and **persistent login**.

## 🚀 Features

- ✅ **Standalone Experience**: No need for a browser.
- ✅ **Persistent Login**: Saves session for future use.
- ✅ **Light/Dark Mode**: Toggle theme settings.
- ✅ **Custom Audio Alerts**:
  - Sent message sound
  - Incoming message sound
  - Notification sound
- ✅ **Settings Sidebar**: Manage features easily.
- ✅ **Custom Secure Protocol**: Allows local audio files to load with `webSecurity: true`.
- ✅ **Windows Notifications**: Plays notification sounds.
- ✅ **External Links**: Opens links in the system’s default browser.
- ✅ **Developer Tools Disabled**: Enhances security.

---

## 📦 Installation

### 1️⃣ Clone the Repository:
```sh
 git clone https://github.com/YOUR_GITHUB/google-messages-app.git
 cd google-messages-app
```

### 2️⃣ Install Dependencies:
```sh
 npm install
```

### 3️⃣ Run the App:
```sh
 npm start
```

---

## 🛠️ Usage

### 🎨 Theme Toggle
- Click the **⚙️ Settings** button (bottom-right of the app window).
- Click the **Theme Toggle** button to switch between Light 🌞 and Dark 🌙 mode.

### 🔊 Sound Settings
- **Sent Sound**: Toggle sound for sent messages.
- **Bubble Sound**: Toggle sound for incoming messages.
- **Notification Sound**: Toggle sound for system notifications.
- **All sounds can be enabled/disabled via the settings panel.**

### 🔗 External Links
- Clicking on links **opens them in the default browser** instead of Electron’s built-in window.

### 📌 Persistent Login
- Once you scan the **QR code** to sign in, the session is remembered.
- **You won’t have to sign in every time you open the app.**

### 🔕 Disabling Developer Tools (Security)
- **Developer tools are disabled** for better security.
- To enable for debugging, uncomment `mainWindow.webContents.openDevTools();` and change `devTools: false` to `devTools: true` in `main.js`.

---

## 🏗️ Build for Production
To create an executable:
```sh
npm run build
```

You can use **Electron Packager** or **Electron Builder** to generate a Windows `.exe` file.

---

## 📝 Notes

- This app uses a **custom protocol (`audio-protocol://`)** to load audio files securely.
- Disabling and re-enabling sounds **re-requests the audio file path** to ensure proper loading.
- All UI elements are styled dynamically for a **smooth and responsive experience**.

---

## 👨‍💻 Contributing
1. **Fork the repository** 📌
2. **Create a feature branch** (`git checkout -b new-feature`)
3. **Commit your changes** (`git commit -m 'Add new feature'`)
4. **Push to the branch** (`git push origin new-feature`)
5. **Create a pull request** ✅

---

## ⚖️ License
This project is **open-source** under the **MIT License**.

---

## 💬 Questions?
Feel free to [open an issue](https://github.com/YOUR_GITHUB/google-messages-app/issues)!

**Enjoy using Google Messages on Windows!** 🎉

