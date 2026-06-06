import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
const env = readEnvFile(envPath);

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
const fileHash = `phase2f-review-${runId}`;
const testMetadata = {
  provisional_patient_id: `P-PHASE2F-${runId}`,
  doctor_name: "Dr. Phase2F",
  photographer_name: "Verifier Phase2F",
  notes: `Phase2-F review verification ${runId}`
};

const reviewColumns = [
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

const inserted = await insertPendingPhoto();
console.log(`Inserted pending photo: ${inserted.id}`);

const saved = await saveReviewMetadata(inserted.id);
assertEqual(saved.provisional_patient_id, testMetadata.provisional_patient_id, "provisional_patient_id");
assertEqual(saved.doctor_name, testMetadata.doctor_name, "doctor_name");
assertEqual(saved.photographer_name, testMetadata.photographer_name, "photographer_name");
assertEqual(saved.notes, testMetadata.notes, "notes");
assertPresent(saved.reviewed_at, "reviewed_at after save");
console.log("Verified metadata save fields.");

const approved = await approvePhoto(inserted.id);
assertEqual(approved.review_status, "approved", "review_status");
assertEqual(approved.export_status, "ready_for_export", "export_status");
assertPresent(approved.reviewed_at, "reviewed_at after approval");
assertPresent(approved.approved_at, "approved_at");
console.log("Verified approval fields.");

const { data: pendingAfterApproval, error: pendingError } = await supabase
  .from("photos")
  .select("id")
  .eq("id", inserted.id)
  .eq("review_status", "pending");

if (pendingError) {
  throw new Error(`Pending check failed: ${pendingError.message}`);
}

if ((pendingAfterApproval ?? []).length !== 0) {
  throw new Error("Approved photo is still returned as pending.");
}

console.log("Verified approved photo is no longer pending.");
console.log(JSON.stringify({ photo_id: approved.id, file_hash: approved.file_hash }, null, 2));

async function insertPendingPhoto() {
  const { data, error } = await supabase
    .from("photos")
    .insert({
      original_filename: `phase2f-review-${runId}.jpg`,
      original_path: `C:/Phase2F/phase2f-review-${runId}.jpg`,
      file_hash: fileHash,
      file_size: 123456,
      mime_type: "image/jpeg",
      imported_at: new Date().toISOString(),
      review_status: "pending",
      export_status: "not_exported",
      notes: "Phase2-F pending verification row"
    })
    .select(reviewColumns)
    .single();

  if (error) {
    throw new Error(`Insert failed: ${error.message}`);
  }

  return data;
}

async function saveReviewMetadata(photoId) {
  const { data, error } = await supabase
    .from("photos")
    .update({
      ...testMetadata,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", photoId)
    .select(reviewColumns)
    .single();

  if (error) {
    throw new Error(`Metadata save failed: ${error.message}`);
  }

  return data;
}

async function approvePhoto(photoId) {
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
    .select(reviewColumns)
    .single();

  if (error) {
    throw new Error(`Approval failed: ${error.message}`);
  }

  return data;
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
