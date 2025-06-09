"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
let tray = null;
let win = null;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function createWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        const { width: screenWidth, height: screenHeight } = electron_1.screen.getPrimaryDisplay().workAreaSize;
        const winWidth = 800;
        const winHeight = 600;
        win = new electron_1.BrowserWindow({
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
                yield win.loadURL('http://localhost:8090');
                break;
            }
            catch (error) {
                console.log(`Failed to load URL, retrying in ${retryDelay}ms... (${i + 1}/${maxRetries})`);
                yield delay(retryDelay);
            }
        }
        win.on('close', (event) => {
            if (win) {
                event.preventDefault();
                win.hide();
            }
        });
        // win.webContents.openDevTools(); // Uncomment to open dev tools
    });
}
function createTray() {
    tray = new electron_1.Tray(path.join(__dirname, 'trayIcon.png')); // You need to have a trayIcon.png in your build directory
    const contextMenu = electron_1.Menu.buildFromTemplate([
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
                electron_1.app.quit();
            }
        }
    ]);
    tray.setToolTip('Lyrics Electron App');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        if (win) {
            if (win.isVisible()) {
                win.hide();
            }
            else {
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
electron_1.app.whenReady().then(() => {
    createWindow();
    createTray();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
