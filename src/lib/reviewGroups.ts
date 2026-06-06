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
  code_type: string | null;
  code_text: string | null;
  imported_at: string | null;
  review_status: "pending" | "reviewing" | "approved" | "rejected";
  export_status: "not_exported" | "ready_for_export" | "exported" | "export_failed";
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

export type ReviewGroupEditResult = {
  status: "success" | "error" | "not-configured";
  groupId: string | null;
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
  "code_type",
  "code_text",
  "imported_at",
  "review_status",
  "export_status",
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

let pendingEnsureGroupsPromise: Promise<EnsureGroupsResult> | null = null;

type EnsureGroupsResult = {
  status: "success" | "error" | "not-configured";
  message: string;
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
  const memberships = await fetchGroupPhotoMemberships(groups.map((group) => group.id));
  const visibleGroupIds = selectFirstGroupPerPhoto(groups, memberships.items);

  return {
    status: "success",
    groups: groups
      .filter((group) => visibleGroupIds.has(group.id) && (memberships.counts.get(group.id) ?? 0) > 0)
      .map((group) => ({
        ...group,
        photo_count: memberships.counts.get(group.id) ?? 0
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

  const items = dedupeGroupItemsByPhoto((itemData ?? []) as unknown as GroupItemRow[]);
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

async function ensurePendingPhotosHaveGroups(): Promise<EnsureGroupsResult> {
  if (!pendingEnsureGroupsPromise) {
    pendingEnsureGroupsPromise = ensurePendingPhotosHaveGroupsInternal().finally(() => {
      pendingEnsureGroupsPromise = null;
    });
  }

  return pendingEnsureGroupsPromise;
}

async function ensurePendingPhotosHaveGroupsInternal(): Promise<EnsureGroupsResult> {
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
    const existingItem = await fetchFirstGroupItemForPhoto(photo.id);
    if (existingItem.status === "error") {
      return {
        status: "error" as const,
        message: existingItem.message
      };
    }

    if (existingItem.item) {
      groupedPhotoIds.add(photo.id);
      continue;
    }

    const { data: groupData, error: groupError } = await supabase
      .from("photo_groups")
      .insert({
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
    const postGroupExistingItem = await fetchFirstGroupItemForPhoto(photo.id);
    if (postGroupExistingItem.status === "error") {
      await deleteNewlyCreatedGroup(groupId);
      return {
        status: "error" as const,
        message: postGroupExistingItem.message
      };
    }

    if (postGroupExistingItem.item) {
      await deleteNewlyCreatedGroup(groupId);
      groupedPhotoIds.add(photo.id);
      continue;
    }

    const { error: itemInsertError } = await supabase.from("photo_group_items").insert({
      photo_id: photo.id,
      photo_group_id: groupId,
      sort_order: 1
    });

    if (itemInsertError) {
      await deleteNewlyCreatedGroup(groupId);
      if (isUniqueViolation(itemInsertError)) {
        groupedPhotoIds.add(photo.id);
        continue;
      }

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

async function fetchGroupPhotoMemberships(groupIds: string[]) {
  const counts = new Map<string, number>();

  if (!supabase || groupIds.length === 0) {
    return {
      counts,
      items: []
    };
  }

  const { data, error } = await supabase
    .from("photo_group_items")
    .select("photo_id,photo_group_id,sort_order")
    .in("photo_group_id", groupIds);

  if (error) {
    return {
      counts,
      items: []
    };
  }

  const items = dedupeGroupItemsByGroupAndPhoto((data ?? []) as unknown as GroupItemRow[]);

  for (const item of items) {
    counts.set(item.photo_group_id, (counts.get(item.photo_group_id) ?? 0) + 1);
  }

  return {
    counts,
    items
  };
}

export async function movePhotoToGroup(photoId: string, targetGroupId: string): Promise<ReviewGroupEditResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      groupId: null,
      message: "Supabase is not configured"
    };
  }

  const membership = await fetchFirstGroupItemForPhoto(photoId);
  if (membership.status === "error") {
    return {
      status: "error",
      groupId: null,
      message: membership.message
    };
  }

  if (!membership.item) {
    return {
      status: "error",
      groupId: null,
      message: "Photo group membership was not found"
    };
  }

  if (membership.item.photo_group_id === targetGroupId) {
    return {
      status: "success",
      groupId: targetGroupId,
      message: "Photo is already in the selected group"
    };
  }

  const { error } = await supabase
    .from("photo_group_items")
    .update({
      photo_group_id: targetGroupId,
      sort_order: null
    })
    .eq("photo_id", photoId);

  if (error) {
    return {
      status: "error",
      groupId: null,
      message: error.message
    };
  }

  return {
    status: "success",
    groupId: targetGroupId,
    message: "Photo moved to another group"
  };
}

export async function splitPhotoToNewGroup(photoId: string): Promise<ReviewGroupEditResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      groupId: null,
      message: "Supabase is not configured"
    };
  }

  const membership = await fetchFirstGroupItemForPhoto(photoId);
  if (membership.status === "error") {
    return {
      status: "error",
      groupId: null,
      message: membership.message
    };
  }

  if (!membership.item) {
    return {
      status: "error",
      groupId: null,
      message: "Photo group membership was not found"
    };
  }

  const { data: groupData, error: groupError } = await supabase
    .from("photo_groups")
    .insert({
      review_status: "pending",
      export_status: "not_exported"
    })
    .select("id")
    .single();

  if (groupError) {
    return {
      status: "error",
      groupId: null,
      message: groupError.message
    };
  }

  const newGroupId = (groupData as { id: string }).id;
  const { error: itemError } = await supabase
    .from("photo_group_items")
    .update({
      photo_group_id: newGroupId,
      sort_order: 1
    })
    .eq("photo_id", photoId);

  if (itemError) {
    await deleteNewlyCreatedGroup(newGroupId);
    return {
      status: "error",
      groupId: null,
      message: itemError.message
    };
  }

  return {
    status: "success",
    groupId: newGroupId,
    message: "Photo split into a new group"
  };
}

export async function mergeGroups(sourceGroupId: string, targetGroupId: string): Promise<ReviewGroupEditResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      groupId: null,
      message: "Supabase is not configured"
    };
  }

  if (sourceGroupId === targetGroupId) {
    return {
      status: "error",
      groupId: null,
      message: "Select a different target group"
    };
  }

  const photoIds = await fetchPhotoIdsForGroup(sourceGroupId);
  if (photoIds.status === "error") {
    return {
      status: "error",
      groupId: null,
      message: photoIds.message
    };
  }

  if (photoIds.ids.length === 0) {
    return {
      status: "error",
      groupId: null,
      message: "Source group has no photos"
    };
  }

  const { error } = await supabase
    .from("photo_group_items")
    .update({
      photo_group_id: targetGroupId,
      sort_order: null
    })
    .eq("photo_group_id", sourceGroupId);

  if (error) {
    return {
      status: "error",
      groupId: null,
      message: error.message
    };
  }

  return {
    status: "success",
    groupId: targetGroupId,
    message: "Groups merged"
  };
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

async function fetchFirstGroupItemForPhoto(photoId: string) {
  if (!supabase) {
    return {
      status: "not-configured" as const,
      item: null,
      message: "Supabase is not configured"
    };
  }

  const { data, error } = await supabase
    .from("photo_group_items")
    .select("photo_id,photo_group_id,sort_order")
    .eq("photo_id", photoId)
    .limit(1);

  if (error) {
    return {
      status: "error" as const,
      item: null,
      message: error.message
    };
  }

  return {
    status: "success" as const,
    item: ((data ?? []) as unknown as GroupItemRow[])[0] ?? null,
    message: "Checked photo_group_items"
  };
}

async function deleteNewlyCreatedGroup(groupId: string) {
  if (!supabase) {
    return;
  }

  await supabase.from("photo_groups").delete().eq("id", groupId);
}

function isUniqueViolation(error: { code?: string; message?: string }) {
  return error.code === "23505" || /duplicate key|unique/i.test(error.message ?? "");
}

function dedupeGroupItemsByPhoto(items: GroupItemRow[]) {
  const seenPhotoIds = new Set<string>();
  return items.filter((item) => {
    if (seenPhotoIds.has(item.photo_id)) {
      return false;
    }

    seenPhotoIds.add(item.photo_id);
    return true;
  });
}

function dedupeGroupItemsByGroupAndPhoto(items: GroupItemRow[]) {
  const seenKeys = new Set<string>();
  return items.filter((item) => {
    const key = `${item.photo_group_id}:${item.photo_id}`;
    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function selectFirstGroupPerPhoto(groups: GroupRow[], items: GroupItemRow[]) {
  const visibleGroupIds = new Set<string>();
  const seenPhotoIds = new Set<string>();
  const groupOrder = new Map(groups.map((group, index) => [group.id, index]));
  const orderedItems = [...items].sort((a, b) => {
    const groupIndexDiff = (groupOrder.get(a.photo_group_id) ?? 0) - (groupOrder.get(b.photo_group_id) ?? 0);
    return groupIndexDiff !== 0 ? groupIndexDiff : (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  for (const item of orderedItems) {
    if (seenPhotoIds.has(item.photo_id)) {
      continue;
    }

    seenPhotoIds.add(item.photo_id);
    visibleGroupIds.add(item.photo_group_id);
  }

  return visibleGroupIds;
}
