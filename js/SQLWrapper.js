const mysql = require('mysql2');

class SQLWrapper {

  constructor(options) {
    this.options = options;
    this.connection = false;
    this.connectionErr = '';
    this.pool = null;
    this.alwaysAlive = true;
    this.interval = 0;
  }


  createConnectionPool(options) {
    return new Promise(async (resolve, reject) => {
      try {
        const pool = mysql.createPool(options);
        const promisePool = pool.promise();
        const [rows, fields] = await promisePool.query("SELECT 1 AS connected;");
        resolve({connection: true, pool: promisePool, error: false, response: rows});
      } catch (err) {
        resolve({connection: false, pool: null, error: true, response: err.code});
      }
    });
  }


  connect(settings) {
    console.log('Trying to connect SQL server...');
    return new Promise(async (resolve) => {
      let result = await this.createConnectionPool(this.options);

      this.connection = result.connection;
      this.connectionErr = result.connectionErr;
      this.pool = result.pool;

      this.reconnect(settings.reconnect ?? false);

      if (result.connection) {
        console.log("Connected to SQL server");
        resolve(true);
      } else {
        console.log("Failed to connect to SQL server");
        resolve(false);
      }

    });
  }


  // checkConnection() {
  //   let result = await this.query('SELECT 1');
  //
  //   if (result.error) {
  //     this.connection = false;
  //     this.connectionErr = result.errorMsg;
  //   }
  // }

  reconnect(bool) {
    if (bool) {
      // Burada kaldım...
      this.interval = setInterval(this.connect.bind(this), 3000);
    }
  }


  async query(statement) {
    if (!this.isConnected()) return {response: [], error: true, errorMsg: 'Connection error'};
    try {
      const [rows, fields] = await this.pool.query(statement);
      return {response: rows, error: false, errorMsg: ''};
    } catch (e) {
      return {response: [], error: true, errorMsg: e.code};
    }
  }


  async showDatabases() {
    if (!this.isConnected()) return {response: [], error: true, errorMsg: 'Connection error'};
    let result = await this.query('SHOW DATABASES;');
    let databases = [];
    result.response.forEach((db, i) => {
      databases.push(Object.values(db)[0]);
    });
    let toRemove = ['mysql', 'information_schema', 'performance_schema']; // Define non-user databases
    databases = databases.filter((el) => !toRemove.includes(el)); // Remove non-user databases
    return {response: databases, error: false, errorMsg: result.errorMsg};
  }


  async showTables(databaseName) {
    if (!this.isConnected()) return {response: [], error: true, errorMsg: 'Connection error'};
    let result = await this.query(`SHOW TABLES FROM ${databaseName};`);
    let tables = [];
    result.response.forEach((db, i) => {
      tables.push(Object.values(db)[0]);
    });
    return {response: tables, error: false, errorMsg: result.errorMsg};
  }


  async showFields(databaseName, tableName) {
    if (!this.isConnected()) return {response: [], error: true, errorMsg: 'Connection error'};
    let result = await this.query(`SHOW FIELDS FROM \`${databaseName}\`.\`${tableName}\`;`);
    return result;
  }


  setOptions(options) {
    this.options = options;
    return this;
  }


  isConnected() {
    return this.connection;
  }



  mycb(somefn) {
    somefn();
  }


}


module.exports = SQLWrapper;
