const mysql = require('mysql2');

class SQLConnector {

  constructor() {
    this.options = {};
    this.connection = false;
    this.connectionErr = '';
    this.pool = null;
    this.alwaysAlive = true;
    this.keepAliveInterval = 0;
    this.keepAliveIntervalTime = 3000;
  }

  test() {
    console.log("Test function worked.");
  }

  keepAlive() {
    this.keepAliveInterval = setInterval(function() {
      console.log("keepAlive worked.");
    }, this.keepAliveIntervalTime);
  }

  connect(options) {
    // Update options
    this.options = options;

    // Print notificationm
    console.log('Trying to connect SQL server...');

    // Return Promise
    return new Promise(async (resolve) => {
      // Try to connect
      let result = await this.createConnectionPool(options);

      // Update class variables
      this.connection = result.connection;
      this.connectionErr = result.connectionErr;
      this.pool = result.pool;

      // Print connection result & resolve
      if (result.connection) {
        console.log("Connected to SQL server");
        resolve(result);
      } else {
        console.log("Failed to connect to SQL server");
        resolve(result);
      }
    });

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


  mycb(somefn) {
    somefn();
  }



}


module.exports = SQLConnector;
