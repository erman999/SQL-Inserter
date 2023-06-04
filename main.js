// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Make these global
let mainWindow;
let lastQuery = '';

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 650,
    height: 550,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'js', 'preload.js')
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join('html', 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  return mainWindow;
}

// This method will be called when Electron has finished
app.whenReady().then(() => {
  // Create main window
  mainWindow = createWindow();
  // This is for macOS behaviour
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Get last query statement and send to renderer
  mainWindow.webContents.once('did-finish-load', async () => {

    // Get last query
    const filePath = path.join(__dirname, 'configs', 'last_query.txt');
    const isFileExist = await checkFileExistence(filePath);
    if (isFileExist) {
      // Read last query from the file
      const data = await readThisFile(filePath);
      // Send last query to query area
      mainWindow.webContents.send('my:lastQuery', data);
    }
  });

});

// This is also for macOS behaviour
app.on('window-all-closed', function () {
  mainWindow = null;
  if (process.platform !== 'darwin') app.quit();
});


/********** Application Specific Codes **********/
// Create Database Settings window
function createSettingsWindow() {
  const childWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    width: 400,
    height: 440,
    autoHideMenuBar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'js', 'preload.js')
    }
  });
  childWindow.loadFile(path.join('html', 'settings.html'));
}

// IPC functions
ipcMain.handle('my:test', test);
ipcMain.handle('my:readDatabaseConfig', readDatabaseConfig);
ipcMain.handle('my:connectToDatabase', connectToDatabase);
ipcMain.handle('my:saveAndTest', saveAndTest);
ipcMain.handle('my:openDatabaseSettings', openDatabaseSettings);
ipcMain.on('my:updateConnectionStatus', updateConnectionStatus);
ipcMain.handle('my:sendQuery', sendQuery);

// Require libs
const fs = require('fs');
const mysql = require('mysql2');

// Keep SQL alive
let promisePool;
let isConnected = false;

// Create database settings window on click
function openDatabaseSettings() {
  createSettingsWindow();
}

// Check file existence (instead of deprecated fs.exist)
function checkFileExistence(filePath) {
  return new Promise(function(resolve, reject) {
    fs.stat(filePath, (err, stats) => {
      if (err == null) {
        // console.log('File exists');
        resolve(true);
      } else if (err.code === 'ENOENT') {
        // console.log('File does not exists');
        resolve(false);
      } else {
        console.log('Some other error: ', err.code);
        resolve(err.code);
      }
    });
  });
}

// Read local file
function readThisFile(filePath) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err == null) {
        resolve(data);
      }
    });
  });
}

// Read & return database settings for user edit
async function readDatabaseConfig(event, data) {
  // Get file existence
  const filePath = path.join(__dirname, 'configs', 'db_config.json');
  const isFileExist = await checkFileExistence(filePath);
  // Check file existence
  if (!isFileExist) {
    return {err: 'File not exist.'};
  } else {
    // Read file
    const rawdata = await readThisFile(filePath);
    // Parse to JSON
    let db_config = {};
    try {
      db_config = JSON.parse(rawdata.toString().trim());
    } catch (e) {
      return {err: 'Config file could not parsed correctly.'};
    }
    return db_config;
  }
}

// Try to connect database and create SQL promisePool
async function connectToDatabase(event, data) {
  // Get file existence
  const filePath = path.join(__dirname, 'configs', 'db_config.json');
  const isFileExist = await checkFileExistence(filePath);
  // Check file existence
  if (!isFileExist) {
    return {err: 'File does not exist'};
  } else {
    // Read file
    const rawdata = await readThisFile(filePath);
    // Parse to JSON
    let db_config = {};
    try {
      db_config = JSON.parse(rawdata.toString().trim());
    } catch (e) {
      return {err: 'Config file could not parsed correctly.'};
    }
    // Connect to database
    try {
      const pool  = mysql.createPool(db_config);
      const promisePoolCheck = pool.promise();
      const [rows, fields] = await promisePoolCheck.query("SELECT 1");
      promisePool = promisePoolCheck;
      isConnected = true;
      return {success: 'Connected', rows: rows};
    } catch (e) {
      promisePool = {};
      isConnected = false;
      return {err: 'Could not connect to database please check your database settings.'};
    }
  }
}

// Read local file
function writeThisFile(filePath, data) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(filePath, data, 'utf8', (err) => {
      if (err) throw err;
      resolve(data);
    });
  });
}

// Save and test edited database settings
async function saveAndTest(event, data) {
  const filePath = path.join(__dirname, 'configs', 'db_config.json');
  const response = await writeThisFile(filePath, JSON.stringify(data));
}

// Update mainWindow connection status after settings changed
async function updateConnectionStatus(event, data) {
  mainWindow.webContents.send('my:connectionStatus', data);
}

// Send query to SQL and return results and errors
async function sendQuery(event, data) {
  // 'before-quit', 'will-quit' and 'quit' listeners don't work for Windows.
  // Better to save function here to keep feature working
  if (lastQuery != data || (data.length == 0 && lastQuery.length == 0)) {
    lastQuery = data;
    const save = await saveQuery();
  }

  try {
    const [rows, fields] = await promisePool.query(data);
    const result = {rows: rows, fields: fields, err: false};
    return result;
  } catch (e) {
    return {err: true, response: e};
  }
}

// Save last query
async function saveQuery() {
  const filePath = path.join(__dirname, 'configs', 'last_query.txt');
  const response = await writeThisFile(filePath, lastQuery);
  return response;
}

// (Development only) Simple test function
function test(event, data) {
  let txt = 'Response: ' + data
  console.log(txt);
  return txt;
}
