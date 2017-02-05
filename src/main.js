const {app, BrowserWindow, Menu, Tray, ipcMain} = require('electron')
// Module to control application life.
//const app = electron.app
// Module to create native browser window.
//const BrowserWindow = electron.BrowserWindow

const path = require('path')
const fs = require('fs')
const url = require('url')
const notifier = require('node-notifier');

const config = require('./modules/Configuration.js');


//States definition
const STATUS_WORKING = 1;
const STATUS_SHORT_BREAK = 2;
const STATUS_LONG_BREAK = 3;

//Notifications
const NOTIFY_NEW_POMODORO = 1;
const NOTIFY_SHORT_BREAK = 2;
const NOTIFY_LONG_BREAK = 3;
const NOTIFY_TIMER_PAUSED = 4;
const NOTIFY_CONTINUE_POMODORO = 5;
const NOTIFY_CONTINUE_BREAK = 6;

let lang = {};
lang[NOTIFY_NEW_POMODORO] = "Starting a new pomodoro!";
lang[NOTIFY_SHORT_BREAK] = "Time for a short break!";
lang[NOTIFY_LONG_BREAK] = "Time for a long break!";
lang[NOTIFY_TIMER_PAUSED] = "Timer paused";
lang[NOTIFY_CONTINUE_POMODORO] = "Continue working";
lang[NOTIFY_CONTINUE_BREAK] = "Continue the break";


//Handles the internal state of the timer
let state = {
  paused: false,
  pomodorosDone: 0,
  status: STATUS_WORKING,
  time_left: 0,                    //Time left in milliseconds
  status_changed: 0,          //Time in milliseconds when the last status change was performed
  timeout: null,
  ends_at: 0,                   //Time in which the time will change the state
  fullscreen_eop: true
};

//Get time
function getTime() {
  return new Date().getTime();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let eopWindow = null;
let forceQuit = false;

let assets = {
  icon: path.join(__dirname, '..', 'assets', 'icons', 'icon-red.png')
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: assets.icon
  });

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'windows/configuration/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  //Remove menu
  mainWindow.setMenu(null);
  mainWindow.focus(); //Bring to the front

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('close', function (event) {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    async_receiver = null;
  })
}

//Creates a full screen notification window for the end of the pomodoro
function createEOPwindow() {
  //Create the window
  eopWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: assets.icon,
    fullscreen: true,
  });

  // and load the index.html of the app.
  eopWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'windows/endofpomodoro/index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  //Remove menu
  eopWindow.setMenu(null);
  //Set always to the front
  eopWindow.setAlwaysOnTop(true);
  eopWindow.focus();
  ///eopWindow.webContents.openDevTools();

  //Handle to close event to know when closed
  eopWindow.on('close', function (event) {
    eopWindow = null; //Remove the pointer to the window
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//app.on('ready', createWindow)

// Quit when all windows are closed.
/*app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})*/

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});

app.on('will-quit', function (event) {
  if (!forceQuit) event.preventDefault();

  // This is a good place to add tests insuring the app is still
  // responsive and all windows are closed.
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

let tray = null
app.on('ready', () => {
  tray = new Tray(assets.icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Paused', type: 'checkbox', checked: false, click() { toggleInterval() } },
    { label: 'Fullscreen break', type: 'checkbox', checked: state.fullscreen_eop, click() { state.fullscreen_eop = !state.fullscreen_eop } },
    { label: 'Exit', click() { forceQuit = true; app.quit(); } },
  ]);
  tray.setToolTip('This is my application.')
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow == null) createWindow();
    else mainWindow.close();
  });

  //createWindow();
})

ipcMain.on('state', function (event, data) {
  event.returnValue = {
    time_left: state.time_left,
    ends_at: state.ends_at,
    status_changed: state.status_changed,
    paused: state.paused
  };
});

ipcMain.on('configuration-sync', function (event, data) {
  event.returnValue = config.map();
})

let async_receiver = null;

ipcMain.on('timeleft-async', function (event, data) {
  async_receiver = event.sender;
  event.sender.send('timeleft-async-reply', formatTime(state.time_left));
});

ipcMain.on('apply-config-async', function (event, data) {
  for (let key in data) {
    config.set(key, data[key]);
  }
  config.save();
  initStates();
});

function toggleInterval() {
  if (state.timeout == null) {
    startTimeout();
    if (state.status == STATUS_WORKING) createNotification(NOTIFY_CONTINUE_POMODORO);
    else createNotification(NOTIFY_CONTINUE_BREAK);
  }
  else {
    clearTimeout(state.timeout);
    state.paused = true;
    state.timeout = null;
    createNotification(NOTIFY_TIMER_PAUSED);
    state.time_left -= getTime() - state.status_changed;
  }
}

function startTimeout() {
  state.status_changed = getTime();
  if (state.timeout == null) {
    state.timeout = setTimeout(timerEnded, state.time_left);
    state.paused = false;
  }
}

function createNotification(notificationCode) {
  notifier.notify({
    title: 'Pomotron',
    message: lang[notificationCode],
    icon: assets.icon
  });
}


function startPomodoro() {
  state.time_left = config.get("pomodoro_duration") * 1000;
  state.ends_at += state.time_left;
  state.status = STATUS_WORKING;
  startTimeout();
  if (eopWindow != null) eopWindow.close(); //Close EOP window if open
  createNotification(NOTIFY_NEW_POMODORO);
}

function startShortBreak() {
  state.time_left = config.get("short_break_duration") * 1000;
  state.ends_at += state.time_left;
  state.status = STATUS_SHORT_BREAK;
  startTimeout();
  createNotification(NOTIFY_SHORT_BREAK);
  if (state.fullscreen_eop) createEOPwindow();
}

function startLongBreak() {
  state.time_left = config.get("long_break_duration") * 1000;
  state.ends_at += state.time_left;
  state.status = STATUS_LONG_BREAK;
  startTimeout();
  createNotification(NOTIFY_LONG_BREAK);
  if (state.fullscreen_eop) createEOPwindow();
}

function initStates() {
  state.paused = false;
  state.pomodorosDone = 0;
  state.status = STATUS_WORKING;
  state.ends_at = 0;
  clearTimeout(state.timeout);
  startPomodoro();
}

function timerEnded() {
  clearTimeout(state.timeout);
  state.timeout = null;
  switch (state.status) {
    case STATUS_WORKING:
      state.pomodorosDone += 1;
      if (state.pomodorosDone == config.get("num_pomodoros")) startLongBreak();
      else startShortBreak();
      break;
    case STATUS_SHORT_BREAK:
      startPomodoro();
      break;
    case STATUS_LONG_BREAK:
      initStates();
      break;
  }
}

initStates();