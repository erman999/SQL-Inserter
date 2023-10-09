// Import the necessary Electron components
const contextBridge = require('electron').contextBridge;
const ipcRenderer = require('electron').ipcRenderer;

// White-listed channels
const ipc = {
  // From render to main
  'render': {
    'send': [
      'create-settings-window'
    ],
    // From main to render
    'receive': [
      'configs',
      'update-status'
    ],
    // From render to main and back again
    'sendReceive': [
      'save-settings'
    ]
  }
};

// Exposed protected methods in the render process
contextBridge.exposeInMainWorld(
  // Allowed 'ipcRenderer' methods
  'ipcRender', {
    // From render to main
    send: (channel, args) => {
      let validChannels = ipc.render.send;
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, args);
      }
    },
    // From main to render
    receive: (channel, listener) => {
      let validChannels = ipc.render.receive;
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => listener(...args));
      }
    },
    // From render to main and back again
    invoke: (channel, args) => {
      let validChannels = ipc.render.sendReceive;
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, args);
      }
    }
  }
);

/*
* Render --> Main
* ---------------
* Render:  window.ipcRender.send('channel', data); // Data is optional.
* Main:    ipcMain.on('channel', (event, data) => { console.log(data); })
*
*
* Main --> Render
* ---------------
* Main:    mainWindow.webContents.send('channel', data); // Data is optional.
* Render:  window.ipcRender.receive('channel', (data) => { console.log(data); });
*
*
* Render --> Main (Value) --> Render
* ----------------------------------
* Render:  window.ipcRender.invoke('channel', data).then((result) => { console.log(result); });
* Main:    ipcMain.handle('channel', (event, data) => { return data; });
*
*
* Render --> Main (Promise) --> Render
* ------------------------------------
* Render:  window.ipcRender.invoke('channel', data).then((result) => { console.log(result); });
* Main:    ipcMain.handle('channel', async (event, data) => {
*            const myPromise = new Promise((resolve, reject) => {
*              setTimeout(() => {
*                resolve({test: 'foo'});
*              }, 300);
*            });
*            return await myPromise.then((result) => { return result; });
*          });
*/
