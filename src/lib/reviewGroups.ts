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
  notes: string | null;
  photo_count: number;
  qr_patient_candidate: string | null;
  has_qr_photo: boolean;
  qr_photo_count: number;
  needs_review_label: boolean;
  attention_reasons: string[];
  representative_photo_path: string | null;
  representative_photo_filename: string | null;
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
  notes: string | null;
  photo_type: string | null;
  photo_type_confidence: number | null;
  photo_type_source: string | null;
  sort_order: number | null;
};

export type ReviewGroupForm = {
  patient_id: string;
  shooting_date: string;
  doctor_id: string;
  photographer_id: string;
  notes: string;
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

export type ReviewGroupListStatus = "pending" | "approved";

export type PhotoTypeUpdate = {
  photoId: string;
  photoType: string | null;
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
  "approved_at",
  "notes",
  "photo_type",
  "photo_type_confidence",
  "photo_type_source"
].join(",");

type GroupRow = Omit<
  ReviewGroup,
  | "photo_count"
  | "qr_patient_candidate"
  | "has_qr_photo"
  | "qr_photo_count"
  | "needs_review_label"
  | "attention_reasons"
  | "notes"
  | "representative_photo_path"
  | "representative_photo_filename"
>;
type PhotoRow = Omit<ReviewGroupPhoto, "sort_order">;
type GroupItemRow = {
  photo_id: string;
  photo_group_id: string;
  sort_order: number | null;
};

type PhotoSet = {
  qrPatientCandidate: string | null;
  photos: PhotoRow[];
};

type GroupDisplaySummary = {
  qrPatientCandidate: string | null;
  hasQrPhoto: boolean;
  qrPhotoCount: number;
  notes: string | null;
  representativePhotoPath: string | null;
  representativePhotoFilename: string | null;
};

let pendingEnsureGroupsPromise: Promise<EnsureGroupsResult> | null = null;

type EnsureGroupsResult = {
  status: "success" | "error" | "not-configured";
  message: string;
};

const filenameCollator = new Intl.Collator("ja-JP", {
  numeric: true,
  sensitivity: "base"
});

export async function fetchPendingReviewGroups(): Promise<ReviewGroupsResult> {
  return fetchReviewGroupsByStatus("pending");
}

export async function fetchReviewGroupsByStatus(reviewStatus: ReviewGroupListStatus): Promise<ReviewGroupsResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      groups: [],
      message: "Supabase未設定のためレビュー撮影セットを取得できません"
    };
  }

  if (reviewStatus === "pending") {
    const ensureResult = await ensurePendingPhotosHaveGroups();
    if (ensureResult.status === "error") {
      return {
        status: "error",
        groups: [],
        message: ensureResult.message
      };
    }
  }

  const { data, error } = await supabase
    .from("photo_groups")
    .select(groupColumns)
    .eq("review_status", reviewStatus)
    .order(reviewStatus === "approved" ? "approved_at" : "created_at", { ascending: false, nullsFirst: false })
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
  const displaySummaries = await fetchGroupDisplaySummaries(memberships.items);

  return {
    status: "success",
    groups: groups
      .filter((group) => visibleGroupIds.has(group.id) && (memberships.counts.get(group.id) ?? 0) > 0)
      .map((group) => {
        const photoCount = memberships.counts.get(group.id) ?? 0;
        const summary = displaySummaries.get(group.id);
        const patientCandidate = group.patient_id ?? summary?.qrPatientCandidate ?? null;
        const attentionReasons = buildAttentionReasons({
          hasQrPhoto: summary?.hasQrPhoto ?? false,
          patientCandidate,
          photoCount,
          qrPhotoCount: summary?.qrPhotoCount ?? 0
        });

        return {
          ...group,
          photo_count: photoCount,
          qr_patient_candidate: summary?.qrPatientCandidate ?? null,
          has_qr_photo: summary?.hasQrPhoto ?? false,
          qr_photo_count: summary?.qrPhotoCount ?? 0,
          needs_review_label: attentionReasons.length > 0,
          attention_reasons: attentionReasons,
          notes: summary?.notes ?? null,
          representative_photo_path: summary?.representativePhotoPath ?? null,
          representative_photo_filename: summary?.representativePhotoFilename ?? null
        };
      }),
    message: reviewStatus === "pending" ? "確認待ち撮影セットを取得しました" : "確認済み撮影セットを取得しました"
  };
}

export async function fetchReviewGroupPhotos(groupId: string): Promise<ReviewGroupPhotosResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      photos: [],
      message: "Supabase未設定のため撮影セット内写真を取得できません"
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
      message: "この撮影セットには写真がありません"
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
    message: "撮影セット内写真を取得しました"
  };
}

export async function updateReviewGroupMetadata(
  groupId: string,
  form: ReviewGroupForm,
  photoTypes: PhotoTypeUpdate[] = []
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
  if (photoIds.status === "error") {
    return {
      status: "error",
      group: null,
      message: photoIds.message
    };
  }

  if (photoIds.ids.length > 0) {
    const { error: photoNoteError } = await supabase
      .from("photos")
      .update({
        notes: normalizeNullableText(form.notes),
        reviewed_at: now
      })
      .in("id", photoIds.ids);

    if (photoNoteError) {
      return {
        status: "error",
        group: null,
        message: photoNoteError.message
      };
    }
  }

  const photoTypeResult = await updateReviewGroupPhotoTypes(photoTypes);
  if (photoTypeResult.status === "error") {
    return {
      status: "error",
      group: null,
      message: photoTypeResult.message
    };
  }

  const displaySummaries = await fetchGroupDisplaySummaries(
    photoIds.ids.map((photoId, index) => ({
      photo_id: photoId,
      photo_group_id: groupId,
      sort_order: index + 1
    }))
  );
  const displaySummary = displaySummaries.get(groupId);
  const savedGroup = (data as unknown as GroupRow) ?? {};
  const patientCandidate = savedGroup.patient_id ?? displaySummary?.qrPatientCandidate ?? null;
  const attentionReasons = buildAttentionReasons({
    hasQrPhoto: displaySummary?.hasQrPhoto ?? false,
    patientCandidate,
    photoCount: photoIds.ids.length,
    qrPhotoCount: displaySummary?.qrPhotoCount ?? 0
  });

  return {
    status: "success",
    group: {
      ...savedGroup,
      photo_count: photoIds.ids.length,
      qr_patient_candidate: displaySummary?.qrPatientCandidate ?? null,
      has_qr_photo: displaySummary?.hasQrPhoto ?? false,
      qr_photo_count: displaySummary?.qrPhotoCount ?? 0,
      needs_review_label: attentionReasons.length > 0,
      attention_reasons: attentionReasons,
      notes: normalizeNullableText(form.notes),
      representative_photo_path: displaySummary?.representativePhotoPath ?? null,
      representative_photo_filename: displaySummary?.representativePhotoFilename ?? null
    },
    message: "レビュー内容を保存しました"
  };
}

export async function completeReviewGroup(
  groupId: string,
  form?: ReviewGroupForm,
  photoTypes: PhotoTypeUpdate[] = []
): Promise<ReviewGroupMutationResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      group: null,
      message: "Supabase未設定のためレビュー完了にできません"
    };
  }

  if (form) {
    const saveResult = await updateReviewGroupMetadata(groupId, form, photoTypes);

    if (saveResult.status !== "success") {
      return saveResult;
    }
  } else if (photoTypes.length > 0) {
    const photoTypeResult = await updateReviewGroupPhotoTypes(photoTypes);
    if (photoTypeResult.status === "error") {
      return {
        status: "error",
        group: null,
        message: photoTypeResult.message
      };
    }
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
  const displaySummaries = await fetchGroupDisplaySummaries(
    photoIds.ids.map((photoId, index) => ({
      photo_id: photoId,
      photo_group_id: groupId,
      sort_order: index + 1
    }))
  );
  const displaySummary = displaySummaries.get(groupId);
  const completedGroup = (data as unknown as GroupRow) ?? {};
  const patientCandidate = completedGroup.patient_id ?? displaySummary?.qrPatientCandidate ?? null;
  const attentionReasons = buildAttentionReasons({
    hasQrPhoto: displaySummary?.hasQrPhoto ?? false,
    patientCandidate,
    photoCount: photoIds.ids.length,
    qrPhotoCount: displaySummary?.qrPhotoCount ?? 0
  });

  return {
    status: "success",
    group: {
      ...completedGroup,
      photo_count: photoIds.ids.length,
      qr_patient_candidate: displaySummary?.qrPatientCandidate ?? null,
      has_qr_photo: displaySummary?.hasQrPhoto ?? false,
      qr_photo_count: displaySummary?.qrPhotoCount ?? 0,
      needs_review_label: attentionReasons.length > 0,
      attention_reasons: attentionReasons,
      notes: displaySummary?.notes ?? null,
      representative_photo_path: displaySummary?.representativePhotoPath ?? null,
      representative_photo_filename: displaySummary?.representativePhotoFilename ?? null
    },
    message: "レビュー完了にしました"
  };
}

export async function returnReviewGroupToPending(groupId: string): Promise<ReviewGroupMutationResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      group: null,
      message: "Supabase未設定のため確認待ちに戻せません"
    };
  }

  const { data: currentData, error: currentError } = await supabase
    .from("photo_groups")
    .select(groupColumns)
    .eq("id", groupId)
    .single();

  if (currentError) {
    return {
      status: "error",
      group: null,
      message: currentError.message
    };
  }

  const currentGroup = currentData as unknown as GroupRow;
  if (currentGroup.export_status === "exported") {
    return {
      status: "error",
      group: null,
      message: "この撮影セットは出力済みのため、確認待ちには戻せません"
    };
  }

  const reopenPayload = {
    review_status: "pending",
    export_status: "not_exported",
    approved_at: null
  };

  const { data, error } = await supabase
    .from("photo_groups")
    .update(reopenPayload)
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
    const { error: photoError } = await supabase.from("photos").update(reopenPayload).in("id", photoIds.ids);

    if (photoError) {
      return {
        status: "error",
        group: null,
        message: photoError.message
      };
    }
  }

  const displaySummaries = await fetchGroupDisplaySummaries(
    photoIds.ids.map((photoId, index) => ({
      photo_id: photoId,
      photo_group_id: groupId,
      sort_order: index + 1
    }))
  );
  const displaySummary = displaySummaries.get(groupId);
  const reopenedGroup = (data as unknown as GroupRow) ?? {};
  const patientCandidate = reopenedGroup.patient_id ?? displaySummary?.qrPatientCandidate ?? null;
  const attentionReasons = buildAttentionReasons({
    hasQrPhoto: displaySummary?.hasQrPhoto ?? false,
    patientCandidate,
    photoCount: photoIds.ids.length,
    qrPhotoCount: displaySummary?.qrPhotoCount ?? 0
  });

  return {
    status: "success",
    group: {
      ...reopenedGroup,
      photo_count: photoIds.ids.length,
      qr_patient_candidate: displaySummary?.qrPatientCandidate ?? null,
      has_qr_photo: displaySummary?.hasQrPhoto ?? false,
      qr_photo_count: displaySummary?.qrPhotoCount ?? 0,
      needs_review_label: attentionReasons.length > 0,
      attention_reasons: attentionReasons,
      notes: displaySummary?.notes ?? null,
      representative_photo_path: displaySummary?.representativePhotoPath ?? null,
      representative_photo_filename: displaySummary?.representativePhotoFilename ?? null
    },
    message: "確認待ちに戻しました"
  };
}

async function updateReviewGroupPhotoTypes(photoTypes: PhotoTypeUpdate[]) {
  if (!supabase || photoTypes.length === 0) {
    return {
      status: "success" as const,
      message: "写真種別の更新対象はありません"
    };
  }

  for (const item of photoTypes) {
    const { error } = await supabase
      .from("photos")
      .update({
        photo_type: item.photoType,
        photo_type_source: item.photoType ? "manual" : null,
        photo_type_confidence: null
      })
      .eq("id", item.photoId);

    if (error) {
      return {
        status: "error" as const,
        message: error.message
      };
    }
  }

  return {
    status: "success" as const,
    message: "写真種別を保存しました"
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
  const ungroupedPhotos = sortPhotosForQrBoundaryGrouping(photos.filter((photo) => !groupedPhotoIds.has(photo.id)));
  const photoSets = buildQrBoundaryPhotoSets(ungroupedPhotos);

  for (const photoSet of photoSets) {
    const createResult = await createPhotoGroupForSet(photoSet);
    if (createResult.status === "error") {
      return createResult;
    }
  }

  return {
    status: "success" as const,
    message: "QR boundary groups were ensured"
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

export async function regroupPendingPhotosByQrBoundaries(): Promise<ReviewGroupEditResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      groupId: null,
      message: "Supabase is not configured"
    };
  }

  const { data: photoData, error: photoError } = await supabase
    .from("photos")
    .select(photoColumns)
    .eq("review_status", "pending")
    .order("original_filename", { ascending: true })
    .order("imported_at", { ascending: true });

  if (photoError) {
    return {
      status: "error",
      groupId: null,
      message: photoError.message
    };
  }

  const pendingPhotos = sortPhotosForQrBoundaryGrouping((photoData ?? []) as unknown as PhotoRow[]);
  if (pendingPhotos.length === 0) {
    return {
      status: "success",
      groupId: null,
      message: "No pending photos to regroup"
    };
  }

  const pendingPhotoIds = pendingPhotos.map((photo) => photo.id);
  const { error: deleteItemsError } = await supabase.from("photo_group_items").delete().in("photo_id", pendingPhotoIds);

  if (deleteItemsError) {
    return {
      status: "error",
      groupId: null,
      message: deleteItemsError.message
    };
  }

  await deleteEmptyPendingGroups();

  const photoSets = buildQrBoundaryPhotoSets(pendingPhotos);
  let firstGroupId: string | null = null;

  for (const photoSet of photoSets) {
    const createResult = await createPhotoGroupForSet(photoSet);
    if (createResult.status === "error") {
      return {
        status: "error",
        groupId: firstGroupId,
        message: createResult.message
      };
    }

    firstGroupId = firstGroupId ?? createResult.groupId;
  }

  return {
    status: "success",
    groupId: firstGroupId,
    message: "Pending photos were regrouped by QR boundaries"
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
    message: "撮影セット内写真IDを取得しました"
  };
}

function normalizeNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sortPhotosForQrBoundaryGrouping(photos: PhotoRow[]) {
  return [...photos].sort((a, b) => {
    const filenameDiff = filenameCollator.compare(a.original_filename, b.original_filename);
    if (filenameDiff !== 0) {
      return filenameDiff;
    }

    return (a.imported_at ?? "").localeCompare(b.imported_at ?? "");
  });
}

function buildQrBoundaryPhotoSets(photos: PhotoRow[]) {
  const sets: PhotoSet[] = [];
  let currentSet: PhotoSet | null = null;

  for (const photo of photos) {
    if (isQrBoundaryFilename(photo.original_filename)) {
      currentSet = {
        qrPatientCandidate: extractQrPatientCandidate(photo.original_filename),
        photos: []
      };
      sets.push(currentSet);
    }

    if (!currentSet) {
      currentSet = {
        qrPatientCandidate: null,
        photos: []
      };
      sets.push(currentSet);
    }

    currentSet.photos.push(photo);
  }

  return sets.filter((set) => set.photos.length > 0);
}

function isQrBoundaryFilename(filename: string) {
  return /qr/i.test(filename);
}

function extractQrPatientCandidate(filename: string) {
  const match = filename.match(/qr[_-]?patient[_-]?([a-z0-9]+)/i);
  return match?.[1] ?? null;
}

async function createPhotoGroupForSet(photoSet: PhotoSet): Promise<ReviewGroupEditResult> {
  if (!supabase) {
    return {
      status: "not-configured",
      groupId: null,
      message: "Supabase is not configured"
    };
  }

  const ungroupedPhotos: PhotoRow[] = [];
  for (const photo of photoSet.photos) {
    const existingItem = await fetchFirstGroupItemForPhoto(photo.id);
    if (existingItem.status === "error") {
      return {
        status: "error",
        groupId: null,
        message: existingItem.message
      };
    }

    if (!existingItem.item) {
      ungroupedPhotos.push(photo);
    }
  }

  if (ungroupedPhotos.length === 0) {
    return {
      status: "success",
      groupId: null,
      message: "Photo set already has memberships"
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

  const groupId = (groupData as { id: string }).id;

  for (const [index, photo] of ungroupedPhotos.entries()) {
    const existingItem = await fetchFirstGroupItemForPhoto(photo.id);
    if (existingItem.status === "error") {
      await deleteNewlyCreatedGroup(groupId);
      return {
        status: "error",
        groupId: null,
        message: existingItem.message
      };
    }

    if (existingItem.item) {
      continue;
    }

    const { error: itemInsertError } = await supabase.from("photo_group_items").insert({
      photo_id: photo.id,
      photo_group_id: groupId,
      sort_order: index + 1
    });

    if (itemInsertError) {
      await deleteNewlyCreatedGroup(groupId);
      if (isUniqueViolation(itemInsertError)) {
        return {
          status: "success",
          groupId: null,
          message: "Photo set was already grouped"
        };
      }

      return {
        status: "error",
        groupId: null,
        message: itemInsertError.message
      };
    }
  }

  return {
    status: "success",
    groupId,
    message: "Photo set grouped by QR boundary"
  };
}

async function fetchGroupDisplaySummaries(items: GroupItemRow[]) {
  const summaries = new Map<string, GroupDisplaySummary>();

  if (!supabase || items.length === 0) {
    return summaries;
  }

  const photoIds = [...new Set(items.map((item) => item.photo_id))];
  const { data, error } = await supabase
    .from("photos")
    .select("id,original_filename,original_path,imported_at,notes")
    .in("id", photoIds);

  if (error) {
    return summaries;
  }

  const photoById = new Map(((data ?? []) as unknown as PhotoRow[]).map((photo) => [photo.id, photo]));
  const itemsByGroup = new Map<string, GroupItemRow[]>();

  for (const item of items) {
    const groupItems = itemsByGroup.get(item.photo_group_id) ?? [];
    groupItems.push(item);
    itemsByGroup.set(item.photo_group_id, groupItems);
  }

  for (const [groupId, groupItems] of itemsByGroup) {
    const groupPhotos = sortPhotosForQrBoundaryGrouping(
      groupItems.map((item) => photoById.get(item.photo_id)).filter((photo): photo is PhotoRow => Boolean(photo))
    );
    const qrPhotos = groupPhotos.filter((photo) => isQrBoundaryFilename(photo.original_filename));
    const qrPhoto = qrPhotos[0] ?? null;
    const representativePhoto =
      groupPhotos.find((photo) => !isQrBoundaryFilename(photo.original_filename)) ?? groupPhotos[0] ?? null;
    const noteSourcePhoto = groupPhotos.find((photo) => photo.notes);
    summaries.set(groupId, {
      qrPatientCandidate: qrPhoto ? extractQrPatientCandidate(qrPhoto.original_filename) : null,
      hasQrPhoto: Boolean(qrPhoto),
      qrPhotoCount: qrPhotos.length,
      notes: noteSourcePhoto?.notes ?? null,
      representativePhotoPath: representativePhoto?.original_path ?? null,
      representativePhotoFilename: representativePhoto?.original_filename ?? null
    });
  }

  return summaries;
}

function buildAttentionReasons({
  hasQrPhoto,
  patientCandidate,
  photoCount,
  qrPhotoCount
}: {
  hasQrPhoto: boolean;
  patientCandidate: string | null;
  photoCount: number;
  qrPhotoCount: number;
}) {
  const reasons: string[] = [];

  if (!hasQrPhoto) {
    reasons.push("QRなし");
  }

  if (!patientCandidate) {
    reasons.push("患者ID候補なし");
  }

  if (photoCount === 1) {
    reasons.push("写真枚数が少ない");
  }

  if (photoCount >= 10) {
    reasons.push("写真枚数が多い");
  }

  if (qrPhotoCount >= 2) {
    reasons.push("QR画像が複数");
  }

  return reasons;
}

async function deleteEmptyPendingGroups() {
  if (!supabase) {
    return;
  }

  const { data: groupData, error: groupError } = await supabase
    .from("photo_groups")
    .select("id")
    .eq("review_status", "pending");

  if (groupError) {
    return;
  }

  const groupIds = ((groupData ?? []) as unknown as Array<{ id: string }>).map((group) => group.id);
  if (groupIds.length === 0) {
    return;
  }

  const memberships = await fetchGroupPhotoMemberships(groupIds);
  const emptyGroupIds = groupIds.filter((groupId) => (memberships.counts.get(groupId) ?? 0) === 0);

  if (emptyGroupIds.length > 0) {
    await supabase.from("photo_groups").delete().in("id", emptyGroupIds);
  }
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

  await supabase.from("photo_group_items").delete().eq("photo_group_id", groupId);
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
