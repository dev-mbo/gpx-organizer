import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
const gpxParse = require('gpx-parse');
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
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  /*ipcMain.handle('getGpx', (file) => { 
    const gpxDir = 'src/public/gpx';
    gpxParse.parseGpxFromFilepath.join(gpxDir, file), (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.tracks[0].name)
      }  
    });
  });*/
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
    //const tracks = fs.readdirSync(gpxDir);
    console.log(files);
    return files;
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
