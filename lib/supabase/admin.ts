import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { publicSupabaseConfig } from "./env";

/**
 * service_role 클라이언트 — RLS 를 우회한다.
 *
 * playground_schema.sql 의 운영자 테이블(operator, role, permission,
 * admin_audit_log ...)은 RLS 만 켜고 정책을 두지 않아 service_role 로만 접근된다.
 * 따라서 어드민 조회/변경은 이 클라이언트를 써야 한다.
 *
 * 절대 Client Component 에서 import 하지 말 것. `server-only` 가 이를 강제한다.
 */
let cached: ReturnType<typeof createClient<Database>> | undefined;

export function createAdminClient() {
  if (cached) return cached;

  // URL 검증은 publicSupabaseConfig 에 모아둔다.
  const { url } = publicSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "환경변수 SUPABASE_SERVICE_ROLE_KEY 가 없습니다. Supabase 대시보드 > Project Settings > API 에서 확인해 .env.local 에 채워주세요.",
    );
  }

  cached = createClient<Database>(url, serviceRoleKey, {
    auth: {
      // 서버 전용이라 세션을 저장하거나 갱신할 필요가 없다.
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}
