/***** Elements *****/
const settings = document.querySelector('#settings');
const status = document.querySelector('#status span');
const refresh = document.querySelector('#refresh');
const databases = document.querySelector('#databases');
const tables = document.querySelector('#tables');
const fieldsTable = document.querySelector('#fields-table');
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




function listFields(selectElement, data) {
  // data = {error: boolean, dataases: []}

  if (data.error) { console.log("Error: listFields"); }

  while (selectElement.firstChild) {
    selectElement.removeChild(selectElement.lastChild);
  }

  data.fields.forEach((field, i) => {
    console.log(field);


    let fieldDefault = '';
    if (field.Default === null) {
      fieldDefault = '';
    } else if (field.Default === 'CURRENT_TIMESTAMP') {
      let dt = new Date();
      fieldDefault = dt.toISOString().replace('T', ' ').split('\.')[0];
    } else {
      fieldDefault = field.Default;
    }

    const temp = `
    <tr>
    <td>${field.Field}</td>
    <td>${field.Type}</td>
    <td><input class="input is-small" type="text" value="${fieldDefault}"></td>
    </tr>`;

    selectElement.insertAdjacentHTML('beforeend', temp);
  });

  return false;
}


/***** Event Listeners *****/
settings.addEventListener('click', function() {
  window.ipcRender.send('create-settings-window');
});


refresh.addEventListener('click', function() {

  const data = {
    database: databases.value,
    table: tables.value
  };

  window.ipcRender.invoke('refresh', data).then((result) => {
    console.log(result);
    listDatabases(databases, result.databases);
    listTables(tables, result.tables);
    listFields(fieldsTable, result.fields);
    databases.value = data.database;
    tables.value = data.table;
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
    listFields(fieldsTable, result);
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
