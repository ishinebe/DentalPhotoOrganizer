import { hasSupabaseConfig, supabase } from "./supabase";

export type ReviewGroup = {
  id: string;
  import_batch_id: string | null;
  patient_id: string | null;
  shooting_date: string | null;
  doctor_id: string | null;
  photographer_id: string | null;
  confidence_score: number | null;
  needs_review: boolean | null;
  review_status: "pending" | "reviewing" | "approved" | "rejected";
  export_status: "not_exported" | "ready_for_export" | "exported" | "export_failed";
  reviewer_id: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  created_at: string | null;
  patient_uuid: string | null;
  photo_count: number;
};

export type ReviewGroupPhoto = {
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
  sort_order: number | null;
};

export type ReviewGroupForm = {
  patient_id: string;
  shooting_date: string;
  doctor_id: string;
  photographer_id: string;
};

export type ReviewGroupsResult = {
  status: "success" | "error" | "not-configured";
  groups: ReviewGroup[];
  message: string;
};

export type ReviewGroupPhotosResult = {
  status: "success" | "error" | "not-configured";
  photos: ReviewGroupPhoto[];
  message: string;
};

export type ReviewGroupMutationResult = {
  status: "success" | "error" | "not-configured";
  group: ReviewGroup | null;
  message: string;
};

const groupColumns = [
  "id",
  "import_batch_id",
  "patient_id",
  "shooting_date",
  "doctor_id",
  "photographer_id",
  "confidence_score",
  "needs_review",
  "review_status",
  "export_status",
  "reviewer_id",
  "reviewed_at",
  "approved_at",
  "created_at",
  "patient_uuid"
].join(",");

const photoColumns = [
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

type GroupRow = Omit<ReviewGroup, "photo_count">;
type PhotoRow = Omit<ReviewGroupPhoto, "sort_order">;
type GroupItemRow = {
  photo_id: string;
  photo_group_id: string;
  sort_order: number | null;
};

export async function fetchPendingReviewGroups(): Promise<ReviewGroupsResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      groups: [],
      message: "Supabase未設定のためレビューグループを取得できません"
    };
  }

  const ensureResult = await ensurePendingPhotosHaveGroups();
  if (ensureResult.status === "error") {
    return {
      status: "error",
      groups: [],
      message: ensureResult.message
    };
  }

  const { data, error } = await supabase
    .from("photo_groups")
    .select(groupColumns)
    .eq("review_status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return {
      status: "error",
      groups: [],
      message: error.message
    };
  }

  const groups = (data ?? []) as unknown as GroupRow[];
  const counts = await fetchGroupPhotoCounts(groups.map((group) => group.id));

  return {
    status: "success",
    groups: groups.map((group) => ({
      ...group,
      photo_count: counts.get(group.id) ?? 0
    })),
    message: "レビュー待ちグループを取得しました"
  };
}

export async function fetchReviewGroupPhotos(groupId: string): Promise<ReviewGroupPhotosResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      photos: [],
      message: "Supabase未設定のためグループ内写真を取得できません"
    };
  }

  const { data: itemData, error: itemError } = await supabase
    .from("photo_group_items")
    .select("photo_id,photo_group_id,sort_order")
    .eq("photo_group_id", groupId)
    .order("sort_order", { ascending: true });

  if (itemError) {
    return {
      status: "error",
      photos: [],
      message: itemError.message
    };
  }

  const items = (itemData ?? []) as unknown as GroupItemRow[];
  const photoIds = items.map((item) => item.photo_id);

  if (photoIds.length === 0) {
    return {
      status: "success",
      photos: [],
      message: "このグループには写真がありません"
    };
  }

  const { data: photoData, error: photoError } = await supabase
    .from("photos")
    .select(photoColumns)
    .in("id", photoIds);

  if (photoError) {
    return {
      status: "error",
      photos: [],
      message: photoError.message
    };
  }

  const photoById = new Map(((photoData ?? []) as unknown as PhotoRow[]).map((photo) => [photo.id, photo]));
  const photos = items
    .map((item) => {
      const photo = photoById.get(item.photo_id);
      return photo ? { ...photo, sort_order: item.sort_order } : null;
    })
    .filter((photo): photo is ReviewGroupPhoto => Boolean(photo));

  return {
    status: "success",
    photos,
    message: "グループ内写真を取得しました"
  };
}

export async function updateReviewGroupMetadata(
  groupId: string,
  form: ReviewGroupForm
): Promise<ReviewGroupMutationResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      group: null,
      message: "Supabase未設定のためレビュー内容を保存できません"
    };
  }

  const now = new Date().toISOString();
  const updatePayload = {
    patient_id: normalizeNullableText(form.patient_id),
    shooting_date: normalizeNullableText(form.shooting_date),
    doctor_id: normalizeNullableText(form.doctor_id),
    photographer_id: normalizeNullableText(form.photographer_id),
    reviewed_at: now
  };

  const { data, error } = await supabase
    .from("photo_groups")
    .update(updatePayload)
    .eq("id", groupId)
    .select(groupColumns)
    .single();

  if (error) {
    return {
      status: "error",
      group: null,
      message: error.message
    };
  }

  const photoIds = await fetchPhotoIdsForGroup(groupId);

  return {
    status: "success",
    group: {
      ...((data as unknown as GroupRow) ?? {}),
      photo_count: photoIds.ids.length
    },
    message: "レビュー内容を保存しました"
  };
}

export async function completeReviewGroup(groupId: string): Promise<ReviewGroupMutationResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      group: null,
      message: "Supabase未設定のためレビュー完了にできません"
    };
  }

  const now = new Date().toISOString();
  const completionPayload = {
    review_status: "approved",
    export_status: "ready_for_export",
    reviewed_at: now,
    approved_at: now
  };

  const { data, error } = await supabase
    .from("photo_groups")
    .update(completionPayload)
    .eq("id", groupId)
    .select(groupColumns)
    .single();

  if (error) {
    return {
      status: "error",
      group: null,
      message: error.message
    };
  }

  const photoIds = await fetchPhotoIdsForGroup(groupId);
  if (photoIds.status === "error") {
    return {
      status: "error",
      group: null,
      message: photoIds.message
    };
  }

  if (photoIds.ids.length > 0) {
    const { error: photoError } = await supabase.from("photos").update(completionPayload).in("id", photoIds.ids);

    if (photoError) {
      return {
        status: "error",
        group: null,
        message: photoError.message
      };
    }
  }

  return {
    status: "success",
    group: {
      ...((data as unknown as GroupRow) ?? {}),
      photo_count: photoIds.ids.length
    },
    message: "レビュー完了にしました"
  };
}

async function ensurePendingPhotosHaveGroups() {
  if (!supabase) {
    return {
      status: "not-configured" as const,
      message: "Supabase未設定です"
    };
  }

  const { data: photoData, error: photoError } = await supabase
    .from("photos")
    .select(photoColumns)
    .eq("review_status", "pending")
    .order("imported_at", { ascending: false })
    .limit(300);

  if (photoError) {
    return {
      status: "error" as const,
      message: photoError.message
    };
  }

  const photos = (photoData ?? []) as unknown as PhotoRow[];
  if (photos.length === 0) {
    return {
      status: "success" as const,
      message: "未所属写真はありません"
    };
  }

  const { data: itemData, error: itemError } = await supabase
    .from("photo_group_items")
    .select("photo_id,photo_group_id,sort_order")
    .in(
      "photo_id",
      photos.map((photo) => photo.id)
    );

  if (itemError) {
    return {
      status: "error" as const,
      message: itemError.message
    };
  }

  const groupedPhotoIds = new Set(((itemData ?? []) as unknown as GroupItemRow[]).map((item) => item.photo_id));
  const ungroupedPhotos = photos.filter((photo) => !groupedPhotoIds.has(photo.id));

  for (const photo of ungroupedPhotos) {
    const { data: groupData, error: groupError } = await supabase
      .from("photo_groups")
      .insert({
        patient_id: photo.provisional_patient_id,
        review_status: "pending",
        export_status: "not_exported"
      })
      .select("id")
      .single();

    if (groupError) {
      return {
        status: "error" as const,
        message: groupError.message
      };
    }

    const groupId = (groupData as { id: string }).id;
    const { error: itemInsertError } = await supabase.from("photo_group_items").insert({
      photo_id: photo.id,
      photo_group_id: groupId,
      sort_order: 1
    });

    if (itemInsertError) {
      return {
        status: "error" as const,
        message: itemInsertError.message
      };
    }
  }

  return {
    status: "success" as const,
    message: "未所属写真を暫定グループ化しました"
  };
}

async function fetchGroupPhotoCounts(groupIds: string[]) {
  const counts = new Map<string, number>();

  if (!supabase || groupIds.length === 0) {
    return counts;
  }

  const { data, error } = await supabase
    .from("photo_group_items")
    .select("photo_id,photo_group_id,sort_order")
    .in("photo_group_id", groupIds);

  if (error) {
    return counts;
  }

  for (const item of (data ?? []) as unknown as GroupItemRow[]) {
    counts.set(item.photo_group_id, (counts.get(item.photo_group_id) ?? 0) + 1);
  }

  return counts;
}

async function fetchPhotoIdsForGroup(groupId: string) {
  if (!supabase) {
    return {
      status: "not-configured" as const,
      ids: [],
      message: "Supabase未設定です"
    };
  }

  const { data, error } = await supabase.from("photo_group_items").select("photo_id").eq("photo_group_id", groupId);

  if (error) {
    return {
      status: "error" as const,
      ids: [],
      message: error.message
    };
  }

  return {
    status: "success" as const,
    ids: ((data ?? []) as unknown as Array<{ photo_id: string }>).map((item) => item.photo_id),
    message: "グループ内写真IDを取得しました"
  };
}

function normalizeNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
