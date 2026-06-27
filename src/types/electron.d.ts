import type { LocalImageFile } from "../lib/importPhotos";

export type ImageFolderSelectionResult = {
  canceled: boolean;
  folderPath: string | null;
  files: LocalImageFile[];
};

export type ImagePreviewResult = {
  status: "success" | "error" | "unsupported";
  dataUrl: string | null;
  message: string;
};

export type ExportFolderSelectionResult = {
  canceled: boolean;
  folderPath: string | null;
};

export type OpenOfficialExportFolderResult = {
  status: "success" | "error";
  message: string;
};

export type ExportPhotoFilePayload = {
  photoId: string;
  originalPath: string | null;
  originalFilename: string;
  exportFilename: string;
};

export type ExportPhotoGroupPayload = {
  groupId: string;
  patientId: string | null;
  shootingDate: string | null;
  photos: ExportPhotoFilePayload[];
};

export type ExportPhotoFilesPayload = {
  exportRootPath: string;
  groups: ExportPhotoGroupPayload[];
};

export type ExportPhotoFileFailure = {
  groupId: string;
  photoId: string;
  originalFilename: string;
  message: string;
};

export type ExportPhotoFilesResult = {
  status: "success" | "partial" | "error";
  successGroupIds: string[];
  failedGroupIds: string[];
  successPhotoCount: number;
  failedPhotoCount: number;
  failures: ExportPhotoFileFailure[];
};

declare global {
  interface Window {
    electronAPI?: {
      selectImageFolder: () => Promise<ImageFolderSelectionResult>;
      loadImagePreview: (filePath: string) => Promise<ImagePreviewResult>;
      selectExportFolder: () => Promise<ExportFolderSelectionResult>;
      openOfficialExportFolder: (folderPath: string) => Promise<OpenOfficialExportFolderResult>;
      exportPhotoFiles: (payload: ExportPhotoFilesPayload) => Promise<ExportPhotoFilesResult>;
    };
  }
}
