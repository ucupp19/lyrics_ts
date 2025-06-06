
import { app, BrowserWindow, screen } from 'electron';
import * as path from 'path';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const winWidth = 800;
  const winHeight = 600;

  const win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: -150,
    y: 875,
    transparent: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const maxRetries = 10;
  const retryDelay = 1000; // 1 second

  for (let i = 0; i < maxRetries; i++) {
    try {
      await win.loadURL('http://localhost:8090');
      break;
    } catch (error) {
      console.log(`Failed to load URL, retrying in ${retryDelay}ms... (${i + 1}/${maxRetries})`);
      await delay(retryDelay);
    }
  }
  // win.webContents.openDevTools(); // Uncomment to open dev tools
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
