const repeat = document.querySelector('#repeat');
const timer = document.querySelector('#timer');
const start = document.querySelector('#start');
const queryArea = document.querySelector('#query-area');
const resultArea = document.querySelector('#result-area');
const databaseSettings = document.querySelector('#btn-database-settings');

let isRunning = false;
let isRepeatingOn = false;
let myInterval;


// Listen DOM Load
window.addEventListener('DOMContentLoaded', async function() {
  // Check database connection when DOM parsed completely
  checkConnection();
});

// Tell main.js to open Database Settings window
databaseSettings.addEventListener('click', () => {
  window.NodeElectron.openDatabaseSettings();
});

// Listen database connection
window.NodeElectron.noConnection((_event, value) => {
  resultArea.classList.add('is-danger');
  resultArea.value = 'No database connection';
});

// Listen database settings save&test button action
window.NodeElectron.connectionStatus((_event, value) => {
  // Update database status on mainWindow
  if (value == 'connected') {
    connected();
    start.removeAttribute('disabled');
  } else {
    disconnected();
    start.setAttribute("disabled", "");
  }
});

// SQL query and result printing function
async function runQuery() {
  // Get query
  const query = queryArea.value.trim();
  // Clear result area
  resultArea.classList.remove('is-success', 'is-danger');
  resultArea.value = '';
  // Send query
  const result = await window.NodeElectron.sendQuery(query);
  // Show SQL repsonse
  if (result.err) {
    resultArea.classList.add('is-danger');
    resultArea.value = result.response;
  } else {
    resultArea.classList.add('is-success');
    // If rows are array, then it's a SELECT statement
    if (Array.isArray(result.rows)) {
      // Check array size
      if (result.rows.length == 0) {
        resultArea.value = "SQL returned an empty result set (i.e. zero rows)";
      } else if (result.rows.length > 0) {
        let info = '';
        // Print headings as TSV
        const columns = Object.keys(result.rows[0]);
        columns.forEach((item) => info += item + '\t' );
        info = info.trim();
        info += '\n';
        // Print data as TSV
        result.rows.forEach((item) => {
          let row = '';
          columns.forEach((key, i) => {
            row += item[key] + '\t';
          });
          info += row.trim() + '\n';
        });
        // Print data to textarea
        resultArea.value = info;
      }
    } else {
      // Show results for INSERT, UPDATE, DELETE
      let info = '';
      if (result.rows.hasOwnProperty('affectedRows')) info += 'Affected Rows: ' + result.rows.affectedRows + ', ';
      if (result.rows.hasOwnProperty('changedRows')) info += 'Changed Rows: ' + result.rows.changedRows + ', ';
      if (result.rows.hasOwnProperty('insertId')) info += 'Insert ID: ' + result.rows.insertId + ', ';
      if (result.rows.hasOwnProperty('warningStatus')) info += 'Warning Status: ' + result.rows.warningStatus + ', ';
      resultArea.value = info.trim().slice(0, -1);
    }
  }
  return true;
}

// Start / Stop button actions
start.addEventListener('click', async function() {

  if (isRepeatingOn == false && isRunning == false) {
    // Single run
    animateStartButton();
    const complete = await runQuery();
    if (complete) animateStartButton();
  } else if (isRepeatingOn == true && isRunning == false) {
    // Start loop
    animateStartButton();
    timer.setAttribute("disabled", "");
    repeat.setAttribute("disabled", "");
    // queryArea.setAttribute("disabled", "");
    const repeatingTimer = parseInt(timer.value);
    myInterval = setInterval(async function() {
      const complete = await runQuery();
    }, repeatingTimer);

  } else if (isRepeatingOn == true && isRunning == true) {
    // Stop loop
    animateStartButton();
    timer.removeAttribute('disabled');
    repeat.removeAttribute('disabled');
    // queryArea.removeAttribute('disabled');
    clearInterval(myInterval);
  }

});

// Listen repeat checkbox change (i.e. checked or non-checked)
repeat.addEventListener('change', function() {
  if (this.checked) {
    timer.removeAttribute('disabled');
    isRepeatingOn = true;
  } else {
    timer.setAttribute("disabled", "");
    isRepeatingOn = false;
  }
});

// Start / Stop button style and icon change
function animateStartButton() {
  // Icon
  const start = document.querySelector('#start');
  const btnIcon = start.querySelector('use');
  const iconLink = btnIcon.getAttribute('xlink:href');
  const explode = iconLink.split('#');
  const playIcon = 'icon-play_arrow';
  const stopIcon = 'icon-stop';
  const playLink = explode[0] + '#' + playIcon;
  const stopLink = explode[0] + '#' + stopIcon;
  // Check if app is running
  if (!isRunning) {
    isRunning = true;
    start.classList.remove('is-success');
    start.classList.add('is-danger');
    btnIcon.setAttribute('xlink:href', stopLink);
    start.querySelector('.btn-text').textContent = 'Stop';
  } else {
    isRunning = false;
    start.classList.add('is-success');
    start.classList.remove('is-danger');
    btnIcon.setAttribute('xlink:href', playLink);
    start.querySelector('.btn-text').textContent = 'Start';
  }
}

// Set last query value to queryArea
window.NodeElectron.lastQuery((_event, value) => {
  queryArea.value = value;
});

// (Development only) Simple test function
const btnTest = document.querySelector('#test');
if (btnTest !== null) {
  btnTest.addEventListener('click', async function() {
    const test = await window.NodeElectron.test('text');
    console.log(test);
  });
}
