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

  mainWindow.webContents.once('did-finish-load', async () => {
    startApp();
  });

});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Create Database Settings window
function createSettingsWindow() {
  const childWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    width: 400,
    height: 350,
    autoHideMenuBar: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'js', 'preload.js')
    }
  });
  childWindow.loadFile(path.join('html', 'settings.html'));
}


/***** Applicaton *****/
const fs = require('fs');
const FSWrap = require('./fswrap.js');
const fsw = new FSWrap();


/**** Functions ****/
// Start application
async function startApp() {
  // Read config file
  const configs = await readFileJson(['configs', 'configs.json']);
  console.log(configs);
}


// Read file as json
async function readFileJson(pathArr) {
  // Define development and Electron-Forge folder structure
  const pathDevelopment = path.join(...pathArr);
  const pathProduction = path.join('resources', ...pathArr);

  // Check file existence
  const pathCheckerDev = await fsw.exists(pathDevelopment);
  const pathCheckerProd = await fsw.exists(pathProduction);

  // If file is not existed in both paths return false
  if (!pathCheckerDev && !pathCheckerProd) return false;
  // Assign real path
  const realPath = pathCheckerDev ? pathDevelopment : pathProduction;
  // Read file
  try {
    const contents = await fs.promises.readFile(realPath, { encoding: 'utf8' });
    return JSON.parse(contents.trim());
  } catch (err) {
    console.error(err.message);
    return false;
  }
}

// Write file as json
async function writeFileJson(pathArr, data) {
  // Handle Electron-Forge folder structure
  const pathDevelopment = path.join(...pathArr);
  const pathProduction = path.join('resources', ...pathArr);

  // Check file existence
  const pathCheckerDev = await fileExists(pathDevelopment);
  const pathCheckerProd = await fileExists(pathProduction);

  // If file is not existed in both paths return false
  if (!pathCheckerDev && !pathCheckerProd) return false;
  // Assign real path
  const realPath = pathCheckerDev ? pathDevelopment : pathProduction;
  // Write file
  try {
    await fs.promises.writeFile(realPath, JSON.stringify(data));
    console.log(`File [${realPath}] saved.`);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// Connect to database
async function connectToDatabase() {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Trying to connect database...");
      const pool  = mysql.createPool({host: server.configs.mysqlIp, user: server.configs.mysqlUser, password: server.configs.mysqlPassword, dateStrings: true});
      const poolTest = pool.promise();
      const [rows, fields] = await poolTest.query("SELECT 1 AS connected;");
      promisePool = poolTest;
      resolve({connection: true});
    } catch (e) {
      promisePool = {};
      resolve({connection: false, response: e});
    }
  });
}


/**** IPC Main Channels ****/
// Render --> Main
ipcMain.on('create-settings-window', (event, data) => {
  createSettingsWindow();
});


// Main --> Render
// mainWindow.webContents.send('channel-2', data);


// // Render --> Main (Value) --> Render
// ipcMain.handle('channel-3', (event, data) => {
//   let reverseText = reverseString(data);
//   console.log(`Render --> Main (Value) --> Render [Received data: ${data}] [Send data: ${reverseText}]`);
//   return reverseText;
// });


// // Render --> Main (Promise) --> Render
// ipcMain.handle('channel-4', async (event, data) => {
//   let timer = Math.floor(Math.random()*1000);
//   let response = `Resolved after ${timer}ms`;
//   console.log(`Render --> Main (Promise) --> Render [Received data: ${data}] [Send data: ${response}]`);
//
//   // Define promise function
//   const myPromise = new Promise((resolve, reject) => {
//     setTimeout(() => {
//       resolve(response);
//     }, timer);
//   });
//
//   // Return promise
//   return await myPromise.then((result) => {
//     return result;
//   });
//
// });
