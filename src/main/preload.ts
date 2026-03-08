const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('gpx', {
    getFiles: () => ipcRenderer.invoke('getFiles'),
    getTrack: (file) => ipcRenderer.invoke('getTrack', file),
});
