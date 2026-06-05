import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  selectImageFolder: () => ipcRenderer.invoke("select-image-folder")
});
