const host = document.querySelector('#host');
const user = document.querySelector('#user');
const password = document.querySelector('#password');
const database = document.querySelector('#database');
const btnSave = document.querySelector('#btn-save');

window.addEventListener('DOMContentLoaded', async function() {
  // Check config file on window open
  const db_config = await window.NodeElectron.readDatabaseConfig();
  if (db_config.hasOwnProperty('err')) {
    console.log(db_config.err);
    err.textContent = db_config.err;
    disconnected();
  } else {
    host.value = db_config.host;
    user.value = db_config.user;
    password.value = db_config.password;
    database.value = db_config.database;
  }
});

// User save & test action
btnSave.addEventListener('click', async () => {
  // Get user edited values
  const db_config = {
    "host": host.value,
    "user": user.value,
    "password": password.value,
    "database": database.value,
  }
  // Save new settings
  const result = await window.NodeElectron.saveAndTest(db_config);
  console.log(result);
  // Test connection
  checkConnection();
});
