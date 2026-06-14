import { fetchStaffMembers } from "./staff";
import { hasSupabaseConfig, supabase } from "./supabase";

export type SearchReviewStatus = "pending" | "approved" | "reviewing" | "rejected";
export type SearchExportStatus = "not_exported" | "ready_for_export" | "exported" | "export_failed";

export type SearchGroupFilters = {
  patientId: string;
  shootingDateFrom: string;
  shootingDateTo: string;
  doctor: string;
  photographer: string;
};

export type SearchGroupPhoto = {
  id: string;
  original_filename: string;
  original_path: string | null;
  photo_type: string | null;
  code_type: string | null;
  sort_order: number | null;
};

export type SearchGroupResult = {
  id: string;
  patient_id: string | null;
  shooting_date: string | null;
  doctor_id: string | null;
  doctor_name: string | null;
  photographer_id: string | null;
  photographer_name: string | null;
  photo_protocol: string | null;
  review_status: SearchReviewStatus;
  export_status: SearchExportStatus;
  created_at: string | null;
  approved_at: string | null;
  photo_count: number;
  preview_photos: SearchGroupPhoto[];
};

export type SearchGroupsResult = {
  status: "success" | "error" | "not-configured";
  groups: SearchGroupResult[];
  message: string;
};

type SearchGroupRow = Omit<SearchGroupResult, "doctor_name" | "photographer_name" | "photo_count" | "preview_photos">;

type SearchGroupItemRow = {
  photo_group_id: string;
  photo_id: string;
  sort_order: number | null;
};

type SearchPhotoRow = {
  id: string;
  original_filename: string;
  original_path: string | null;
  photo_type: string | null;
  code_type: string | null;
};

const searchGroupColumns = [
  "id",
  "patient_id",
  "shooting_date",
  "doctor_id",
  "photographer_id",
  "photo_protocol",
  "review_status",
  "export_status",
  "created_at",
  "approved_at"
].join(",");

export async function searchPatientPhotoGroups(filters: SearchGroupFilters): Promise<SearchGroupsResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      groups: [],
      message: "Supabase未設定のため検索できません"
    };
  }

  let query = supabase
    .from("photo_groups")
    .select(searchGroupColumns)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(300);

  const patientId = filters.patientId.trim();
  if (patientId) {
    query = query.ilike("patient_id", `%${escapeLikePattern(patientId)}%`);
  }

  if (filters.shootingDateFrom) {
    query = query.gte("shooting_date", filters.shootingDateFrom);
  }

  if (filters.shootingDateTo) {
    query = query.lte("shooting_date", filters.shootingDateTo);
  }

  const { data, error } = await query;
  if (error) {
    return {
      status: "error",
      groups: [],
      message: error.message
    };
  }

  const groupRows = (data ?? []) as unknown as SearchGroupRow[];
  if (groupRows.length === 0) {
    return {
      status: "success",
      groups: [],
      message: "条件に一致する患者はありません"
    };
  }

  const staffResult = await fetchStaffMembers();
  const staffNameById = new Map(staffResult.staff.map((staff) => [staff.id, staff.name]));
  const groupIds = groupRows.map((group) => group.id);
  const { data: itemData, error: itemError } = await supabase
    .from("photo_group_items")
    .select("photo_group_id,photo_id,sort_order")
    .in("photo_group_id", groupIds)
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (itemError) {
    return {
      status: "error",
      groups: [],
      message: itemError.message
    };
  }

  const groupItems = dedupeGroupItemsByPhoto((itemData ?? []) as unknown as SearchGroupItemRow[]);
  const photoCounts = countPhotosByGroup(groupItems);
  const previewPhotosByGroup = await fetchPreviewPhotosByGroup(groupItems);
  const doctorFilter = filters.doctor.trim().toLowerCase();
  const photographerFilter = filters.photographer.trim().toLowerCase();
  const groups = groupRows
    .map((group) => ({
      ...group,
      doctor_name: group.doctor_id ? staffNameById.get(group.doctor_id) ?? group.doctor_id : null,
      photographer_name: group.photographer_id ? staffNameById.get(group.photographer_id) ?? group.photographer_id : null,
      photo_count: photoCounts.get(group.id) ?? 0,
      preview_photos: previewPhotosByGroup.get(group.id) ?? []
    }))
    .filter((group) => group.photo_count > 0)
    .filter((group) => matchesStaffFilter(group.doctor_id, group.doctor_name, doctorFilter))
    .filter((group) => matchesStaffFilter(group.photographer_id, group.photographer_name, photographerFilter));

  return {
    status: "success",
    groups,
    message: groups.length > 0 ? `${groups.length}件の患者が見つかりました` : "条件に一致する患者はありません"
  };
}

function countPhotosByGroup(items: SearchGroupItemRow[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    counts.set(item.photo_group_id, (counts.get(item.photo_group_id) ?? 0) + 1);
  }

  return counts;
}

function dedupeGroupItemsByPhoto(items: SearchGroupItemRow[]) {
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

async function fetchPreviewPhotosByGroup(items: SearchGroupItemRow[]) {
  const result = new Map<string, SearchGroupPhoto[]>();
  if (!supabase || items.length === 0) {
    return result;
  }

  const previewItems = new Map<string, SearchGroupItemRow[]>();
  for (const item of items) {
    const current = previewItems.get(item.photo_group_id) ?? [];
    if (current.length < 5) {
      current.push(item);
      previewItems.set(item.photo_group_id, current);
    }
  }

  const photoIds = Array.from(new Set(Array.from(previewItems.values()).flat().map((item) => item.photo_id)));
  if (photoIds.length === 0) {
    return result;
  }

  const { data, error } = await supabase
    .from("photos")
    .select("id,original_filename,original_path,photo_type,code_type")
    .in("id", photoIds);

  if (error) {
    return result;
  }

  const photoById = new Map(((data ?? []) as unknown as SearchPhotoRow[]).map((photo) => [photo.id, photo]));
  for (const [groupId, groupItems] of previewItems.entries()) {
    const photos = groupItems
      .map((item) => {
        const photo = photoById.get(item.photo_id);
        return photo ? { ...photo, sort_order: item.sort_order } : null;
      })
      .filter((photo): photo is SearchGroupPhoto => Boolean(photo));

    result.set(groupId, photos);
  }

  return result;
}

function matchesStaffFilter(id: string | null, name: string | null, filter: string) {
  if (!filter) {
    return true;
  }

  return Boolean(id?.toLowerCase().includes(filter) || name?.toLowerCase().includes(filter));
}

function escapeLikePattern(value: string) {
  return value.replace(/[%_]/g, (match) => `\\${match}`);
}
