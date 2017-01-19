// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// In renderer process (web page).
const {ipcRenderer} = require('electron')

document.getElementById("timeleft").textContent = ipcRenderer.sendSync('timeleft');

let configuration = ipcRenderer.sendSync('configuration-sync');

//Bind UI with configuration
for (let key in configuration) {
  let value = configuration[key];
  if (key != "num_pomodoros") value = Math.floor(configuration[key]/60);
  document.getElementById(key + "_range").value = value;
  document.getElementById(key + "_value").innerHTML = value;
  document.getElementById(key + "_range").onchange = function() {
    let newValue = document.getElementById(key + "_range").value;    
    document.getElementById(key + "_value").innerHTML = newValue;
    if (key != "num_pomodoros") newValue *= 60;
    configuration[key] = newValue;
  };
  document.getElementById(key + "_range").oninput = document.getElementById(key + "_range").onchange;
}

function updateTime() {
  document.getElementById("timeleft").textContent = ipcRenderer.sendSync('timeleft');
}
updateTime();

setInterval(updateTime, 1000);

//Handle time updates
ipcRenderer.on('timeleft-async-reply', (event, arg) => {
  document.getElementById("timeleft").textContent = arg;
});

//ipcRenderer.send('timeleft-async'); //Register for time updates


//Apply configuration
document.getElementById("apply_btn").onclick = function() {
  ipcRenderer.send('apply-config-async', configuration); //Register for time updates  
}