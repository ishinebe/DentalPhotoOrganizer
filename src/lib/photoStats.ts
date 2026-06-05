import { hasSupabaseConfig, supabase } from "./supabase";

export type DashboardPhotoStats = {
  totalPhotos: number;
  pendingReviews: number;
  importedToday: number;
  approvedPhotos: number;
};

export type DashboardStatsResult = {
  status: "loading" | "success" | "error" | "not-configured";
  stats: DashboardPhotoStats;
  message: string;
};

const emptyStats: DashboardPhotoStats = {
  totalPhotos: 0,
  pendingReviews: 0,
  importedToday: 0,
  approvedPhotos: 0
};

export async function fetchDashboardPhotoStats(): Promise<DashboardStatsResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      stats: emptyStats,
      message: ".env が未設定のため、Dashboard は0件として表示しています"
    };
  }

  try {
    const startOfToday = getStartOfTodayIsoString();

    const [totalPhotos, pendingReviews, importedToday, approvedPhotos] = await Promise.all([
      getTotalPhotoCount(),
      getReviewStatusCount("pending"),
      getImportedTodayCount(startOfToday),
      getReviewStatusCount("approved")
    ]);

    return {
      status: "success",
      stats: {
        totalPhotos,
        pendingReviews,
        importedToday,
        approvedPhotos
      },
      message: "Supabase の photos テーブルから統計情報を取得しました"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "統計情報の取得に失敗しました";

    return {
      status: "error",
      stats: emptyStats,
      message
    };
  }
}

async function getTotalPhotoCount() {
  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase.from("photos").select("id", {
    count: "exact",
    head: true
  });

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function getReviewStatusCount(status: "pending" | "approved") {
  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("photos")
    .select("id", {
      count: "exact",
      head: true
    })
    .eq("review_status", status);

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
