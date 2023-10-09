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

const Vault = {
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
  // Update Vault
  Object.assign(Vault, configsJson);

  // Reset previous session
  Vault.session.connection = false;
  Vault.session.connectionErr = '';

  // Try to connect database
  let dbConnection = await connectToDatabase(Vault.mysql);
  // Update main screen status
  mainWindow.webContents.send('update-status', dbConnection.connection);
  // Update session
  Vault.session.connection = dbConnection.connection;
  Vault.session.connectionErr = !dbConnection.connection ? dbConnection.response : '';

  console.log(Vault);
}


// Connect to database
function connectToDatabase(credentials) {
  return new Promise(async (resolve, reject) => {
    try {
      const pool  = mysql.createPool(credentials);
      const promisePool = pool.promise();
      const [rows, fields] = await promisePool.query("SELECT 1 AS connected;");
      resolve({connection: true, pool: promisePool, error: false, response: rows});
    } catch (err) {
      resolve({connection: false, pool: false, error: true, response: err.code});
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
    childWindow.webContents.send('configs', Vault);
  });
});


// Save settings
ipcMain.handle('save-settings', async (event, data) => {
  // Update mysql settings
  Vault.mysql.host = data.host;
  Vault.mysql.port = data.port;
  Vault.mysql.user = data.user;
  Vault.mysql.password = data.password;

  // Save new settings
  await fsw.writeFileJson(['configs', 'configs.json'], Vault);

  // Try to connect with new settings & return Promise to settings window
  return await connectToDatabase(Vault.mysql).then((result) => {
    // Update session
    Vault.session.connection = result.connection;
    Vault.session.connectionErr = !result.connection ? result.response : '';
    // Update main screen status
    mainWindow.webContents.send('update-status', result.connection);
    // Return result (excluding pool object)
    return {connection: result.connection, error: result.error, response: result.response};
  });

});
