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
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
let tray = null;
let childProcess = null;
function createTray() {
    const iconPath = path.join(__dirname, './icons.ico'); // You need to provide a tray icon image here
    const trayIcon = electron_1.nativeImage.createFromPath(iconPath);
    tray = new electron_1.Tray(trayIcon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Quit',
            click: () => {
                if (childProcess) {
                    childProcess.kill();
                }
                electron_1.app.quit();
            }
        }
    ]);
    tray.setToolTip('Start All App');
    tray.setContextMenu(contextMenu);
}
function runStartAll() {
    childProcess = (0, child_process_1.spawn)('npm', ['run', 'start-all'], {
        shell: true,
        stdio: 'ignore',
        detached: true,
    });
    childProcess.unref();
    childProcess.on('exit', (code, signal) => {
        console.log(`Child process exited with code ${code} and signal ${signal}`);
    });
}
electron_1.app.whenReady().then(() => {
    var _a;
    createTray();
    runStartAll();
    // On macOS, it's common to keep the app running without windows
    (_a = electron_1.app.dock) === null || _a === void 0 ? void 0 : _a.hide();
    // Prevent app from quitting when all windows are closed
    electron_1.app.on('window-all-closed', (e) => {
        e.preventDefault();
    });
});
electron_1.app.on('before-quit', () => {
    if (childProcess) {
        childProcess.kill();
    }
});
