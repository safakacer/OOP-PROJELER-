const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#1a1b26',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Remove default menu
  Menu.setApplicationMenu(null);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// Window controls
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());

// File operations
ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Dosya Aç',
    filters: [
      { name: 'TKC Dosyaları', extensions: ['tkc'] },
      { name: 'Tüm Dosyalar', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const fp = result.filePaths[0];
  return { path: fp, content: fs.readFileSync(fp, 'utf8') };
});

ipcMain.handle('save-file', async (event, { path: filePath, content }) => {
  if (!filePath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Dosyayı Kaydet',
      filters: [{ name: 'TKC Dosyaları', extensions: ['tkc'] }],
      defaultPath: 'yeni.tkc'
    });
    if (result.canceled) return null;
    filePath = result.filePath;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return { path: filePath };
});

ipcMain.handle('run-code', async (event, code) => {
  try {
    const { TurkceInterpreter } = require('./interpreter/turkce.js');
    const interp = new TurkceInterpreter();
    const output = interp.run(code);
    return { success: true, output, variables: interp.getVariables(), functions: interp.getFunctions() };
  } catch (e) {
    return { success: false, error: e.message || String(e), line: e.line || -1 };
  }
});
