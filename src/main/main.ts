import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import fs from 'node:fs';
import xml2js from 'xml2js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}
const GPX_DIR = process.env.GPX_DIR ?? process.cwd();

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: false,
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
    //result[folder] = [];
    for (const file of files) {
      if (file.isDirectory()) {
        getGpxFilesFromFolder(path.join(folder, file.name), result)
      } else if (path.extname(file.name).toLowerCase() === '.gpx') {
        if (!result[folder]) {
          result[folder] = []
        }
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
  const calculateDistance = (start, end) => {
    const EARTH_RADIUS_IN_METERS = 6371000;
    const toRad = value => value * Math.PI / 180;

    const dLat = toRad(end.lat - start.lat);
    const dLon = toRad(end.lon - start.lon);
    const startLat = toRad(start.lat);
    const endLat = toRad(end.lat);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(startLat) * Math.cos(endLat);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_IN_METERS * c;
  };
  ipcMain.handle('getTrack', async (event, file) => {
    const xmlStr = fs.readFileSync(path.join(path.dirname(GPX_DIR), file), 'utf-8');
    const data = await xml2js.parseStringPromise(xmlStr).then(xml => {
      const waypoints = [];
      for (const trk of xml.gpx.trk) {
        if (typeof trk['trkseg'] === 'undefined') continue;
        for (const trkseg of trk['trkseg']) {
          const segment = [];
          for (const wp of trkseg['trkpt']) {
            const { lon, lat } = wp['$'];
            const elevation = parseFloat(wp['ele']?.[0] ?? 0);
            const time = new Date(wp['time']?.[0] ?? 0);
            segment.push({ lon, lat, elevation, time });
          }
          waypoints.push(segment);
        }
      }
      let distance = 0;
      let elevation = 0;
      for (const segment of waypoints) {
        for (let i = 0; i < segment.length - 1; i++) {
          const start = segment[i];
          const end = segment[i+1];
          distance += calculateDistance(start, end);
          if (end.elevation > start.elevation) {
            elevation += parseInt(end.elevation - start.elevation);
          }
        }
      }
      const lastSegment = waypoints[waypoints.length-1];
      const firstSegment = waypoints[0];
      const duration = lastSegment[lastSegment.length-1].time - firstSegment[0].time;
      const minutes = duration / 1000 / 60;
      const hours = parseInt(minutes / 60);
      const remainder = parseInt(minutes % 60);
      return {
        name: xml.gpx.metadata?.[0].name?.[0] ?? path.basename(file),
        points: waypoints.map(seg => seg.map(({ lon, lat }) => [ lon, lat ])),
        distance: `${(distance / 1000).toFixed(2)}km`,
        elevation: `${elevation}m`,
        duration: `${hours}h ${remainder}m`,
      }
    }); 
    return data; 
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
