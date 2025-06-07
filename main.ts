
import { app, BrowserWindow, screen, Tray, Menu } from 'electron';
import * as path from 'path';

let tray: Tray | null = null;
let win: BrowserWindow | null = null;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const winWidth = 800;
  const winHeight = 600;

  win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: -150,
    y: 875,
    transparent: true,
    frame: false,
    skipTaskbar: true,
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

  win.on('close', (event) => {
    if (win) {
      event.preventDefault();
      win.hide();
    }
  });

  // win.webContents.openDevTools(); // Uncomment to open dev tools
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'trayIcon.png')); // You need to have a trayIcon.png in your build directory
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        if (win) {
          win.show();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);
  tray.setToolTip('Lyrics Electron App');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
      }
    }
  });

  tray.on('right-click', () => {
    if (tray) {
      tray.popUpContextMenu();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
