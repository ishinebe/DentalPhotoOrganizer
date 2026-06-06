import { hasSupabaseConfig, supabase } from "./supabase";

export type LocalImageFile = {
  originalFilename: string;
  originalPath: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
  codeType: "qrcode" | null;
  codeText: string | null;
};

export type ImportPhotosResult = {
  status: "success" | "error" | "not-configured";
  targetCount: number;
  insertedCount: number;
  skippedCount: number;
  failedCount: number;
  message: string;
};

export async function importPhotoMetadata(files: LocalImageFile[]): Promise<ImportPhotosResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      targetCount: files.length,
      insertedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      message: "Supabase未設定のため取込を実行できません"
    };
  }

  let insertedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const file of files) {
    try {
      const { data: existingPhoto, error: selectError } = await supabase
        .from("photos")
        .select("id")
        .eq("file_hash", file.fileHash)
        .maybeSingle();

      if (selectError) {
        throw new Error(selectError.message);
      }

      if (existingPhoto) {
        skippedCount += 1;
        continue;
      }

      const { error: insertError } = await supabase.from("photos").insert({
        original_filename: file.originalFilename,
        original_path: file.originalPath,
        file_hash: file.fileHash,
        file_size: file.fileSize,
        mime_type: file.mimeType,
        code_type: file.codeType,
        code_text: file.codeText,
        imported_at: new Date().toISOString(),
        review_status: "pending",
        export_status: "not_exported"
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      insertedCount += 1;
    } catch {
      failedCount += 1;
    }
  }

  return {
    status: failedCount > 0 ? "error" : "success",
    targetCount: files.length,
    insertedCount,
    skippedCount,
    failedCount,
    message: failedCount > 0 ? "一部の画像メタデータ登録に失敗しました" : "画像メタデータの登録が完了しました"
  };
}
