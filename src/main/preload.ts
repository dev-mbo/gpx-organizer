const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('gpx', {
    getFiles: () => ipcRenderer.invoke('getFiles'),
    getMetadata: (file) => ipcRenderer.invoke('getMetadata', file),
});
