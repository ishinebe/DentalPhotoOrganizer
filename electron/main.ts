import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jpeg from "jpeg-js";
import jsQrModule from "jsqr";
import { PNG } from "pngjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== "production" && !app.isPackaged;
const preloadPath = path.join(__dirname, "preload.js");
console.log("PRELOAD PATH", preloadPath, "exists:", existsSync(preloadPath));
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
  codeType: "qrcode" | null;
  codeText: string | null;
};

type ImageCodeDetection = {
  codeType: "qrcode" | null;
  codeText: string | null;
};

type ExportPhotoPayload = {
  photoId: string;
  originalPath: string | null;
  originalFilename: string;
  exportFilename: string;
};

type ExportGroupPayload = {
  groupId: string;
  patientId: string | null;
  shootingDate: string | null;
  photos: ExportPhotoPayload[];
};

type ExportPhotoFilesPayload = {
  exportRootPath: string;
  groups: ExportGroupPayload[];
};

type ExportFailure = {
  groupId: string;
  photoId: string;
  originalFilename: string;
  message: string;
};

type QrDecoder = (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;

const decodeQrCode =
  (jsQrModule as unknown as { default?: QrDecoder }).default ?? (jsQrModule as unknown as QrDecoder);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1120,
    minHeight: 720,
    title: "DentalPhotoOrganizer",
    backgroundColor: "#f5f7fb",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.openDevTools();

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
  ipcMain.handle("select-image-folder", async () => {
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

  ipcMain.handle("load-image-preview", async (_event, filePath: string) => {
    if (!filePath || typeof filePath !== "string") {
      return {
        status: "error",
        dataUrl: null,
        message: "original_path が空です"
      };
    }

    const extension = path.extname(filePath).toLowerCase();
    const mimeType = imageMimeTypes.get(extension);

    if (!mimeType) {
      return {
        status: "unsupported",
        dataUrl: null,
        message: "jpg / jpeg / png のみプレビューできます"
      };
    }

    if (!existsSync(filePath)) {
      return {
        status: "error",
        dataUrl: null,
        message: "画像ファイルが見つかりません"
      };
    }

    try {
      const imageBuffer = await readFile(filePath);

      return {
        status: "success",
        dataUrl: `data:${mimeType};base64,${imageBuffer.toString("base64")}`,
        message: "画像プレビューを読み込みました"
      };
    } catch {
      return {
        status: "error",
        dataUrl: null,
        message: "画像ファイルの読み込みに失敗しました"
      };
    }
  });

  ipcMain.handle("select-export-folder", async () => {
    const result = await dialog.showOpenDialog({
      title: "エクスポート先フォルダを選択",
      properties: ["openDirectory", "createDirectory"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return {
        canceled: true,
        folderPath: null
      };
    }

    return {
      canceled: false,
      folderPath: result.filePaths[0]
    };
  });

  ipcMain.handle("open-official-export-folder", async (_event, folderPath: string) => {
    if (!folderPath || typeof folderPath !== "string") {
      return {
        status: "error",
        message: "正式書き出し先フォルダを開けませんでした。フォルダが移動または削除された可能性があります。"
      };
    }

    if (!existsSync(folderPath)) {
      return {
        status: "error",
        message: "正式書き出し先フォルダを開けませんでした。フォルダが移動または削除された可能性があります。"
      };
    }

    try {
      const folderStat = await stat(folderPath);
      if (!folderStat.isDirectory()) {
        return {
          status: "error",
          message: "正式書き出し先フォルダを開けませんでした。フォルダが移動または削除された可能性があります。"
        };
      }

      const openError = await shell.openPath(folderPath);
      if (openError) {
        return {
          status: "error",
          message: "正式書き出し先フォルダを開けませんでした。フォルダが移動または削除された可能性があります。"
        };
      }

      return {
        status: "success",
        message: "正式書き出し先フォルダを開きました"
      };
    } catch {
      return {
        status: "error",
        message: "正式書き出し先フォルダを開けませんでした。フォルダが移動または削除された可能性があります。"
      };
    }
  });

  ipcMain.handle("export-photo-files", async (_event, payload: ExportPhotoFilesPayload) => {
    if (!isValidExportPayload(payload)) {
      return {
        status: "error",
        successGroupIds: [],
        failedGroupIds: [],
        successPhotoCount: 0,
        failedPhotoCount: 0,
        failures: [
          {
            groupId: "",
            photoId: "",
            originalFilename: "",
            message: "エクスポート要求の形式が不正です"
          }
        ]
      };
    }

    const successGroupIds: string[] = [];
    const failedGroupIds: string[] = [];
    const failures: ExportFailure[] = [];
    let successPhotoCount = 0;
    let failedPhotoCount = 0;

    for (const group of payload.groups) {
      let groupHasFailure = false;
      const shootingDate = sanitizePathSegment(group.shootingDate || "date-unknown");
      const patientId = sanitizePathSegment(group.patientId || "patient-unknown");
      const destinationFolder = path.join(payload.exportRootPath, shootingDate, patientId);

      if (group.photos.length === 0) {
        failedGroupIds.push(group.groupId);
        failures.push({
          groupId: group.groupId,
          photoId: "",
          originalFilename: "",
          message: "撮影セットに写真がありません"
        });
        continue;
      }

      try {
        await mkdir(destinationFolder, { recursive: true });
      } catch (error) {
        groupHasFailure = true;
        failedGroupIds.push(group.groupId);
        failedPhotoCount += group.photos.length;
        failures.push({
          groupId: group.groupId,
          photoId: "",
          originalFilename: "",
          message: `出力先フォルダを作成できません: ${getErrorMessage(error)}`
        });
        continue;
      }

      for (const photo of group.photos) {
        if (!photo.originalPath || !existsSync(photo.originalPath)) {
          groupHasFailure = true;
          failedPhotoCount += 1;
          failures.push({
            groupId: group.groupId,
            photoId: photo.photoId,
            originalFilename: photo.originalFilename,
            message: "コピー元ファイルが見つかりません"
          });
          continue;
        }

        try {
          const destinationPath = await resolveUniqueDestinationPath(destinationFolder, photo.exportFilename);
          await copyFile(photo.originalPath, destinationPath);
          successPhotoCount += 1;
        } catch (error) {
          groupHasFailure = true;
          failedPhotoCount += 1;
          failures.push({
            groupId: group.groupId,
            photoId: photo.photoId,
            originalFilename: photo.originalFilename,
            message: getErrorMessage(error)
          });
        }
      }

      if (groupHasFailure) {
        failedGroupIds.push(group.groupId);
      } else {
        successGroupIds.push(group.groupId);
      }
    }

    return {
      status: failures.length > 0 ? "partial" : "success",
      successGroupIds,
      failedGroupIds: [...new Set(failedGroupIds)],
      successPhotoCount,
      failedPhotoCount,
      failures
    };
  });
}

function isValidExportPayload(payload: ExportPhotoFilesPayload | null | undefined): payload is ExportPhotoFilesPayload {
  return Boolean(
    payload &&
      typeof payload.exportRootPath === "string" &&
      payload.exportRootPath.length > 0 &&
      Array.isArray(payload.groups)
  );
}

function sanitizePathSegment(value: string) {
  const sanitized = value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim();
  return sanitized.length > 0 ? sanitized : "unknown";
}

async function resolveUniqueDestinationPath(destinationFolder: string, exportFilename: string) {
  const parsed = path.parse(sanitizeExportFilename(exportFilename));
  let candidate = path.join(destinationFolder, `${parsed.name}${parsed.ext}`);
  let index = 1;

  while (existsSync(candidate)) {
    candidate = path.join(destinationFolder, `${parsed.name}_${index}${parsed.ext}`);
    index += 1;
  }

  return candidate;
}

function sanitizeExportFilename(filename: string) {
  const parsed = path.parse(filename);
  const safeName = sanitizePathSegment(parsed.name || "photo");
  const safeExt = parsed.ext.replace(/[^a-zA-Z0-9.]/g, "").toLowerCase();
  return `${safeName}${safeExt || ".jpg"}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "コピーに失敗しました";
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
        fileHash: await calculateSha256(originalPath),
        ...(await detectImageCode(originalPath))
      };
    })
  );

  return files.sort((a, b) => a.originalFilename.localeCompare(b.originalFilename));
}

async function detectImageCode(filePath: string): Promise<ImageCodeDetection> {
  const extension = path.extname(filePath).toLowerCase();

  if (!imageMimeTypes.has(extension)) {
    return {
      codeType: null,
      codeText: null
    };
  }

  try {
    const imageBuffer = await readFile(filePath);
    const imageData = decodeImageForQr(imageBuffer, extension);

    if (!imageData) {
      return {
        codeType: null,
        codeText: null
      };
    }

    const qr = decodeQrCode(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);

    return qr
      ? {
          codeType: "qrcode",
          codeText: qr.data
        }
      : {
          codeType: null,
          codeText: null
        };
  } catch (error) {
    console.warn("QR code detection failed", filePath, error);
    return {
      codeType: null,
      codeText: null
    };
  }
}

function decodeImageForQr(imageBuffer: Buffer, extension: string) {
  if (extension === ".png") {
    const png = PNG.sync.read(imageBuffer);
    return {
      width: png.width,
      height: png.height,
      data: png.data
    };
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    const decoded = jpeg.decode(imageBuffer, { useTArray: true });
    return {
      width: decoded.width,
      height: decoded.height,
      data: decoded.data
    };
  }

  return null;
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
