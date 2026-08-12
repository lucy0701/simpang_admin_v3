import "server-only";

import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 관리자 행위 감사 로그(admin_audit_log).
 *
 * 기록 실패가 원래 작업을 되돌리게 두지 않는다. 초대 발급이 끝났는데 로그를 못
 * 남겼다고 사용자에게 에러를 띄우면 같은 초대를 또 만들게 된다. 대신 서버 로그로
 * 남겨 유실을 눈에 보이게 한다.
 */

export type AuditAction =
  | "operator.invite"
  | "operator.invite.revoke"
  | "operator.create"
  | "content.create"
  | "content.publish"
  | "content.feature"
  | "content.delete";

type AuditEntry = {
  operatorId: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string | number;
  detail?: string;
};

/**
 * 요청자 IP. 컬럼 타입이 inet 이라 형식이 어긋나면 INSERT 가 통째로 실패하므로,
 * x-forwarded-for 의 첫 항목만 쓰고 모양이 아니면 버린다.
 */
async function requestIp(): Promise<string | null> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    const candidate = (forwarded ?? headerList.get("x-real-ip") ?? "")
      .split(",")[0]
      .trim();

    if (!candidate) return null;
    // IPv4 점 표기 또는 IPv6 콜론 표기만 통과시킨다.
    const looksLikeIp = /^[0-9.]+$/.test(candidate) || candidate.includes(":");
    return looksLikeIp ? candidate : null;
  } catch {
    return null;
  }
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("admin_audit_log").insert({
      operator_id: entry.operatorId,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId != null ? String(entry.targetId) : null,
      detail: entry.detail ?? null,
      ip_address: await requestIp(),
    });

    if (error) {
      console.error("[audit] 기록 실패", entry.action, error.message);
    }
  } catch (error) {
    console.error("[audit] 기록 실패", entry.action, error);
  }
}
