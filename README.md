![Pomotron Logo](./assets/icons/icon-red.png)
# Pomotron
Pomotron is a timer for using the [Pomodor Technique](https://en.wikipedia.org/wiki/Pomodoro_Technique) on Windows, Mac OS X and Linux.
It is implemented using [Electron](http://electron.atom.io/).

## Running Pomotron

### Install dependencies

Execute `npm install`.

### Run the code

Execute `npm start`.

### Packaging
 
Pomotron is multiplatform. The distributable platform specific packages can be generated using the following commands:
- For **Windows** run: `npm run package-win`
- For **Linux** run: `npm run package-linux`
- For **Mac**  run: `npm run package-mac`

## Features

- Customize `working`/`short break`/`long break` durations.
- Visualize the time distribution easily.
- Know at any moment where are you in the current pomodoro.
- Fullscreen notification at the of the pomodoro so you won't miss any break again.
- Autostart when usre logs in.

### Screenshots
![Pomotron screenshot](./documentation/pomotron-screenshot.png)

## Why Pomotron?

I recently upgraded my operating system. I am currently using Ubuntu Mate 16.04 64-bits. Before I was using an excellent pomodoro timer [gnome-pomodoro](http://gnomepomodoro.org/) but it was no longer compatible with my desktop. I looked for many options freely available online and none of them convinced me, so I implemented one cross-platform solution.

#### License [Apache 2.0](LICENSE).
