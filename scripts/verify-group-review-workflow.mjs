import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const env = readEnvFile(resolve(process.cwd(), ".env"));
const supabaseUrl = (env.VITE_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY ?? "").trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const fileHash = `phase3c-group-review-${runId}`;
const metadata = {
  patient_id: `P-PHASE3C-${runId}`,
  shooting_date: new Date().toISOString().slice(0, 10),
  doctor_id: randomUUID(),
  photographer_id: randomUUID()
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
  "reviewed_at",
  "approved_at"
].join(",");

const pendingBefore = await countPendingPhotos();
const insertedPhoto = await insertUngroupedPendingPhoto();
console.log(`Inserted ungrouped pending photo: ${insertedPhoto.id}`);

const beforeItems = await fetchItemsForPhoto(insertedPhoto.id);
assertEqual(beforeItems.length, 0, "new photo initial group membership");
console.log("Verified inserted photo starts without a group.");

const group = await createOnePhotoGroupForPhoto(insertedPhoto);
console.log(`Created temporary group: ${group.id}`);

const groups = await fetchPendingGroups();
if (!groups.some((item) => item.id === group.id)) {
  throw new Error("Created group was not returned from pending photo_groups.");
}
console.log("Verified photo_groups pending fetch includes the created group.");

const groupPhotos = await fetchPhotosForGroup(group.id);
assertEqual(groupPhotos.length, 1, "group photo count");
assertEqual(groupPhotos[0].id, insertedPhoto.id, "group photo id");
console.log("Verified photo_group_items loads the child photo.");

const savedGroup = await saveGroupMetadata(group.id);
assertEqual(savedGroup.patient_id, metadata.patient_id, "group patient_id");
assertEqual(savedGroup.shooting_date, metadata.shooting_date, "group shooting_date");
assertEqual(savedGroup.doctor_id, metadata.doctor_id, "group doctor_id");
assertEqual(savedGroup.photographer_id, metadata.photographer_id, "group photographer_id");
assertPresent(savedGroup.reviewed_at, "group reviewed_at after save");
console.log("Verified group metadata save fields.");

const completedGroup = await completeGroupReview(group.id);
assertEqual(completedGroup.review_status, "approved", "group review_status");
assertEqual(completedGroup.export_status, "ready_for_export", "group export_status");
assertPresent(completedGroup.reviewed_at, "group reviewed_at after complete");
assertPresent(completedGroup.approved_at, "group approved_at");
console.log("Verified group review completion fields.");

const completedPhoto = await fetchPhoto(insertedPhoto.id);
assertEqual(completedPhoto.review_status, "approved", "photo review_status");
assertEqual(completedPhoto.export_status, "ready_for_export", "photo export_status");
assertPresent(completedPhoto.reviewed_at, "photo reviewed_at after complete");
assertPresent(completedPhoto.approved_at, "photo approved_at");
console.log("Verified child photo review completion fields.");

const pendingAfter = await countPendingPhotos();
assertEqual(pendingAfter, pendingBefore, "Dashboard-equivalent pending photo count after completion");
console.log("Verified Dashboard-equivalent pending count returns to the pre-test value.");

console.log(
  JSON.stringify(
    {
      photo_id: insertedPhoto.id,
      photo_group_id: group.id,
      pending_before: pendingBefore,
      pending_after: pendingAfter
    },
    null,
    2
  )
);

async function insertUngroupedPendingPhoto() {
  const { data, error } = await supabase
    .from("photos")
    .insert({
      original_filename: `phase3c-group-review-${runId}.jpg`,
      original_path: `C:/Phase3C/phase3c-group-review-${runId}.jpg`,
      file_hash: fileHash,
      file_size: 123456,
      mime_type: "image/jpeg",
      imported_at: new Date().toISOString(),
      review_status: "pending",
      export_status: "not_exported"
    })
    .select(photoColumns)
    .single();

  if (error) {
    throw new Error(`Insert pending photo failed: ${error.message}`);
  }

  return data;
}

async function createOnePhotoGroupForPhoto(photo) {
  const { data: group, error: groupError } = await supabase
    .from("photo_groups")
    .insert({
      review_status: "pending",
      export_status: "not_exported"
    })
    .select(groupColumns)
    .single();

  if (groupError) {
    throw new Error(`Create group failed: ${groupError.message}`);
  }

  const { error: itemError } = await supabase.from("photo_group_items").insert({
    photo_id: photo.id,
    photo_group_id: group.id,
    sort_order: 1
  });

  if (itemError) {
    throw new Error(`Create group item failed: ${itemError.message}`);
  }

  return group;
}

async function fetchPendingGroups() {
  const { data, error } = await supabase
    .from("photo_groups")
    .select(groupColumns)
    .eq("review_status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Fetch pending groups failed: ${error.message}`);
  }

  return data ?? [];
}

async function fetchPhotosForGroup(groupId) {
  const { data: items, error: itemError } = await supabase
    .from("photo_group_items")
    .select("photo_id,photo_group_id,sort_order")
    .eq("photo_group_id", groupId)
    .order("sort_order", { ascending: true });

  if (itemError) {
    throw new Error(`Fetch group items failed: ${itemError.message}`);
  }

  const photoIds = (items ?? []).map((item) => item.photo_id);
  const { data: photos, error: photoError } = await supabase.from("photos").select(photoColumns).in("id", photoIds);

  if (photoError) {
    throw new Error(`Fetch group photos failed: ${photoError.message}`);
  }

  const photoById = new Map((photos ?? []).map((photo) => [photo.id, photo]));
  return photoIds.map((id) => photoById.get(id)).filter(Boolean);
}

async function fetchItemsForPhoto(photoId) {
  const { data, error } = await supabase
    .from("photo_group_items")
    .select("photo_id,photo_group_id,sort_order")
    .eq("photo_id", photoId);

  if (error) {
    throw new Error(`Fetch photo items failed: ${error.message}`);
  }

  return data ?? [];
}

async function saveGroupMetadata(groupId) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("photo_groups")
    .update({
      ...metadata,
      reviewed_at: now
    })
    .eq("id", groupId)
    .select(groupColumns)
    .single();

  if (error) {
    throw new Error(`Save group metadata failed: ${error.message}`);
  }

  return data;
}

async function completeGroupReview(groupId) {
  const now = new Date().toISOString();
  const completionPayload = {
    review_status: "approved",
    export_status: "ready_for_export",
    reviewed_at: now,
    approved_at: now
  };

  const { data: group, error: groupError } = await supabase
    .from("photo_groups")
    .update(completionPayload)
    .eq("id", groupId)
    .select(groupColumns)
    .single();

  if (groupError) {
    throw new Error(`Complete group review failed: ${groupError.message}`);
  }

  const groupPhotos = await fetchPhotosForGroup(groupId);
  const { error: photoError } = await supabase
    .from("photos")
    .update(completionPayload)
    .in(
      "id",
      groupPhotos.map((photo) => photo.id)
    );

  if (photoError) {
    throw new Error(`Complete child photos failed: ${photoError.message}`);
  }

  return group;
}

async function fetchPhoto(photoId) {
  const { data, error } = await supabase.from("photos").select(photoColumns).eq("id", photoId).single();

  if (error) {
    throw new Error(`Fetch photo failed: ${error.message}`);
  }

  return data;
}

async function countPendingPhotos() {
  const { count, error } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("review_status", "pending");

  if (error) {
    throw new Error(`Count pending photos failed: ${error.message}`);
  }

  return count ?? 0;
}

function readEnvFile(path) {
  try {
    return readFileSync(path, "utf8")
      .split(/\r?\n/)
      .reduce((values, line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          return values;
        }

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) {
          return values;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
        values[key] = value;
        return values;
      }, {});
  } catch {
    return {};
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} mismatch. Expected "${expected}", got "${actual}".`);
  }
}

function assertPresent(value, label) {
  if (!value) {
    throw new Error(`${label} was not set.`);
  }
}
