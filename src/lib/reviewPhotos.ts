import { hasSupabaseConfig, supabase } from "./supabase";

export type ReviewPhoto = {
  id: string;
  original_filename: string;
  original_path: string | null;
  file_hash: string | null;
  file_size: number | null;
  mime_type: string | null;
  imported_at: string | null;
  review_status: "pending" | "reviewing" | "approved" | "rejected";
  export_status: "not_exported" | "ready_for_export" | "exported" | "export_failed";
  provisional_patient_id: string | null;
  doctor_name: string | null;
  photographer_name: string | null;
  notes: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
};

export type ReviewPhotoForm = {
  provisional_patient_id: string;
  doctor_name: string;
  photographer_name: string;
  notes: string;
};

export type ReviewPhotosResult = {
  status: "success" | "error" | "not-configured";
  photos: ReviewPhoto[];
  message: string;
};

export type ReviewPhotoMutationResult = {
  status: "success" | "error" | "not-configured";
  photo: ReviewPhoto | null;
  message: string;
};

const reviewPhotoColumns = [
  "id",
  "original_filename",
  "original_path",
  "file_hash",
  "file_size",
  "mime_type",
  "imported_at",
  "review_status",
  "export_status",
  "provisional_patient_id",
  "doctor_name",
  "photographer_name",
  "notes",
  "reviewed_at",
  "approved_at"
].join(",");

export async function fetchPendingReviewPhotos(): Promise<ReviewPhotosResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      photos: [],
      message: "Supabase未設定のためレビュー対象を取得できません"
    };
  }

  const { data, error } = await supabase
    .from("photos")
    .select(reviewPhotoColumns)
    .eq("review_status", "pending")
    .order("imported_at", { ascending: false })
    .limit(100);

  if (error) {
    return {
      status: "error",
      photos: [],
      message: error.message
    };
  }

  return {
    status: "success",
    photos: (data ?? []) as unknown as ReviewPhoto[],
    message: "レビュー待ち写真を取得しました"
  };
}

export async function updateReviewPhotoMetadata(
  photoId: string,
  form: ReviewPhotoForm
): Promise<ReviewPhotoMutationResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      photo: null,
      message: "Supabase未設定のため保存できません"
    };
  }

  const { data, error } = await supabase
    .from("photos")
    .update({
      provisional_patient_id: normalizeNullableText(form.provisional_patient_id),
      doctor_name: normalizeNullableText(form.doctor_name),
      photographer_name: normalizeNullableText(form.photographer_name),
      notes: normalizeNullableText(form.notes),
      reviewed_at: new Date().toISOString()
    })
    .eq("id", photoId)
    .select(reviewPhotoColumns)
    .single();

  if (error) {
    return {
      status: "error",
      photo: null,
      message: error.message
    };
  }

  return {
    status: "success",
    photo: data as unknown as ReviewPhoto,
    message: "メタデータを保存しました"
  };
}

export async function approveReviewPhoto(photoId: string): Promise<ReviewPhotoMutationResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      photo: null,
      message: "Supabase未設定のため承認できません"
    };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("photos")
    .update({
      review_status: "approved",
      export_status: "ready_for_export",
      reviewed_at: now,
      approved_at: now
    })
    .eq("id", photoId)
    .select(reviewPhotoColumns)
    .single();

  if (error) {
    return {
      status: "error",
      photo: null,
      message: error.message
    };
  }

  return {
    status: "success",
    photo: data as unknown as ReviewPhoto,
    message: "写真を承認しました"
  };
}

function normalizeNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
