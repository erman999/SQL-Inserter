// Settings Renderer
const host = document.querySelector('#host');
const port = document.querySelector('#port');
const user = document.querySelector('#user');
const password = document.querySelector('#password');
const status = document.querySelector('#status span');
const err = document.querySelector('#err');
const btnSave = document.querySelector('#btn-save');

function updateStatus(bool) {
  status.textContent = bool ? 'Connected' : 'Unconnected';
  status.classList.add(bool ? 'is-success' : 'is-danger');
  status.classList.remove(bool ? 'is-danger' : 'is-success');
}

window.ipcRender.receive('configs', (data) => {
  console.log(data);
  host.value = data.mysql.host;
  port.value = data.mysql.port;
  user.value = data.mysql.user;
  password.value = data.mysql.password;
  updateStatus(data.session.connection);
  err.textContent = data.session.connectionErr;
});

btnSave.addEventListener('click', function() {
  const mysql = {};
  mysql.host = host.value.trim();
  mysql.port = port.value.trim();
  mysql.user = user.value.trim();
  mysql.password = password.value.trim();

  window.ipcRender.invoke('save-settings', mysql).then((result) => {
    console.log(result);
    updateStatus(result.connection);
    err.textContent = !result.connection ? result.response : '';
    return false;
  });

});
