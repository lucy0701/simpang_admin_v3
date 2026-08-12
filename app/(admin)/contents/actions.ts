"use server";

import { revalidatePath } from "next/cache";

import { recordAudit } from "@/lib/auth/audit";
import { checkPermission, requireOperator } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";

export type BulkState = { error?: string; done?: string };

/** 체크박스로 고른 id 들. 숫자가 아닌 값은 버린다. */
function selectedIds(formData: FormData): number[] {
  return formData
    .getAll("id")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
}

export async function bulkPublish(
  _prev: BulkState,
  formData: FormData,
): Promise<BulkState> {
  const operator = await requireOperator();
  const permission = await checkPermission("content.publish");
  if (!permission.allowed) return { error: permission.reason };

  const ids = selectedIds(formData);
  if (ids.length === 0) return { error: "선택된 콘텐츠가 없습니다." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("content")
    .update({ status: "public", published_at: new Date().toISOString() })
    .in("id", ids);

  if (error) return { error: error.message };

  await recordAudit({
    operatorId: operator.id,
    action: "content.publish",
    targetType: "content",
    targetId: ids.join(","),
    detail: `공개 전환 ${ids.length}건`,
  });

  revalidatePath("/contents");
  return { done: `${ids.length}건을 공개로 전환했습니다.` };
}

export async function bulkFeature(
  _prev: BulkState,
  formData: FormData,
): Promise<BulkState> {
  const operator = await requireOperator();
  const permission = await checkPermission("content.edit");
  if (!permission.allowed) return { error: permission.reason };

  const ids = selectedIds(formData);
  if (ids.length === 0) return { error: "선택된 콘텐츠가 없습니다." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("content")
    .update({ is_home_featured: true })
    .in("id", ids);

  if (error) return { error: error.message };

  await recordAudit({
    operatorId: operator.id,
    action: "content.feature",
    targetType: "content",
    targetId: ids.join(","),
    detail: `홈 편성 ${ids.length}건`,
  });

  revalidatePath("/contents");
  return { done: `${ids.length}건을 홈에 편성했습니다.` };
}

/**
 * 삭제는 되돌릴 수 없다. content 를 지우면 문항·결과 유형·댓글·플레이 로그가
 * on delete cascade 로 함께 사라진다. 화면에서 한 번 더 확인을 받는다.
 */
export async function bulkDelete(
  _prev: BulkState,
  formData: FormData,
): Promise<BulkState> {
  const operator = await requireOperator();
  const permission = await checkPermission("content.edit");
  if (!permission.allowed) return { error: permission.reason };

  const ids = selectedIds(formData);
  if (ids.length === 0) return { error: "선택된 콘텐츠가 없습니다." };

  const admin = createAdminClient();

  // 무엇을 지웠는지 로그에 남기려면 지우기 전에 제목을 읽어야 한다.
  const { data: targets } = await admin
    .from("content")
    .select("title")
    .in("id", ids);

  const { error } = await admin.from("content").delete().in("id", ids);
  if (error) return { error: error.message };

  await recordAudit({
    operatorId: operator.id,
    action: "content.delete",
    targetType: "content",
    targetId: ids.join(","),
    detail: `삭제 ${ids.length}건: ${(targets ?? [])
      .map((row) => row.title)
      .join(", ")}`,
  });

  revalidatePath("/contents");
  return { done: `${ids.length}건을 삭제했습니다.` };
}
