const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('gpx', {
    getFiles: () => ipcRenderer.invoke('getFiles'),
    /*getGpx: () => ipcRenderer.invoce('getGpx'),*/
});
