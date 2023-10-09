const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

let mainWindow;
let childWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1000,
    minWidth: 600,
    height: 700,
    minHeight: 300,
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
  childWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    width: 400,
    height: 420,
    autoHideMenuBar: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'js', 'preload.js')
    }
  });
  childWindow.loadFile(path.join('html', 'settings.html'));
  childWindow.webContents.openDevTools();
}


/***** Application *****/
const mysql = require('mysql2');
const FSWrapper = require('./js/fswrapper.js');
const fsw = new FSWrapper();
let promisePool = null;

let vault = {
  mysql: {
    host: null,
    port: null,
    user: null,
    password: null,
    dateStrings: true
  },
  session: {
    connection: false,
    connectionErr: '',
    database: null,
    table: null,
    numberOfQueries: 1,
    timeInterval: 1000
  }
};


/**** Functions ****/
// Start application
async function startApp() {

  // Read config file
  const configs = await fsw.readFile(['configs', 'configs.json']);
  const configsJson = JSON.parse(configs.trim());
  vault = configsJson;


  // Reset previous session
  vault.session.connection = false;
  vault.session.connectionErr = '';


  // Try to connect database
  let dbConnection = await connectToDatabase(vault.mysql);
  // Update main screen status
  mainWindow.webContents.send('update-status', dbConnection.connection);
  // Update session
  vault.session.connection = dbConnection.connection;
  vault.session.connectionErr = !dbConnection.connection ? dbConnection.response : '';

}


// Connect to database
function connectToDatabase(credentials) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("Trying to connect database...");
      const pool  = mysql.createPool(credentials);
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
// Open settings window
ipcMain.on('create-settings-window', (event, data) => {
  // Create settings window
  createSettingsWindow();
  // Send mysql data when loaded
  childWindow.webContents.once('did-finish-load', async () => {
    childWindow.webContents.send('configs', vault);
  });
});


// Save settings
ipcMain.handle('save-settings', async (event, data) => {
  // Update mysql settings
  vault.mysql.host = data.host;
  vault.mysql.port = data.port;
  vault.mysql.user = data.user;
  vault.mysql.password = data.password;

  // Save new settings
  await fsw.writeFileJson(['configs', 'configs.json'], vault);

  // Try to connect with new settings & return Promise to settings window
  return await connectToDatabase(vault.mysql).then((result) => {
    // Update session
    vault.session.connection = result.connection;
    // Update main screen status
    mainWindow.webContents.send('update-status', result.connection);
    // Return result to settings window
    return result;
  });

});
