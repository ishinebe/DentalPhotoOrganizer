import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== "production" && !app.isPackaged;
const imageMimeTypes = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"]
]);

type LocalImageFile = {
  originalFilename: string;
  originalPath: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
};

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1120,
    minHeight: 720,
    title: "DentalPhotoOrganizer",
    backgroundColor: "#f5f7fb",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    void mainWindow.loadURL("http://localhost:5173");
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

void app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

function registerIpcHandlers() {
  ipcMain.handle("dialog:select-image-folder", async () => {
    const result = await dialog.showOpenDialog({
      title: "画像フォルダを選択",
      properties: ["openDirectory"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return {
        canceled: true,
        folderPath: null,
        files: []
      };
    }

    const folderPath = result.filePaths[0];
    const files = await collectImageFiles(folderPath);

    return {
      canceled: false,
      folderPath,
      files
    };
  });
}

async function collectImageFiles(folderPath: string): Promise<LocalImageFile[]> {
  const entries = await readdir(folderPath, { withFileTypes: true });
  const imageFiles = entries.filter((entry) => {
    if (!entry.isFile()) {
      return false;
    }

    return imageMimeTypes.has(path.extname(entry.name).toLowerCase());
  });

  const files = await Promise.all(
    imageFiles.map(async (entry) => {
      const originalPath = path.join(folderPath, entry.name);
      const fileStat = await stat(originalPath);
      const extension = path.extname(entry.name).toLowerCase();

      return {
        originalFilename: entry.name,
        originalPath,
        fileSize: fileStat.size,
        mimeType: imageMimeTypes.get(extension) ?? "application/octet-stream",
        fileHash: await calculateSha256(originalPath)
      };
    })
  );

  return files.sort((a, b) => a.originalFilename.localeCompare(b.originalFilename));
}

function calculateSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
