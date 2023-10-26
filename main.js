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
  mainWindow.webContents.openDevTools();
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
  // childWindow.webContents.openDevTools();
}


/***** Application *****/
const mysql = require('mysql2');
const FSWrapper = require('./js/fswrapper.js');
const SQLWrapper = require('./js/SQLWrapper.js');

const fsw = new FSWrapper();
const SQL = new SQLWrapper();

const User = {
  mysql: {
    host: null,
    port: null,
    user: null,
    password: null,
    dateStrings: true
  },
  session: {
    database: 0,
    table: 0,
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

  // Update User Object
  Object.assign(User, configsJson);


  // const SQL = new SQLWrapper({credentials: User.mysql});
  // SQL.setOptions({credentials: User.mysql});

  // Connect to SQL server
  console.log("HERE:", User.mysql);
  SQL.setCredentials(User.mysql);


  // SQL.reconnect();

  // let cnn = SQL.isConnected();
  // console.log("isConnected", cnn);

  // let dbs = await SQL.showDatabases();
  // console.log(dbs);

  // let tbls = await SQL.showTables('test');
  // console.log(tbls);

  // let flds = await SQL.showFields('test', 'test');
  // console.log(flds);


  // setInterval(async function() {
  //
  //   let qyr = await SQL.query('SELECT 1');
  //   console.log(qyr);
  //
  // }, 3000);


  // if (SQL.connection) {
  //   const initialize = {
  //     databases: await showDatabases(SQL.pool),
  //     tables: await showTables(SQL.pool, User.session.database),
  //     user: User,
  //   };
  //   mainWindow.webContents.send('initialize', initialize);
  // } else {
  //   retryToConnect();
  // }
}

// Update SQL object
function updateSQL(dbConnection) {
  SQL.pool = dbConnection.pool;
  SQL.connection = dbConnection.connection;
  SQL.connectionErr = !dbConnection.connection ? dbConnection.response : '';
  mainWindow.webContents.send('update-status', SQL.connection);
}

// Create an SQL connection loop and keep running until connection establish
async function retryToConnect() {
  let dbConnection = await connectToDatabase(User.mysql);
  updateSQL(dbConnection);
  if (!SQL.connection) {
    setTimeout(function() {
      retryToConnect();
    }, 3000);
  }
}

// Connect to database
function connectToDatabase(credentials) {
  return new Promise(async (resolve, reject) => {
    console.log('Trying to connect SQL server...');
    try {
      const pool  = mysql.createPool(credentials);
      const promisePool = pool.promise();
      const [rows, fields] = await promisePool.query("SELECT 1 AS connected;");
      resolve({connection: true, pool: promisePool, error: false, response: rows});
    } catch (err) {
      resolve({connection: false, pool: null, error: true, response: err.code});
    }
  });
}


// Execute query
async function sqlQuery(pool, query) {
  try {
    const [rows, fields] = await pool.query(query);
    return {result: true, response: rows};
  } catch (e) {
    return {result: false, response: e};
  }
}


async function showDatabases(pool) {
  // Get databases from server
  let serverDatabases = await sqlQuery(pool, 'SHOW DATABASES;');
  // Error handling
  if (!serverDatabases.result) { return {databases: [], error: true}; }
  // Organise values
  let databases = [];
  serverDatabases.response.forEach((db, i) => {
    databases.push(Object.values(db)[0]);
  });
  // Define non-user databases
  let toRemove = ['mysql', 'information_schema', 'performance_schema'];
  // Remove non-user databases
  databases = databases.filter((el) => !toRemove.includes(el));
  // Return databases
  return {databases: databases, error: false};
}



async function showTables(pool, database) {
  let databaseTables = await sqlQuery(pool, `SHOW TABLES FROM ${database};`);
  if (!databaseTables.result) { return {tables: [], error: true}; }
  let tables = [];
  databaseTables.response.forEach((db, i) => {
    tables.push(Object.values(db)[0]);
  });
  return {tables: tables, error: false};
}



async function showFields(pool, database, table) {
  let fields = await sqlQuery(pool, `SHOW FIELDS FROM \`${database}\`.\`${table}\`;`);
  if (!fields.result) { return {fields: [], error: true}; }
  return {fields: fields.response, error: false};
}




/**** IPC Main Channels ****/
// Open settings window
ipcMain.on('create-settings-window', (event, data) => {
  // Create settings window
  createSettingsWindow();
  // Send mysql data when loaded
  childWindow.webContents.once('did-finish-load', async () => {
    const data = {
      user: User,
      sql: {
        connection: SQL.connection,
        connectionErr: SQL.connectionErr
      }
    };
    childWindow.webContents.send('configs', data);
  });
});


// Save settings
ipcMain.handle('save-settings', async (event, data) => {
  // Update mysql settings
  User.mysql.host = data.host;
  User.mysql.port = data.port;
  User.mysql.user = data.user;
  User.mysql.password = data.password;

  // Save new settings
  await fsw.writeFileJson(['configs', 'configs.json'], User);

  // Try to connect with new settings & return Promise to settings window
  return await connectToDatabase(User.mysql).then((result) => {
    // Update session
    SQL.pool = result.pool;
    SQL.connection = result.connection;
    SQL.connectionErr = !result.connection ? result.response : '';
    // Update main screen status
    mainWindow.webContents.send('update-status', result.connection);
    // Return result (excluding pool object)
    return {connection: result.connection, error: result.error, response: result.response};
  });
});


ipcMain.handle('refresh', async (event, data) => {

  const myPromise = new Promise(async (resolve, reject) => {
    const pack = {
      databases: await showDatabases(SQL.pool),
      tables: await showTables(SQL.pool, data.database),
      fields: await showFields(SQL.pool, data.database, data.table)
    };
    resolve(pack);
  });

  return await myPromise.then((result) => { return result; });
});


ipcMain.handle('list-databases', async (event, data) => {
  const myPromise = new Promise(async (resolve, reject) => {
    let db = await showDatabases(SQL.pool);
    resolve(db);
  });
  return await myPromise.then((result) => { return result; });
});



ipcMain.handle('list-tables', async (event, database) => {
  const myPromise = new Promise(async (resolve, reject) => {
    let tables = await showTables(SQL.pool, database);
    resolve(tables);
  });
  return await myPromise.then((result) => { return result; });
});


ipcMain.handle('list-fields', async (event, data) => {
  const myPromise = new Promise(async (resolve, reject) => {
    let fields = await showFields(SQL.pool, data.database, data.table);
    resolve(fields);
  });
  return await myPromise.then((result) => { return result; });
});



// Update session
ipcMain.on('update-session', async (event, data) => {
  User.session[data.property] = data.value;
  await fsw.writeFileJson(['configs', 'configs.json'], User);
});
