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
/** JWT 형식 키의 payload 를 꺼낸다. 신형 sb_secret_ 키는 JWT 가 아니라 null 을 준다. */
function decodeJwtPayload(key: string): { role?: string } | null {
  const segments = key.split(".");
  if (segments.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(segments[1], "base64url").toString());
  } catch {
    return null;
  }
}

/**
 * anon 키를 service_role 자리에 넣는 실수를 잡는다.
 *
 * 이 경우 RLS 정책이 없는 어드민 테이블(operator, role ...)이 전부 빈 결과로 보인다.
 * 에러가 아니라 "행 0개" 로 돌아오기 때문에, 증상은 "로그인이 안 된다" 로만 나타나
 * 원인을 찾기가 매우 어렵다. 그래서 클라이언트를 만들 때 미리 막는다.
 */
function assertServiceRoleKey(key: string): void {
  const hint =
    "Supabase 대시보드 > Project Settings > API 의 service_role (secret) 키를 .env.local 의 SUPABASE_SERVICE_ROLE_KEY 에 넣어주세요.";

  if (key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY 가 anon 키와 동일합니다. ${hint}`,
    );
  }

  const role = decodeJwtPayload(key)?.role;
  if (role && role !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY 의 role 이 '${role}' 입니다. service_role 이어야 합니다. ${hint}`,
    );
  }
}

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

  assertServiceRoleKey(serviceRoleKey);

  cached = createClient<Database>(url, serviceRoleKey, {
    auth: {
      // 서버 전용이라 세션을 저장하거나 갱신할 필요가 없다.
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}
