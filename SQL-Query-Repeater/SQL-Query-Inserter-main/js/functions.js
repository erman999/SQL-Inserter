// Use common functions for both main and settings windows

function connected() {
  const status = document.querySelector('#status');
  const tag = status.querySelector('span');
  tag.classList.remove('is-danger');
  tag.classList.add('is-success');
  tag.textContent = 'Connected';
}

function disconnected() {
  const status = document.querySelector('#status');
  const tag = status.querySelector('span');
  tag.classList.remove('is-success');
  tag.classList.add('is-danger');
  tag.textContent = 'Disconnected';
}

function checking() {
  const status = document.querySelector('#status');
  const tag = status.querySelector('span');
  tag.classList.remove('is-success');
  tag.classList.remove('is-danger');
  tag.textContent = 'Checking...';
}

async function checkConnection() {
  // Check error existence
  const err = document.querySelector('#err');
  // Display checking status
  checking();
  // Check connection on window open
  const connection = await window.NodeElectron.connectToDatabase();
  if (connection.hasOwnProperty('err')) {
    console.log(connection.err);
    if(err !== null) err.textContent = connection.err;
    disconnected();
    window.NodeElectron.updateConnectionStatus('disconnected');
  } else {
    if(err !== null) err.textContent = '';
    connected();
    window.NodeElectron.updateConnectionStatus('connected');
  }
}
