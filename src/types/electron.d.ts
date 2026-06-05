import type { LocalImageFile } from "../lib/importPhotos";

export type ImageFolderSelectionResult = {
  canceled: boolean;
  folderPath: string | null;
  files: LocalImageFile[];
};

declare global {
  interface Window {
    dentalPhotoOrganizer?: {
      appName: string;
      selectImageFolder: () => Promise<ImageFolderSelectionResult>;
    };
  }
}
