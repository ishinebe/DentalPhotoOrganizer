import { fetchStaffMembers } from "./staff";
import { hasSupabaseConfig, supabase } from "./supabase";

export type ExportStatus = "not_exported" | "ready_for_export" | "exported" | "export_failed";

export type ExportGroupPhoto = {
  id: string;
  original_filename: string;
  original_path: string | null;
  export_status: ExportStatus;
  code_type: string | null;
  code_text: string | null;
  photo_type: string | null;
  photo_type_source: string | null;
  sort_order: number | null;
};

export type ExportGroup = {
  id: string;
  patient_id: string | null;
  shooting_date: string | null;
  doctor_id: string | null;
  doctor_name: string | null;
  photographer_id: string | null;
  photographer_name: string | null;
  photo_protocol: string | null;
  review_status: "approved";
  export_status: "ready_for_export";
  created_at: string | null;
  official_export_folder_path: string | null;
  official_exported_at: string | null;
  photos: ExportGroupPhoto[];
};

export type ExportGroupsResult = {
  status: "success" | "error" | "not-configured";
  groups: ExportGroup[];
  message: string;
};

export type MarkExportedResult = {
  status: "success" | "error" | "not-configured";
  message: string;
};

export type MarkExportedGroup = {
  groupId: string;
  officialExportFolderPath: string;
};

type ExportGroupRow = {
  id: string;
  patient_id: string | null;
  shooting_date: string | null;
  doctor_id: string | null;
  photographer_id: string | null;
  photo_protocol: string | null;
  review_status: "approved";
  export_status: "ready_for_export";
  created_at: string | null;
  official_export_folder_path: string | null;
  official_exported_at: string | null;
};

type ExportGroupItemRow = {
  photo_group_id: string;
  photo_id: string;
  sort_order: number | null;
};

type ExportPhotoRow = {
  id: string;
  original_filename: string;
  original_path: string | null;
  export_status: ExportStatus;
  code_type: string | null;
  code_text: string | null;
  photo_type: string | null;
  photo_type_source: string | null;
};

const exportGroupColumns = [
  "id",
  "patient_id",
  "shooting_date",
  "doctor_id",
  "photographer_id",
  "photo_protocol",
  "review_status",
  "export_status",
  "created_at",
  "official_export_folder_path",
  "official_exported_at"
].join(",");

const exportPhotoColumns = [
  "id",
  "original_filename",
  "original_path",
  "export_status",
  "code_type",
  "code_text",
  "photo_type",
  "photo_type_source"
].join(",");

export async function fetchReadyExportGroups(): Promise<ExportGroupsResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      groups: [],
      message: "Supabase未設定のため書き出し対象を取得できません"
    };
  }

  const { data: groupData, error: groupError } = await supabase
    .from("photo_groups")
    .select(exportGroupColumns)
    .eq("review_status", "approved")
    .eq("export_status", "ready_for_export")
    .order("created_at", { ascending: true })
    .limit(100);

  if (groupError) {
    return {
      status: "error",
      groups: [],
      message: groupError.message
    };
  }

  const groupRows = (groupData ?? []) as unknown as ExportGroupRow[];
  if (groupRows.length === 0) {
    return {
      status: "success",
      groups: [],
      message: "書き出す患者がありません"
    };
  }

  const groupIds = groupRows.map((group) => group.id);
  const { data: itemData, error: itemError } = await supabase
    .from("photo_group_items")
    .select("photo_group_id,photo_id,sort_order")
    .in("photo_group_id", groupIds)
    .order("sort_order", { ascending: true });

  if (itemError) {
    return {
      status: "error",
      groups: [],
      message: itemError.message
    };
  }

  const items = (itemData ?? []) as unknown as ExportGroupItemRow[];
  const photoIds = [...new Set(items.map((item) => item.photo_id))];
  const photoById = new Map<string, ExportPhotoRow>();

  if (photoIds.length > 0) {
    const { data: photoData, error: photoError } = await supabase.from("photos").select(exportPhotoColumns).in("id", photoIds);

    if (photoError) {
      return {
        status: "error",
        groups: [],
        message: photoError.message
      };
    }

    for (const photo of (photoData ?? []) as unknown as ExportPhotoRow[]) {
      photoById.set(photo.id, photo);
    }
  }

  const staffNames = await fetchStaffNameMap();
  const itemsByGroup = new Map<string, ExportGroupItemRow[]>();

  for (const item of items) {
    const groupItems = itemsByGroup.get(item.photo_group_id) ?? [];
    groupItems.push(item);
    itemsByGroup.set(item.photo_group_id, groupItems);
  }

  const groups = groupRows.map((group) => {
    const photos = (itemsByGroup.get(group.id) ?? [])
      .map((item) => {
        const photo = photoById.get(item.photo_id);
        return photo ? { ...photo, sort_order: item.sort_order } : null;
      })
      .filter((photo): photo is ExportGroupPhoto => Boolean(photo))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    return {
      ...group,
      doctor_name: group.doctor_id ? staffNames.get(group.doctor_id) ?? group.doctor_id : null,
      photographer_name: group.photographer_id ? staffNames.get(group.photographer_id) ?? group.photographer_id : null,
      photos
    };
  });

  return {
    status: "success",
    groups,
    message: "書き出し対象を取得しました"
  };
}

export async function markGroupsExported(groups: MarkExportedGroup[]): Promise<MarkExportedResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      message: "Supabase未設定のため書き出し状態を更新できません"
    };
  }

  if (groups.length === 0) {
    return {
      status: "success",
      message: "更新対象はありません"
    };
  }

  const exportedAt = new Date().toISOString();
  const groupIds = groups.map((group) => group.groupId);

  for (const group of groups) {
    const { error: groupError } = await supabase
      .from("photo_groups")
      .update({
        export_status: "exported",
        official_export_folder_path: group.officialExportFolderPath,
        official_exported_at: exportedAt
      })
      .eq("id", group.groupId);

    if (groupError) {
      return {
        status: "error",
        message: groupError.message
      };
    }
  }

  const { data: itemData, error: itemError } = await supabase
    .from("photo_group_items")
    .select("photo_id")
    .in("photo_group_id", groupIds);

  if (itemError) {
    return {
      status: "error",
      message: itemError.message
    };
  }

  const photoIds = [...new Set(((itemData ?? []) as unknown as Array<{ photo_id: string }>).map((item) => item.photo_id))];
  if (photoIds.length > 0) {
    const { error: photoError } = await supabase
      .from("photos")
      .update({
        export_status: "exported"
      })
      .in("id", photoIds);

    if (photoError) {
      return {
        status: "error",
        message: photoError.message
      };
    }
  }

  return {
    status: "success",
    message: "書き出し済みに更新しました"
  };
}

async function fetchStaffNameMap() {
  const staffResult = await fetchStaffMembers();
  return new Map(staffResult.staff.map((staff) => [staff.id, staff.name]));
}
