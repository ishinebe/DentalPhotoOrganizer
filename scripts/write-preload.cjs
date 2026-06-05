const fs = require("node:fs");
const path = require("node:path");

const preloadPath = path.resolve(__dirname, "../dist-electron/preload.js");

const preloadSource = `const { contextBridge, ipcRenderer } = require("electron");

console.log("PRELOAD LOADED");

contextBridge.exposeInMainWorld("electronAPI", {
  selectImageFolder: () => ipcRenderer.invoke("select-image-folder")
});
`;

fs.mkdirSync(path.dirname(preloadPath), { recursive: true });
fs.writeFileSync(preloadPath, preloadSource);
