"use server";

import { revalidatePath } from "next/cache";

import { requireOperator } from "@/lib/auth/dal";
import { createInvite, revokeInvite } from "@/lib/auth/invite";

export type InviteFormState = { error?: string; inviteUrl?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteOperator(
  _prevState: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  // Server Action 은 별도의 진입점이라 여기서 다시 인가를 확인한다.
  const operator = await requireOperator();

  const email = String(formData.get("email") ?? "").trim();
  const roleIdRaw = String(formData.get("roleId") ?? "");

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "올바른 이메일 주소를 입력해주세요." };
  }

  const result = await createInvite({
    email,
    roleId: roleIdRaw ? Number(roleIdRaw) : null,
    invitedBy: operator.id,
  });

  if ("error" in result) return { error: result.message };

  revalidatePath("/operators");
  return { inviteUrl: `/invite/${result.token}` };
}

export async function revoke(formData: FormData) {
  await requireOperator();

  const inviteId = Number(formData.get("inviteId"));
  if (!Number.isFinite(inviteId)) return;

  await revokeInvite(inviteId);
  revalidatePath("/operators");
}
