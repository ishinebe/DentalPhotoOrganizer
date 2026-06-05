import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("dentalPhotoOrganizer", {
  appName: "DentalPhotoOrganizer",
  selectImageFolder: () => ipcRenderer.invoke("dialog:select-image-folder")
});
