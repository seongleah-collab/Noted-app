const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('noted', {
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  sendMessage: (data) => ipcRenderer.invoke('send-message', data),
  sendMessageStream: (data) => ipcRenderer.invoke('send-message-stream', data),
  onStreamDelta: (callback) => ipcRenderer.on('stream-delta', (_, text) => callback(text)),
  onStreamEnd: (callback) => ipcRenderer.on('stream-end', () => callback()),
  onTriggerScreenshot: (callback) => ipcRenderer.on('trigger-screenshot', () => callback()),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
});
