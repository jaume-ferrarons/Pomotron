const {ipcRenderer} = require('electron')

//Prepends a 0 to the given number if it's below 10
function to2DigitsInt(n) {
  n = Math.floor(n);
  if (n < 10) return "0" + n;
  return n;
}

//Converts the milliseconds to the format: HH:MM:SS
function formatTime(milliseconds) {
  seconds = Math.floor(milliseconds / 1000);
  let hours = to2DigitsInt(seconds / 3600);
  seconds = to2DigitsInt(seconds % 3600);
  let minutes = to2DigitsInt(seconds / 60);
  seconds = to2DigitsInt(seconds % 60);
  return hours + ":" + minutes + ":" + seconds;
}

//Updated the timer state
function updateTime() {
  //Fetch the state from the main class
  let state = ipcRenderer.sendSync('state');

  let left = state.time_left;
  if (!state.paused) left -= new Date().getTime() - state.status_changed;

  document.getElementById("timeleft").textContent = formatTime(left);
}

//Uptate the time left now
updateTime();

//Update the time left evey second
setInterval(updateTime, 1000)