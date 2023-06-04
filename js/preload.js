const {contextBridge, ipcRenderer } = require('electron');
const os = require('os');

contextBridge.exposeInMainWorld('NodeElectron', {
  test: (data) => ipcRenderer.invoke('my:test', data),
  readDatabaseConfig: () => ipcRenderer.invoke('my:readDatabaseConfig'),
  connectToDatabase: () => ipcRenderer.invoke('my:connectToDatabase'),
  saveAndTest: (data) => ipcRenderer.invoke('my:saveAndTest', data),
  openDatabaseSettings: () => ipcRenderer.invoke('my:openDatabaseSettings'),
  updateConnectionStatus: (data) => ipcRenderer.send('my:updateConnectionStatus', data),
  connectionStatus: (data) => ipcRenderer.on('my:connectionStatus', data),
  noConnection: (data) => ipcRenderer.on('my:noConnection', data),
  sendQuery: (data) => ipcRenderer.invoke('my:sendQuery', data),
  lastQuery: (data) => ipcRenderer.on('my:lastQuery', data)
});
