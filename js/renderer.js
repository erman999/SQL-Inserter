/**** DOM Elements ****/
// Row 1
let row1Send = document.querySelector('#row1-send');
let row1Button = document.querySelector('#row1-button');

// Row 2
let row2Receive = document.querySelector('#row2-receive');

// Row 3
let row3Send = document.querySelector('#row3-send');
let row3Button = document.querySelector('#row3-button');
let row3Receive = document.querySelector('#row3-receive');

// Row 4
let row4Send = document.querySelector('#row4-send');
let row4Button = document.querySelector('#row4-button');
let row4Receive = document.querySelector('#row4-receive');



/**** IPC Renderer Channels ****/
// Render --> Main
row1Button.addEventListener('click', function() {
  window.ipcRender.send('channel-1', row1Send.value); // Data is optional.
});


// Main --> Render
window.ipcRender.receive('channel-2', (data) => {
  row2Receive.value = data;
});


// Render --> Main (Value) --> Render
row3Button.addEventListener('click', function() {
  window.ipcRender.invoke('channel-3', row3Send.value).then((result) => {
    row3Receive.value = result;
  });
});


// Render --> Main (Promise) --> Render
row4Button.addEventListener('click', function() {
  window.ipcRender.invoke('channel-4', row4Send.value).then((result) => {
    row4Receive.value = result;
  });
});
