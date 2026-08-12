import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 화면용 조회. 어드민 테이블은 RLS 정책이 없어 service_role 로만 읽힌다.
 *
 * 목록은 전부 상한(limit)을 둔다. 회원 테이블은 수십만 행까지 자란다는 전제라
 * 상한 없이 select 하면 화면 하나가 DB 와 메모리를 모두 밀어버린다.
 */

const LIST_LIMIT = 50;

function unwrap<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * 카운트 쿼리에서 숫자만 꺼낸다.
 *
 * 테이블명을 인자로 받는 제네릭 헬퍼로 만들면 생성된 Database 타입에서
 * 컬럼 검사가 풀린다(테이블마다 빌더 제네릭이 달라 캐스팅이 필요해진다).
 * 쿼리는 호출부에서 만들고 여기서는 결과만 받아 컬럼 오타가 계속 잡히게 한다.
 */
async function count(
  query: PromiseLike<{ count: number | null }>,
): Promise<number> {
  return (await query).count ?? 0;
}

const HEAD_COUNT = { count: "exact", head: true } as const;

function startOfToday(): string {
  return new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
}

/* ---------------------------------- 콘텐츠 --------------------------------- */

export const CONTENT_TYPE_LABEL: Record<string, string> = {
  // DB enum 값은 스키마의 psychotest 그대로 두고 표시 이름만 MBTI 로 쓴다.
  psychotest: "MBTI",
  minigame: "미니게임",
  multigame: "멀티게임",
};

export const CONTENT_STATUS_LABEL: Record<string, string> = {
  draft: "작성중",
  review: "검수 대기",
  public: "공개",
  private: "비공개",
};

export type ContentRow = {
  id: number;
  title: string;
  contentType: string;
  status: string;
  likeCount: number;
  commentCount: number;
  playCount: number;
  isHomeFeatured: boolean;
  createdAt: string;
};

export async function listContents(): Promise<ContentRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("content")
    .select(
      "id, title, content_type, status, like_count, comment_count, play_count, is_home_featured, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    contentType: row.content_type,
    status: row.status,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    playCount: row.play_count,
    isHomeFeatured: row.is_home_featured,
    createdAt: row.created_at,
  }));
}

export async function contentSummary() {
  const admin = createAdminClient();
  const base = () => admin.from("content").select("id", HEAD_COUNT);

  const [total, publicCount, review, priv] = await Promise.all([
    count(base()),
    count(base().eq("status", "public")),
    count(base().eq("status", "review")),
    count(base().eq("status", "private")),
  ]);
  return { total, publicCount, review, private: priv };
}

/* ---------------------------------- 회원 ---------------------------------- */

export const PROVIDER_LABEL: Record<string, string> = {
  kakao: "카카오",
  google: "구글",
  naver: "네이버",
  local: "자체",
};

export type MemberRow = {
  id: string;
  nickname: string | null;
  memberNo: string | null;
  provider: string | null;
  tier: string;
  status: string;
  playCount: number;
  commentCount: number;
  reportReceived: number;
  lastLoginAt: string | null;
};

export async function listMembers(): Promise<MemberRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select(
      "id, nickname, member_no, provider, tier, status, play_count, comment_count, report_received, last_login_at",
    )
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  return (data ?? []).map((row) => ({
    id: row.id,
    nickname: row.nickname,
    memberNo: row.member_no,
    provider: row.provider,
    tier: row.tier,
    status: row.status,
    playCount: row.play_count,
    commentCount: row.comment_count,
    reportReceived: row.report_received,
    lastLoginAt: row.last_login_at,
  }));
}

export async function memberSummary() {
  const admin = createAdminClient();
  const base = () => admin.from("profiles").select("id", HEAD_COUNT);

  const [total, today, suspended] = await Promise.all([
    count(base()),
    count(base().gte("created_at", startOfToday())),
    count(base().in("status", ["suspended", "banned"])),
  ]);
  return { total, today, suspended };
}

/* ------------------------------- 댓글 · 신고 ------------------------------- */

export const REPORT_REASON_LABEL: Record<string, string> = {
  abuse: "욕설 · 비방",
  spam: "스팸 · 광고",
  etc: "기타",
};

export type ReportRow = {
  id: number;
  reason: string;
  createdAt: string;
  commentBody: string | null;
  commentStatus: string | null;
  commentReportCount: number;
  authorNickname: string | null;
  authorProvider: string | null;
  contentTitle: string | null;
};

export async function listPendingReports(): Promise<ReportRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("comment_report")
    .select(
      "id, reason, created_at, comment:comment_id (body, status, report_count, author:member_id (nickname, provider), content:content_id (title))",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(LIST_LIMIT);

  return (data ?? []).map((row) => {
    const comment = unwrap<{
      body: string;
      status: string;
      report_count: number;
      author: unknown;
      content: unknown;
    }>(row.comment);
    const author = unwrap<{ nickname: string | null; provider: string | null }>(
      comment?.author as never,
    );
    const content = unwrap<{ title: string }>(comment?.content as never);

    return {
      id: row.id,
      reason: row.reason,
      createdAt: row.created_at,
      commentBody: comment?.body ?? null,
      commentStatus: comment?.status ?? null,
      commentReportCount: comment?.report_count ?? 0,
      authorNickname: author?.nickname ?? null,
      authorProvider: author?.provider ?? null,
      contentTitle: content?.title ?? null,
    };
  });
}

export async function reportSummary() {
  const admin = createAdminClient();
  const reports = () =>
    admin.from("comment_report").select("id", HEAD_COUNT).eq("status", "pending");

  const [pending, abuse, spam, etc, commentsToday] = await Promise.all([
    count(reports()),
    count(reports().eq("reason", "abuse")),
    count(reports().eq("reason", "spam")),
    count(reports().eq("reason", "etc")),
    count(
      admin
        .from("comment")
        .select("id", HEAD_COUNT)
        .gte("created_at", startOfToday()),
    ),
  ]);
  return { pending, abuse, spam, etc, commentsToday };
}

/* -------------------------------- 대시보드 -------------------------------- */

export async function dashboardStats() {
  const admin = createAdminClient();
  const since = startOfToday();
  const plays = () =>
    admin.from("play_log").select("id", HEAD_COUNT).gte("started_at", since);

  // 컬럼명이 테이블마다 다르다: play_log 는 started_at, share_log 는 created_at.
  const [playCount, completedPlays, shares, signups, reports, contents] =
    await Promise.all([
      count(plays()),
      count(plays().eq("is_completed", true)),
      count(
        admin.from("share_log").select("id", HEAD_COUNT).gte("created_at", since),
      ),
      count(
        admin.from("profiles").select("id", HEAD_COUNT).gte("created_at", since),
      ),
      count(
        admin
          .from("comment_report")
          .select("id", HEAD_COUNT)
          .eq("status", "pending"),
      ),
      count(
        admin.from("content").select("id", HEAD_COUNT).eq("status", "public"),
      ),
    ]);

  return {
    plays: playCount,
    completedPlays,
    shares,
    signups,
    reports,
    contents,
  };
}

/** 인기 콘텐츠. play_count 는 집계 캐시 컬럼이라 로그 조인 없이 정렬할 수 있다. */
export async function topContents(limit = 5): Promise<ContentRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("content")
    .select(
      "id, title, content_type, status, like_count, comment_count, play_count, is_home_featured, created_at",
    )
    .eq("status", "public")
    .order("play_count", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    contentType: row.content_type,
    status: row.status,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    playCount: row.play_count,
    isHomeFeatured: row.is_home_featured,
    createdAt: row.created_at,
  }));
}

/* -------------------------------- 활동 로그 -------------------------------- */

export type AuditRow = {
  id: number;
  action: string;
  detail: string | null;
  createdAt: string;
  operatorName: string | null;
};

export async function listRecentAudit(limit = 8): Promise<AuditRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_audit_log")
    .select("id, action, detail, created_at, operator:operator_id (name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    detail: row.detail,
    createdAt: row.created_at,
    operatorName: unwrap<{ name: string }>(row.operator)?.name ?? null,
  }));
}

/* ------------------------------ 권한 매트릭스 ------------------------------ */

export type MatrixCell = "allow" | "deny" | "approval_required" | "extra_grant";

export type PermissionMatrix = {
  roles: { id: number; code: string; name: string }[];
  permissions: { id: number; code: string; name: string }[];
  /** `${roleId}:${permissionId}` → effect. 없는 조합은 deny 로 본다. */
  cells: Map<string, MatrixCell>;
};

export async function permissionMatrix(): Promise<PermissionMatrix> {
  const admin = createAdminClient();

  const [roles, permissions, links] = await Promise.all([
    admin.from("role").select("id, code, name").order("id"),
    admin.from("permission").select("id, code, name").order("id"),
    admin.from("role_permission").select("role_id, permission_id, effect"),
  ]);

  const cells = new Map<string, MatrixCell>();
  for (const link of links.data ?? []) {
    cells.set(`${link.role_id}:${link.permission_id}`, link.effect as MatrixCell);
  }

  return {
    roles: roles.data ?? [],
    permissions: permissions.data ?? [],
    cells,
  };
}

export type OperatorRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  is2fa: boolean;
  isExternal: boolean;
  lastAccessAt: string | null;
  roleName: string | null;
};

export async function listOperators(): Promise<OperatorRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("operator")
    .select(
      "id, name, email, status, is_2fa_enabled, is_external, last_access_at, role:role_id (name)",
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    is2fa: row.is_2fa_enabled,
    isExternal: row.is_external,
    lastAccessAt: row.last_access_at,
    roleName: unwrap<{ name: string }>(row.role)?.name ?? null,
  }));
}

/** 유효한 개인정보 열람 권한을 가진 운영자 수 (시안의 "개인정보 취급자"). */
export async function piiHandlerCount(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("pii_access_grant")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());

  return count ?? 0;
}
