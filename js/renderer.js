/***** Elements *****/
const settings = document.querySelector('#settings');
const status = document.querySelector('#status span');
const refresh = document.querySelector('#refresh');
const databases = document.querySelector('#databases');
const tables = document.querySelector('#tables');
const numberOfQueries = document.querySelector('#number-of-queries');
const timeInterval = document.querySelector('#time-interval');
const watchElements = [databases, tables, numberOfQueries, timeInterval];


/***** Functions *****/
function updateStatus(bool) {
  status.textContent = bool ? 'Connected' : 'Unconnected';
  status.classList.add(bool ? 'is-success' : 'is-danger');
  status.classList.remove(bool ? 'is-danger' : 'is-success');
}

function listDatabases(selectElement, data) {
  // data = {error: boolean, dataases: []}

  if (data.error) { console.log("Error: listDatabases"); }

  while (selectElement.firstChild) {
    selectElement.removeChild(selectElement.lastChild);
  }

  const selected = `<option value="0" selected disabled>Select database</option>`;
  selectElement.insertAdjacentHTML('beforeend', selected);

  data.databases.forEach((database, i) => {
    const temp = `<option value="${database}">${database}</option>`;
    selectElement.insertAdjacentHTML('beforeend', temp);
  });

  return false;
}



function listTables(selectElement, data) {
  // data = {error: boolean, dataases: []}

  if (data.error) { console.log("Error: listTables"); }

  while (selectElement.firstChild) {
    selectElement.removeChild(selectElement.lastChild);
  }

  const selected = `<option value="0" selected disabled>Select table</option>`;
  selectElement.insertAdjacentHTML('beforeend', selected);

  data.tables.forEach((table, i) => {
    const temp = `<option value="${table}">${table}</option>`;
    selectElement.insertAdjacentHTML('beforeend', temp);
  });

  return false;
}


/***** Event Listeners *****/
settings.addEventListener('click', function() {
  window.ipcRender.send('create-settings-window');
});


refresh.addEventListener('click', function() {
  window.ipcRender.invoke('list-databases', null).then((result) => {
    listDatabases(databases, result);
  });
});


databases.addEventListener('change', function() {
  window.ipcRender.invoke('list-tables', databases.value).then((result) => {
    listTables(tables, result);
  });
});


tables.addEventListener('change', function() {
  const data = {database: databases.value, table: tables.value};
  window.ipcRender.invoke('list-fields', data).then((result) => {
    console.log(result);
  });
});


watchElements.forEach((el, i) => {
  el.addEventListener('change', function() {
    const property = this.dataset.property;
    const value = this.value;
    const data = {property: property, value: value};
    window.ipcRender.send('update-session', data);
  });
});




/***** IPC Renderer Channels *****/
window.ipcRender.receive('initialize', (data) => {
  console.log(data);

  if (!data.databases.error) { listDatabases(databases, data.databases); }
  if (!data.tables.error) { listTables(tables, data.tables); }

  databases.value = data.user.session.database;
  tables.value = data.user.session.table;
  numberOfQueries.value = parseInt(data.user.session.numberOfQueries);
  timeInterval.value = parseInt(data.user.session.timeInterval);

});

window.ipcRender.receive('update-status', (data) => {
  updateStatus(data);
});
