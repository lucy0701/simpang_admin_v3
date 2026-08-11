import "server-only";

import { randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 운영자 초대. 스키마의 operator_invite 를 그대로 쓴다.
 *
 * 어드민에는 자체 회원가입 경로가 없다. 계정은 오직 이 초대 링크로만 만들어진다.
 * 초대 테이블은 RLS 정책이 없어 service_role 로만 접근된다.
 */

/** 스키마 주석대로 3일. */
const INVITE_TTL_MS = 3 * 24 * 60 * 60 * 1000;

export type InviteRole = { id: number; code: string; name: string };

export type PendingInvite = {
  id: number;
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  role: InviteRole | null;
  invitedBy: string | null;
};

/** 수락 페이지가 보여줄 최소 정보. 토큰 자체는 다시 노출하지 않는다. */
export type ValidInvite = {
  id: number;
  email: string;
  roleId: number | null;
  roleName: string | null;
};

export type InviteError =
  | "not_found"
  | "already_accepted"
  | "expired"
  | "email_taken"
  | "unknown";

function unwrap<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function listRoles(): Promise<InviteRole[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("role").select("id, code, name").order("id");
  return data ?? [];
}

/**
 * 초대 생성. 토큰은 추측 불가능해야 하므로 CSPRNG 로 32바이트를 뽑는다.
 * 반환된 토큰으로 만든 링크를 초대 대상에게 전달한다.
 */
export async function createInvite(params: {
  email: string;
  roleId: number | null;
  invitedBy: string;
}): Promise<{ token: string } | { error: InviteError; message: string }> {
  const admin = createAdminClient();
  const email = params.email.trim().toLowerCase();

  // 이미 운영자로 등록된 이메일은 초대할 수 없다.
  const { data: existing } = await admin
    .from("operator")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return { error: "email_taken", message: "이미 등록된 운영자 이메일입니다." };
  }

  // 같은 이메일로 살아있는 초대가 있으면 새로 만들지 않고 만료시킨 뒤 재발급한다.
  await admin
    .from("operator_invite")
    .update({ status: "expired" })
    .eq("email", email)
    .eq("status", "pending");

  const token = randomBytes(32).toString("base64url");
  const { error } = await admin.from("operator_invite").insert({
    email,
    role_id: params.roleId,
    invited_by: params.invitedBy,
    token,
    status: "pending",
    expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
  });

  if (error) {
    return { error: "unknown", message: error.message };
  }

  return { token };
}

/** 대기 중인 초대 목록. 만료된 것은 상태를 정리한 뒤 제외한다. */
export async function listPendingInvites(): Promise<PendingInvite[]> {
  const admin = createAdminClient();

  // 지난 초대를 먼저 만료 처리한다. 스키마에 자동 만료 잡이 없으므로 조회 시점에 정리한다.
  await admin
    .from("operator_invite")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());

  const { data } = await admin
    .from("operator_invite")
    .select(
      "id, email, token, expires_at, created_at, role:role_id (id, code, name), inviter:invited_by (name)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    role: unwrap<InviteRole>(row.role),
    invitedBy: unwrap<{ name: string }>(row.inviter)?.name ?? null,
  }));
}

export async function revokeInvite(inviteId: number): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("operator_invite")
    .update({ status: "expired" })
    .eq("id", inviteId)
    .eq("status", "pending");
}

/** 수락 페이지 진입 시 토큰 검증. 상태별로 구분된 사유를 돌려준다. */
export async function findInviteByToken(
  token: string,
): Promise<{ invite: ValidInvite } | { error: InviteError }> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("operator_invite")
    .select("id, email, status, expires_at, role_id, role:role_id (name)")
    .eq("token", token)
    .maybeSingle();

  if (!data) return { error: "not_found" };
  if (data.status === "accepted") return { error: "already_accepted" };
  if (data.status === "expired") return { error: "expired" };
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await admin
      .from("operator_invite")
      .update({ status: "expired" })
      .eq("id", data.id);
    return { error: "expired" };
  }

  return {
    invite: {
      id: data.id,
      email: data.email,
      roleId: data.role_id,
      roleName: unwrap<{ name: string }>(data.role)?.name ?? null,
    },
  };
}

/**
 * 초대 수락 — auth 사용자와 operator 레코드를 만든다.
 *
 * 초대를 먼저 소비(pending → accepted)한다. 같은 링크를 두 사람이 동시에 열어도
 * 조건부 update 가 한 번만 성공하므로 계정이 두 개 생기지 않는다.
 * 이후 단계가 실패하면 pending 으로 되돌려 링크를 다시 쓸 수 있게 한다.
 */
export async function acceptInvite(params: {
  token: string;
  name: string;
  password: string;
}): Promise<{ email: string } | { error: InviteError; message: string }> {
  const admin = createAdminClient();

  const found = await findInviteByToken(params.token);
  if ("error" in found) {
    return { error: found.error, message: inviteErrorMessage(found.error) };
  }
  const { invite } = found;

  const { data: claimed } = await admin
    .from("operator_invite")
    .update({ status: "accepted" })
    .eq("id", invite.id)
    .eq("status", "pending")
    .select("id");

  if (!claimed || claimed.length === 0) {
    return {
      error: "already_accepted",
      message: "이미 사용된 초대입니다.",
    };
  }

  const revert = async () => {
    await admin
      .from("operator_invite")
      .update({ status: "pending" })
      .eq("id", invite.id);
  };

  const { data: created, error: authError } =
    await admin.auth.admin.createUser({
      email: invite.email,
      password: params.password,
      email_confirm: true,
      user_metadata: { nickname: params.name },
    });

  if (authError || !created.user) {
    await revert();
    const alreadyRegistered = authError?.message
      ?.toLowerCase()
      .includes("already");
    return {
      error: alreadyRegistered ? "email_taken" : "unknown",
      message: alreadyRegistered
        ? "이미 가입된 이메일입니다. 관리자에게 문의하세요."
        : (authError?.message ?? "계정을 만들지 못했습니다."),
    };
  }

  const { error: operatorError } = await admin.from("operator").insert({
    auth_user_id: created.user.id,
    name: params.name,
    email: invite.email,
    role_id: invite.roleId,
    status: "active",
  });

  if (operatorError) {
    // 운영자 레코드가 없으면 로그인해도 접근이 막히므로 auth 사용자까지 되돌린다.
    await admin.auth.admin.deleteUser(created.user.id);
    await revert();
    return { error: "unknown", message: operatorError.message };
  }

  return { email: invite.email };
}

export function inviteErrorMessage(error: InviteError): string {
  switch (error) {
    case "not_found":
      return "유효하지 않은 초대 링크입니다.";
    case "already_accepted":
      return "이미 사용된 초대입니다. 로그인 화면에서 로그인해주세요.";
    case "expired":
      return "만료된 초대입니다. 초대한 운영자에게 재발급을 요청하세요.";
    case "email_taken":
      return "이미 등록된 이메일입니다.";
    default:
      return "초대를 처리하지 못했습니다.";
  }
}
