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
  if (!hasSupabaseConfig) {
    return {
      status: "not-configured",
      message: ".env に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください"
    };
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`
      }
    });

    if (!response.ok) {
      return {
        status: "failed",
        message: `Supabase API から ${response.status} が返されました`
      };
    }

    return {
      status: "success",
      message: "Supabase プロジェクトに接続できました"
    };
  } catch {
    return {
      status: "failed",
      message: "Supabase API に到達できませんでした"
    };
  }
}
