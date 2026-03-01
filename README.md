## Run Locally

**Prerequisites:**  Node.js

# HC-SSH Manager 🚀

HC-SSH Manager is a modern, cross-platform SSH terminal management tool designed for developers and DevOps engineers. It integrates server management, script automation, and AI-powered assistance to provide a more efficient and secure remote connection experience.

---

## ✨ Key Features

- **Server Management**: Easily add, edit, and organize your SSH server profiles.
- **Secure Encryption**: All sensitive data (like passwords) is encrypted using AES-256 and stored locally on your machine.
- **Script Automation**: Save and execute frequently used scripts on remote servers with a single click.
- **AI-Powered Terminal**: Integrated Gemini AI helps you generate complex Linux commands or explain terminal outputs in real-time.
- **Multi-Platform Support**: Ready-to-use installers for Windows (.exe), macOS (.dmg), and Linux (.deb).

---

## 📥 Installation

### 1. Download the Installer
You can download the latest version for your platform from the **Releases** page (or from GitHub Actions artifacts):
- **Windows**: Download `hc-ssh-win32-x64-setup.exe`.
- **macOS**: Download `hc-ssh-darwin-x64.dmg`.
- **Linux**: Download `hc-ssh-linux-x64.deb`.

### 2. Installation Steps
- **Windows**: Double-click the `.exe` file and follow the setup wizard.
- **macOS**: Double-click the `.dmg` file and drag the HC-SSH icon to your `Applications` folder.
- **Linux**: Install using `sudo dpkg -i hc-ssh-linux-x64.deb` or your preferred package manager.

---

## 🚀 Getting Started

### 1. Add a Server
After launching the app, click **"Add Server"** in the sidebar. Enter the server name, IP address, port, username, and password.

### 2. Connect to Terminal
Click on any server in your list to automatically open a terminal window and establish a secure SSH connection.

### 3. Use the AI Assistant
In the terminal interface, you'll find an AI input field. You can ask questions like *"How do I find the process using the most memory?"*. The AI will generate the command, which you can then paste directly into the terminal.

### 4. Execute Scripts
Associate common scripts with your servers in the management panel. Once connected, simply click a script in the side panel to run it instantly.

---

## 🛠️ Developer Guide (Local Setup)

If you want to run from source or contribute to development:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/henrychang1413/hc-ssh-manager.git
   cd hc-ssh-manager
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run in Development Mode**:
   ```bash
   npm run dev
   ```

4. **Launch Desktop App (Electron)**:
   ```bash
   npm run electron:start
   ```

5. **Build & Package**:
   ```bash
   npm run build
   npm run make
   ```

---

## 📄 License
This project is licensed under the MIT License.
