import { app, BrowserWindow, shell } from 'electron';
import { join } from 'node:path';
import { registerSettingsHandlers } from './ipc/settings';
import { registerFileHandlers } from './ipc/file';
import { registerRenderHandlers } from './ipc/render';

const DEV_SERVER_URL = process.env['ELECTRON_RENDERER_URL'];

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.on('ready-to-show', () => {
    window.show();
  });

  // Buka link eksternal di browser default, bukan di dalam Electron
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (DEV_SERVER_URL) {
    window.loadURL(DEV_SERVER_URL);
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return window;
}

app.whenReady().then(() => {
  // Daftarkan IPC handlers SEBELUM window dibuat
  registerSettingsHandlers();
  registerFileHandlers();

  const mainWindow = createMainWindow();

  // render handlers butuh mainWindow reference untuk kirim progress events
  registerRenderHandlers(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
