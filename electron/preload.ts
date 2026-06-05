const { contextBridge, ipcRenderer } = require("electron");

console.log("PRELOAD LOADED");

contextBridge.exposeInMainWorld("electronAPI", {
  selectImageFolder: () => ipcRenderer.invoke("select-image-folder")
});
