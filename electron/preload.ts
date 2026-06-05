import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("dentalPhotoOrganizer", {
  appName: "DentalPhotoOrganizer"
});
