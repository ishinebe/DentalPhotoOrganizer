import { hasSupabaseConfig, supabase } from "./supabase";

export type DashboardPhotoStats = {
  pendingReviewGroups: number;
  readyForExportGroups: number;
  importedToday: number;
};

export type DashboardStatsResult = {
  status: "loading" | "success" | "error" | "not-configured";
  stats: DashboardPhotoStats;
};

const emptyStats: DashboardPhotoStats = {
  pendingReviewGroups: 0,
  readyForExportGroups: 0,
  importedToday: 0
};

export async function fetchDashboardPhotoStats(): Promise<DashboardStatsResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      stats: emptyStats
    };
  }

  try {
    const startOfToday = getStartOfTodayIsoString();

    const [pendingReviewGroups, readyForExportGroups, importedToday] = await Promise.all([
      getPendingReviewGroupCount(),
      getReadyForExportGroupCount(),
      getImportedTodayCount(startOfToday)
    ]);

    return {
      status: "success",
      stats: {
        pendingReviewGroups,
        readyForExportGroups,
        importedToday
      }
    };
  } catch {
    return {
      status: "error",
      stats: emptyStats
    };
  }
}

async function getPendingReviewGroupCount() {
  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("photo_groups")
    .select("id", {
      count: "exact",
      head: true
    })
    .eq("review_status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function getReadyForExportGroupCount() {
  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("photo_groups")
    .select("id", {
      count: "exact",
      head: true
    })
    .eq("review_status", "approved")
    .eq("export_status", "ready_for_export");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function getImportedTodayCount(startOfToday: string) {
  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("photos")
    .select("id", {
      count: "exact",
      head: true
    })
    .gte("imported_at", startOfToday);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

function getStartOfTodayIsoString() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return startOfToday.toISOString();
}
