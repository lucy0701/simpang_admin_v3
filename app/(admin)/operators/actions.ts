"use server";

import { revalidatePath } from "next/cache";

import { recordAudit } from "@/lib/auth/audit";
import { checkPermission, requireOperator } from "@/lib/auth/dal";
import { createInvite, listRoles, revokeInvite } from "@/lib/auth/invite";

export type InviteFormState = { error?: string; inviteUrl?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteOperator(
  _prevState: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  // Server Action 은 별도의 진입점이라 화면에서 버튼을 숨겼더라도 여기서 다시 막는다.
  const operator = await requireOperator();
  const permission = await checkPermission("operator.invite");
  if (!permission.allowed) return { error: permission.reason };

  const email = String(formData.get("email") ?? "").trim();
  const roleIdRaw = String(formData.get("roleId") ?? "");
  const roleId = roleIdRaw ? Number(roleIdRaw) : null;

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "올바른 이메일 주소를 입력해주세요." };
  }

  const result = await createInvite({
    email,
    roleId,
    invitedBy: operator.id,
  });

  if ("error" in result) return { error: result.message };

  const roleName = roleId
    ? ((await listRoles()).find((role) => role.id === roleId)?.name ?? null)
    : null;

  await recordAudit({
    operatorId: operator.id,
    action: "operator.invite",
    targetType: "operator_invite",
    targetId: result.inviteId,
    detail: `초대 발급: ${result.email}${roleName ? ` (${roleName})` : ""}`,
  });

  revalidatePath("/operators");
  return { inviteUrl: `/invite/${result.token}` };
}

export async function revoke(formData: FormData) {
  const operator = await requireOperator();
  const permission = await checkPermission("operator.invite");
  if (!permission.allowed) return;

  const inviteId = Number(formData.get("inviteId"));
  if (!Number.isFinite(inviteId)) return;

  const email = await revokeInvite(inviteId);
  // 이미 취소·수락된 초대면 email 이 null 이다. 그 경우 기록할 사건이 없다.
  if (email) {
    await recordAudit({
      operatorId: operator.id,
      action: "operator.invite.revoke",
      targetType: "operator_invite",
      targetId: inviteId,
      detail: `초대 취소: ${email}`,
    });
  }

  revalidatePath("/operators");
}
