import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";
import { publicSupabaseConfig } from "./env";

/**
 * Server Component / Server Action / Route Handler 용 클라이언트.
 * 로그인한 사용자의 세션으로 동작하므로 RLS 정책이 그대로 적용된다.
 *
 * `cookies()` 는 Next 16 에서 async 이므로 이 함수도 async 다.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = publicSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component 에서는 쿠키를 쓸 수 없다.
          // 토큰 갱신은 proxy.ts 가 매 요청마다 처리하므로 무시해도 안전하다.
        }
      },
    },
  });
}
