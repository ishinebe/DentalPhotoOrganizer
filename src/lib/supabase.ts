import { createClient } from "@supabase/supabase-js";

type SupabaseConnectionStatus = {
  status: "success" | "failed" | "not-configured";
  message: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : null;

export async function getSupabaseConnectionStatus(): Promise<SupabaseConnectionStatus> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      status: "not-configured",
      message: ".env に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください"
    };
  }

  try {
    const { error } = await supabase.from("photos").select("id").limit(1);

    if (error) {
      return {
        status: "failed",
        message: `Supabaseへの接続確認に失敗しました: ${error.message}`
      };
    }

    return {
      status: "success",
      message: "Supabaseに接続できました"
    };
  } catch {
    return {
      status: "failed",
      message: "Supabaseへの接続確認中にエラーが発生しました"
    };
  }
}
