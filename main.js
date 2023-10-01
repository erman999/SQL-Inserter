const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'js', 'preload.js')
    }
  });

  mainWindow.loadFile(path.join('html', 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});


/**** Functions ****/
// Reverse given text
function reverseString(str) {
  var splitString = str.split(""); // var splitString = "hello".split("");
  var reverseArray = splitString.reverse(); // var reverseArray = ["h", "e", "l", "l", "o"].reverse();
  var joinArray = reverseArray.join(""); // var joinArray = ["o", "l", "l", "e", "h"].join("");
  return joinArray; // "olleh"
}


/**** IPC Main Channels ****/
// Render --> Main
ipcMain.on('channel-1', (event, data) => {
  console.log(`Render --> Main [Received data: ${data}]`);
});


// Main --> Render
setInterval(function() {
  let data = Math.floor(Math.random()*100);
  mainWindow.webContents.send('channel-2', data);
}, 1000);


// Render --> Main (Value) --> Render
ipcMain.handle('channel-3', (event, data) => {
  let reverseText = reverseString(data);
  console.log(`Render --> Main (Value) --> Render [Received data: ${data}] [Send data: ${reverseText}]`);
  return reverseText;
});


// Render --> Main (Promise) --> Render
ipcMain.handle('channel-4', async (event, data) => {
  let timer = Math.floor(Math.random()*1000);
  let response = `Resolved after ${timer}ms`;
  console.log(`Render --> Main (Promise) --> Render [Received data: ${data}] [Send data: ${response}]`);

  // Define promise function
  const myPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(response);
    }, timer);
  });

  // Return promise
  return await myPromise.then((result) => {
    return result;
  });

});
