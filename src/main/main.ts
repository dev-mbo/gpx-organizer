import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
const gpxParser = require('gpxparser');
const fs = require('node:fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}
const GPX_DIR = process.env.GPX_DIR ?? 'src/public/gpx';

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  const getGpxFilesFromFolder = (folder = '', result) => {
    const files = fs.readdirSync(path.join(path.dirname(GPX_DIR), folder), { withFileTypes: true });
    result[folder] = [];
    for (const file of files) {
      if (file.isDirectory()) {
        getGpxFilesFromFolder(path.join(folder, file.name), result)
      } else {
        result[folder].push(file.name);
      }
    }
    return result;
  };
  ipcMain.handle('getFiles', () => {
    const files = { gpxDir: GPX_DIR, 'list': {}};
    getGpxFilesFromFolder(path.basename(GPX_DIR), files.list);
    console.log("found gpx files:");
    console.dir(files);
    return files;
  });
  ipcMain.handle('getTrack', (event, file) => {
    const gpx = new gpxParser();
    const data = fs.readFileSync(path.join(path.dirname(GPX_DIR), file));
    gpx.parse(data);
    let waypoints = [];
    gpx.tracks.forEach(track => {
      waypoints = [...waypoints, ...track.points];
    });
    const distance = gpx.tracks.reduce((acc, curr) => acc += curr.distance.total, 0);
    const elevation = gpx.tracks.reduce((acc, curr) => acc += curr.elevation.pos, 0);
    if (!waypoints) return false;
    const duration = waypoints[waypoints.length-1].time - waypoints[0].time;
    const minutes = duration / 1000 / 60;
    const hours = parseInt(minutes / 60);
    const remainder = parseInt(minutes % 60);
    return {
      name: gpx.metadata.name ?? path.basename(file),
      distance: `${(distance / 1000).toFixed(2)} km`,
      elevation: `${elevation.toFixed(2)} m`,
      duration: `${hours}h ${remainder}m`,
      points: waypoints.map(({lon, lat}) => [lon, lat]),
    }
  });
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
