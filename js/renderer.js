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
const prepare = document.querySelector('#prepare');
const textarea = document.querySelector('#textarea');



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
    <td class="d-field">${field.Field}</td>
    <td class="d-type">${field.Type}</td>
    <td class="d-value"><input class="input is-small" type="text" value="${fieldDefault}"></td>
    </tr>`;

    selectElement.insertAdjacentHTML('beforeend', temp);
  });

  return false;
}


function matchRuleShort(str, rule) {
  var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
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
    console.log("data", data);
    console.log("result", result);
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


function typeFinder(type) {
  const categories = [
    {name: 'TINYINT', category: 'numeric'},
    {name: 'SMALLINT', category: 'numeric'},
    {name: 'MEDIUMINT', category: 'numeric'},
    {name: 'INT', category: 'numeric'},
    {name: 'BIGINT', category: 'numeric'},
    {name: 'DECIMAL', category: 'numeric'},
    {name: 'FLOAT', category: 'numeric'},
    {name: 'DOUBLE', category: 'numeric'},
    {name: 'REAL', category: 'numeric'},
    {name: 'BIT', category: 'numeric'},
    {name: 'BOOLEAN', category: 'numeric'},
    {name: 'SERIAL', category: 'numeric'},
    {name: 'DATE', category: 'date'},
    {name: 'DATETIME', category: 'date'},
    {name: 'TIMESTAMP', category: 'date'},
    {name: 'TIME', category: 'date'},
    {name: 'YEAR', category: 'date'},
    {name: 'CHAR', category: 'string'},
    {name: 'VARCHAR', category: 'string'},
    {name: 'TINYTEXT', category: 'string'},
    {name: 'TEXT', category: 'string'},
    {name: 'MEDIUMTEXT', category: 'string'},
    {name: 'LONGTEXT', category: 'string'},
    {name: 'BINARY', category: 'string'},
    {name: 'VARBINARY', category: 'string'},
    {name: 'TINYBLOB', category: 'string'},
    {name: 'BLOB', category: 'string'},
    {name: 'MEDIUMBLOB', category: 'string'},
    {name: 'LONGBLOB', category: 'string'},
    {name: 'ENUM', category: 'string'},
    {name: 'SET', category: 'string'},
    {name: 'GEOMETRY', category: 'spatial'},
    {name: 'POINT', category: 'spatial'},
    {name: 'LINESTRING', category: 'spatial'},
    {name: 'POLYGON', category: 'spatial'},
    {name: 'MULTIPOINT', category: 'spatial'},
    {name: 'MULTILINESTRING', category: 'spatial'},
    {name: 'MULTIPOLYGON', category: 'spatial'},
    {name: 'GEOMETRYCOLLECTION', category: 'spatial'},
    {name: 'JSON', category: 'json'},
  ];

  type = type.toUpperCase();
  const found = categories.find((item) => matchRuleShort(type, item.name + '*'));
  return found.category;
}

function valueGenerator(type, value) {
  const evaluate = (value.length === 0) ? 'null' : typeFinder(type);
  switch (evaluate) {
    case 'null':
    return 'NULL';
    break;
    case 'numeric':
    // Detect Min/Max call
    if (value.includes("/")) {
      const numbers = value.split("/");
      const min = Math.min(parseFloat(numbers[0].trim()), parseFloat(numbers[1].trim()));
      const max = Math.max(parseFloat(numbers[0].trim()), parseFloat(numbers[1].trim()));

      // Check fraction
      if (String(min).includes(".") || String(max).includes(".")) {
        const minFraction = String(min).split('.')[1].length;
        const maxFraction = String(max).split('.')[1].length;
        const fractionLength = Math.max(minFraction, maxFraction);
        const multiplier = 10 * fractionLength;
        // parseFloat(123.1231231231231.toFixed(2))
      }

      return Math.floor(Math.random() * (max - min + 1)) + min;
      // Detect array call
    } else if (value.includes(",")) {
      // Do
    } else {
      return value;
    }
    console.log('numeric', value);
    break;
    case 'string':
    console.log('string', value);
    break;
    case 'date':
    console.log('date', value);
    break;
    case 'spatial':
    console.log('spatial', value);
    break;
    case 'json':
    console.log('json', value);
    break;
    default:
    // There is no default all cases pre-defined
  }
}

prepare.addEventListener('click', function() {
  const database = databases.value;
  const table = tables.value;
  const fields = fieldsTable.querySelectorAll('.d-field');
  const types = fieldsTable.querySelectorAll('.d-type');
  const values = fieldsTable.querySelectorAll('.d-value input');

  let qFields = [];
  let qValues = [];

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i].textContent.trim();
    const type = types[i].textContent.trim();
    const value = values[i].value.trim();
    const generatorValue = valueGenerator(type, value);

    qFields.push(field);
    qValues.push(generatorValue);
  }

  let query = `INSERT INTO \`${database}\`.\`${table}\` (${qFields.join(', ')}) VALUES (${qValues.join(', ')});`;
  console.log(query);

  textarea.value = query;

  return false;
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
