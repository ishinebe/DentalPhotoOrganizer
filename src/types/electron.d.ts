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

declare global {
  interface Window {
    electronAPI?: {
      selectImageFolder: () => Promise<ImageFolderSelectionResult>;
      loadImagePreview: (filePath: string) => Promise<ImagePreviewResult>;
    };
  }
}
