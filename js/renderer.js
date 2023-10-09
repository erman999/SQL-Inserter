/**** Elements ****/
const settings = document.querySelector('#settings');
const status = document.querySelector('#status span');



/**** Functions ****/
function updateStatus(bool) {
  status.textContent = bool ? 'Connected' : 'Unconnected';
  status.classList.add(bool ? 'is-success' : 'is-danger');
  status.classList.remove(bool ? 'is-danger' : 'is-success');
}



/**** IPC Renderer Channels ****/
settings.addEventListener('click', function() {
  window.ipcRender.send('create-settings-window'); // Data is optional.
});

window.ipcRender.receive('update-status', (data) => {
  updateStatus(data);
});
