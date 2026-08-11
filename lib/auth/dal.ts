import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Data Access Layer.
 *
 * 인가 판단은 전부 여기서 한다. proxy.ts 의 검사는 낙관적(optimistic) 리다이렉트일 뿐
 * 보안 경계가 아니다 — 실제 경계는 이 모듈이다.
 *
 * 각 함수는 `cache()` 로 감싸서 한 번의 렌더 패스 안에서 중복 조회를 막는다.
 */

export type Session = {
  userId: string;
  email: string | null;
};

export type Operator = {
  id: string;
  name: string;
  email: string;
  status: string;
  role: { id: number; code: string; name: string } | null;
};

/** JWT 를 검증해 세션을 얻는다. 미로그인이면 null. */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();

  // getClaims() 는 JWT 서명을 검증한다. getSession() 은 쿠키를 그대로 믿으므로 쓰지 않는다.
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;

  return {
    userId: data.claims.sub,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
  };
});

/**
 * 로그인한 auth 사용자에 연결된 운영자 레코드.
 * operator 테이블은 RLS 정책이 없어 service_role 로만 읽을 수 있다.
 */
export const getOperator = cache(async (): Promise<Operator | null> => {
  const session = await getSession();
  if (!session) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("operator")
    .select("id, name, email, status, role:role_id (id, code, name)")
    .eq("auth_user_id", session.userId)
    .maybeSingle();

  if (error || !data) return null;
  // 로그인은 됐지만 비활성/초대 상태인 운영자는 접근을 막는다.
  if (data.status !== "active") return null;

  const role = Array.isArray(data.role) ? data.role[0] : data.role;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    status: data.status,
    role: role ?? null,
  };
});

/** 운영자가 아니면 로그인 페이지로 보낸다. 보호된 레이아웃·액션의 진입점. */
export const requireOperator = cache(async (): Promise<Operator> => {
  const operator = await getOperator();
  if (!operator) redirect("/login");
  return operator;
});

/**
 * 현재 운영자의 role 에 `allow` 로 걸린 권한 코드 집합.
 * approval_required / extra_grant 는 별도 플로우(approval_request,
 * pii_access_grant)로 처리해야 하므로 여기서는 제외한다.
 */
export const getPermissionCodes = cache(async (): Promise<Set<string>> => {
  const operator = await getOperator();
  if (!operator?.role) return new Set();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("role_permission")
    .select("effect, permission:permission_id (code)")
    .eq("role_id", operator.role.id)
    .eq("effect", "allow");

  if (error || !data) return new Set();

  const codes = data.flatMap((row) => {
    const permission = Array.isArray(row.permission)
      ? row.permission[0]
      : row.permission;
    return permission?.code ? [permission.code as string] : [];
  });

  return new Set(codes);
});

/** 권한 체크. 예: `await can("content.publish")` */
export async function can(permissionCode: string): Promise<boolean> {
  const codes = await getPermissionCodes();
  return codes.has(permissionCode);
}

/** 권한이 없으면 로그인/대시보드로 튕기는 대신 명시적으로 실패시킨다. */
export async function requirePermission(permissionCode: string): Promise<void> {
  if (!(await can(permissionCode))) {
    throw new Error(`권한이 없습니다: ${permissionCode}`);
  }
}
