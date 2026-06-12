import { hasSupabaseConfig, supabase } from "./supabase";

export type StaffMember = {
  id: string;
  name: string;
  role: string | null;
};

export type StaffResult = {
  status: "success" | "error" | "not-configured";
  staff: StaffMember[];
  message: string;
};

type StaffRow = {
  id: string;
  name?: string | null;
  role?: string | null;
};

export async function fetchStaffMembers(): Promise<StaffResult> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      staff: [],
      message: "Supabase未設定のためスタッフ一覧を取得できません"
    };
  }

  const primaryResult = await supabase.from("staff").select("id,name,role").order("name", { ascending: true });

  if (!primaryResult.error) {
    return {
      status: "success",
      staff: normalizeStaffRows((primaryResult.data ?? []) as StaffRow[]),
      message: "スタッフ一覧を取得しました"
    };
  }

  const fallbackResult = await supabase.from("staff").select("id,name").order("name", { ascending: true });

  if (!fallbackResult.error) {
    return {
      status: "success",
      staff: normalizeStaffRows((fallbackResult.data ?? []) as StaffRow[]),
      message: "スタッフ一覧を取得しました"
    };
  }

  return {
    status: "error",
    staff: [],
    message: primaryResult.error.message
  };
}

function normalizeStaffRows(rows: StaffRow[]) {
  return rows.map((row) => ({
    id: row.id,
    name: row.name?.trim() || row.id,
    role: row.role?.trim() || null
  }));
}
