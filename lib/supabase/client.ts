import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { publicSupabaseConfig } from "./env";

/**
 * Client Component 전용 Supabase 클라이언트.
 * 세션은 쿠키에 저장되므로 서버 쪽 클라이언트와 그대로 공유된다.
 */
export function createClient() {
  const { url, anonKey } = publicSupabaseConfig();
  return createBrowserClient<Database>(url, anonKey);
}
