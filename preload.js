const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openFile:       ()           => ipcRenderer.invoke('open-file'),
  saveFile:       (data)       => ipcRenderer.invoke('save-file', data),
  runCode:        (code)       => ipcRenderer.invoke('run-code', code),
  minimize:       ()           => ipcRenderer.send('window-minimize'),
  maximize:       ()           => ipcRenderer.send('window-maximize'),
  close:          ()           => ipcRenderer.send('window-close'),
});
