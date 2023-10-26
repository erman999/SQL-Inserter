const mysql = require('mysql2');

class MyClass {
  constructor(data) {
    this.name = data?.name ?? null
  }
}

class SQLWrapper {

  constructor(data) {
    console.log(data);
    this.credentials = data.credentials || 'test';
    this.connection = false;
    this.connectionErr = '';
    this.pool = null;
    this.watchInterval = null;
    this.watchTimeInterval = 5000;
    console.log(this);
  }


  setCredentials(credentials) {
    this.credentials = credentials;
    console.log(this);
    return this;
  }


  connected() {
    console.log("Connected to SQL server");
  }


  disconnected() {
    console.log("Failed to connect to SQL server");
  }


  createConnectionPool(credentials) {
    if (isEmpty(credentials)) return {connection: false, pool: null, error: true, response: 'Connection credentials required.'};
    return new Promise(async (resolve, reject) => {
      try {
        const pool = mysql.createPool(credentials);
        const promisePool = pool.promise();
        const [rows, fields] = await promisePool.query("SELECT 1 AS connected;");
        resolve({connection: true, pool: promisePool, error: false, response: rows});
      } catch (err) {
        resolve({connection: false, pool: null, error: true, response: err.code});
      }
    });
  }


  connect() {
    return new Promise(async (resolve) => {
      let result = await this.createConnectionPool(this.credentials);

      this.connection = result.connection;
      this.connectionErr = result.connectionErr;
      this.pool = result.pool;

      if (result.connection) {
        this.connected();
        resolve(true);
      } else {
        this.disconnected();
        resolve(false);
      }

    });
  }


  async checkConnection() {
    let result = await this.query('SELECT 1');
    return result;
  }


  watchConnection(bool) {
    if (bool) {
      this.watchInterval = setInterval(async () => {
        const connectionResult = await this.checkConnection();
        console.log(connectionResult);
        if (connectionResult.error !== this.connection) {

        }
      }, this.watchTimeInterval);
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


  isEmpty(obj) {
    for (const prop in obj) {
      if (Object.hasOwn(obj, prop)) {
        return false;
      }
    }

    return true;
  }




  isConnected() {
    return this.connection;
  }



  mycb(somefn) {
    somefn();
  }


}


module.exports = SQLWrapper;
