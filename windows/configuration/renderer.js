// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

// In renderer process (web page).
const {ipcRenderer} = require('electron')

let configuration = ipcRenderer.sendSync('configuration-sync');
let edited_configuration = $.extend({}, configuration);

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

//Bind UI with configuration
for (let key of ["pomodoro_duration", "short_break_duration", "long_break_duration", "num_pomodoros"]) {
  let value = edited_configuration[key];
  if (key != "num_pomodoros") value = Math.floor(edited_configuration[key] / 60);
  document.getElementById(key + "_range").value = value;
  document.getElementById(key + "_value").innerHTML = value;
  document.getElementById(key + "_range").onchange = function () {
    let newValue = document.getElementById(key + "_range").value;
    document.getElementById(key + "_value").innerHTML = newValue;
    if (key != "num_pomodoros") newValue *= 60;
    edited_configuration[key] = newValue;
  };
  document.getElementById(key + "_range").oninput = document.getElementById(key + "_range").onchange;
}

//Set start on boot checkbox
$("#chk_start_on_boot").
  prop('checked', edited_configuration["start_on_boot"]).
  change(function () {
    edited_configuration["start_on_boot"] = $(this).is(':checked')
  });


//Updated the timer state
function updateTime() {
  //Fetch the state from the main class
  let state = ipcRenderer.sendSync('state');

  let left = state.time_left;
  if (!state.paused) left -= new Date().getTime() - state.status_changed;

  document.getElementById("timeleft").textContent = formatTime(left);
  //Update marker positions
  setMarker((state.ends_at - left) / 1000);
}
updateTime();

setInterval(updateTime, 1000);


//Apply configuration
document.getElementById("apply_btn").onclick = function () {
  ipcRenderer.send('apply-config-async', edited_configuration); //Register for time updates 
  configuration = $.extend({}, edited_configuration);
  initProgressBars();
}

//Initializes the timeline from the UI
function initProgressBars() {
  let pomodoro_duration = configuration['pomodoro_duration'];
  let short_break_duration = configuration['short_break_duration'];
  let long_break_duration = configuration['long_break_duration'];
  let num_pomodoros = configuration['num_pomodoros'];

  //Compute the total time
  let totalTime = (pomodoro_duration + short_break_duration) * num_pomodoros + long_break_duration;

  let timeline = $("#timeline");

  //Clean bars
  $(".progress-bar").remove();

  //Create new bars
  for (let i = 0; i < num_pomodoros; i++) {
    timeline.append(createProgressBar(true, pomodoro_duration / totalTime * 100));
    timeline.append(createProgressBar(false, short_break_duration / totalTime * 100));
  }
  timeline.append(createProgressBar(false, long_break_duration / totalTime * 100));
}

//Creates a progress bar of the given working type and to occupy the specified percentage
function createProgressBar(working, percentage) {
  let color = 'success';
  if (working) color = 'danger';
  let html = `
    <div class="progress-bar progress-bar-` + color + `" style="width: ` + percentage + `%">
      <span class="sr-only">` + percentage + `% Complete (` + color + `)</span>
    </div>
    `;

  return $(html);
}

//Initialize progress bars
initProgressBars();

function setMarker(position) {
  let pomodoro_duration = configuration['pomodoro_duration'];
  let short_break_duration = configuration['short_break_duration'];
  let long_break_duration = configuration['long_break_duration'];
  let num_pomodoros = configuration['num_pomodoros'];

  //Compute the total time
  let totalTime = (pomodoro_duration + short_break_duration) * num_pomodoros + long_break_duration;

  let marker = $("#timelineMarker");
  marker.css("left", (position / totalTime * 100) + "%");
}