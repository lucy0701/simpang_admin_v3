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

export type PermissionEffect =
  | "allow"
  | "deny"
  | "approval_required"
  | "extra_grant";

/**
 * 권한 판정 결과.
 *
 * 왜 boolean 이 아닌가: 스키마의 role_permission.effect 는 4-state 다.
 * "안 된다" 안에 세 가지 다른 상황이 섞여 있고, 화면에서 안내가 달라져야 한다.
 *   deny              → 역할 자체에 없는 권한. 할 수 있는 게 없다
 *   approval_required → 승인 요청을 올리면 된다 (approval_request)
 *   extra_grant       → 별도 권한을 부여받으면 된다 (pii_access_grant)
 */
export type PermissionCheck =
  | { allowed: true; via: "role" | "approval" | "grant" }
  | { allowed: false; effect: PermissionEffect; reason: string };

/** 현재 운영자 역할의 권한코드 → effect 매핑. */
export const getRolePermissions = cache(
  async (): Promise<Map<string, PermissionEffect>> => {
    const operator = await getOperator();
    if (!operator?.role) return new Map();

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("role_permission")
      .select("effect, permission:permission_id (code)")
      .eq("role_id", operator.role.id);

    if (error || !data) return new Map();

    const entries = data.flatMap((row) => {
      const permission = Array.isArray(row.permission)
        ? row.permission[0]
        : row.permission;
      if (!permission?.code) return [];
      return [
        [permission.code as string, row.effect as PermissionEffect],
      ] as const;
    });

    return new Map(entries);
  }
);

/** 유효한 개인정보 열람 권한(pii_access_grant)이 있는지. */
const hasActivePiiGrant = cache(async (): Promise<boolean> => {
  const operator = await getOperator();
  if (!operator) return false;

  const admin = createAdminClient();
  const { data } = await admin
    .from("pii_access_grant")
    .select("id")
    .eq("operator_id", operator.id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .limit(1);

  return (data?.length ?? 0) > 0;
});

/**
 * 해당 액션에 대해 승인된 요청이 있는지.
 *
 * approval_required 는 역할에 붙는 상시 권한이 아니라 건별 승인이다.
 * 그래서 대상(target)이 있으면 그 대상까지 일치해야 한다.
 */
async function hasApproval(
  actionType: string,
  target?: { type: string; id: string }
): Promise<boolean> {
  const operator = await getOperator();
  if (!operator) return false;

  const admin = createAdminClient();
  let query = admin
    .from("approval_request")
    .select("id")
    .eq("requester_id", operator.id)
    .eq("action_type", actionType)
    .eq("status", "approved");

  if (target) {
    query = query.eq("target_type", target.type).eq("target_id", target.id);
  }

  const { data } = await query.limit(1);
  return (data?.length ?? 0) > 0;
}

/**
 * 4-state 권한 판정.
 *
 * 주의: extra_grant 는 pii_access_grant 로만 확인한다. 스키마에 범용 권한부여
 * 테이블이 없고 개인정보 열람 전용 테이블만 있기 때문이다. pii.view 외의 권한에
 * extra_grant 를 걸면 부여할 수단이 없어 사실상 deny 로 동작한다.
 */
export async function checkPermission(
  permissionCode: string,
  target?: { type: string; id: string }
): Promise<PermissionCheck> {
  const effect = (await getRolePermissions()).get(permissionCode) ?? "deny";

  switch (effect) {
    case "allow":
      return { allowed: true, via: "role" };

    case "approval_required":
      return (await hasApproval(permissionCode, target))
        ? { allowed: true, via: "approval" }
        : {
            allowed: false,
            effect,
            reason: "승인이 필요한 작업입니다. 승인 요청 후 다시 시도하세요.",
          };

    case "extra_grant":
      return (await hasActivePiiGrant())
        ? { allowed: true, via: "grant" }
        : {
            allowed: false,
            effect,
            reason: "별도 권한 부여가 필요한 작업입니다.",
          };

    default:
      return {
        allowed: false,
        effect: "deny",
        reason: "이 작업에 대한 권한이 없습니다.",
      };
  }
}

/** 권한 체크. 예: `await can("content.publish")` */
export async function can(
  permissionCode: string,
  target?: { type: string; id: string }
): Promise<boolean> {
  return (await checkPermission(permissionCode, target)).allowed;
}

/** 권한이 없으면 사유를 담아 실패시킨다. */
export async function requirePermission(
  permissionCode: string,
  target?: { type: string; id: string }
): Promise<void> {
  const result = await checkPermission(permissionCode, target);
  if (!result.allowed) {
    throw new Error(result.reason);
  }
}
