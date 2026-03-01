import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess;

function startServer() {
  // In production, we run the compiled server.js
  // In development, we might still want to use tsx, but for the packaged app,
  // we definitely want to use the compiled version.
  
  let serverPath = path.join(__dirname, 'dist-server', 'server.js');
  
  // Check if compiled server exists, if not fallback to server.ts (dev mode)
  if (!fs.existsSync(serverPath)) {
    serverPath = path.join(__dirname, 'server.ts');
    console.log('Compiled server not found, falling back to server.ts');
    
    const tsxPath = path.resolve(__dirname, 'node_modules', '.bin', 'tsx');
    serverProcess = spawn(tsxPath, [serverPath], {
      env: { 
        ...process.env, 
        NODE_ENV: 'development', 
        PORT: '3000',
        ELECTRON_RUN_AS_NODE: undefined,
        USER_DATA_PATH: app.getPath('userData')
      },
      shell: true
    });
  } else {
    console.log('Starting compiled server at:', serverPath);
    // Use Electron's own binary to run the server script as a Node process
    serverProcess = spawn(process.execPath, [serverPath], {
      env: { 
        ...process.env, 
        NODE_ENV: 'production', 
        PORT: '3000',
        ELECTRON_RUN_AS_NODE: '1',
        USER_DATA_PATH: app.getPath('userData')
      }
    });
  }

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'HC-SSH Manager',
    backgroundColor: '#0f111a',
    icon: path.join(__dirname, 'public', 'Logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Show loading screen first
  win.loadFile(path.join(__dirname, 'loading.html'));

  // Function to load the URL with retries
  const loadApp = () => {
    fetch('http://localhost:3000')
      .then(() => {
        console.log('Server is ready, loading app...');
        win.loadURL('http://localhost:3000');
      })
      .catch(() => {
        console.log('Server not ready, retrying in 1s...');
        setTimeout(loadApp, 1000);
      });
  };

  // Start checking for server after a short delay
  setTimeout(loadApp, 1000);
  
  // Hide menu bar
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  startServer();
  
  // Give the server a moment to start, then try to create window
  setTimeout(createWindow, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
