import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
const gpxParser = require('gpxparser');
const fs = require('node:fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

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
  const calculateDistance = (segments) => {
    // each segment is a waypoint containing data for latitude, longitude, elevation and time 
    const toRad = (value) => value * Math.PI / 180;
    const getDistance = (start, end) => {
      const dLat = toRad(end.lat - start.lat); 
      const dLon = toRad(end.lon - start.lon); 
      const startLat = toRad(start.lat);
      const endLat = toRad(end.lat);

      const a = Math.sin(dLat/2) ** 2 + Math.sin(dLon/2) ** 2 * Math.cos(startLat) * Math.cos(endLat);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return 6371000 * c; 
    };
    const distances = segments.map((curr, idx, arr) => {
      if (idx == (arr.length - 1)) return 0;
      return getDistance(curr, arr[idx+1]);
    });
    const total = distances.reduce((acc, distance) => acc + distance);
    return (total / 1000).toFixed(2);
  };
  const calculateElevation = (segments) => {
    const all = segments.map(waypoint => waypoint.time);
    console.log(all); 
  };
  const calculateDuration = (segments) => {
  };
  
  const getGpxFilesFromFolder = (folder = '') => {
    const files = fs.readdirSync(path.join('src/public', folder), { withFileTypes: true });
    let result = {};
    result[folder] = [];
    for (const file of files) {
      if (file.isDirectory()) {
        result = {
          ...result, 
          ...getGpxFilesFromFolder(path.join(folder, file.name))
        };
      } else {
        result[folder].push(file.name);
      }
    }
    return result;
  };
  ipcMain.handle('getFiles', () => {
    const files = getGpxFilesFromFolder('gpx');
    return files;
  });
  ipcMain.handle('getMetadata', (event, file) => {
    const gpx = new gpxParser();
    const data = fs.readFileSync(path.join('src/public', file));
    gpx.parse(data);
    const track = gpx.tracks[0];
    if (!track) return false; 
    const waypoints = track.points;
    const duration = waypoints[waypoints.length-1].time - waypoints[0].time;
    const minutes = duration / 1000 / 60;
    const hours = parseInt(minutes / 60);
    const remainder = parseInt(minutes % 60);
    return {
      name: track.name,
      distance: `${(track.distance.total / 1000).toFixed(2)} km`,
      elevation: `${track.elevation.pos.toFixed(2)} m`,
      duration: `${hours}h ${remainder}m`,
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
