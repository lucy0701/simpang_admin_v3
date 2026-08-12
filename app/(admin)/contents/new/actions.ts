"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/auth/audit";
import { checkPermission, requireOperator } from "@/lib/auth/dal";
import {
  createPsychotest,
  validatePsychotest,
  type PsychotestInput,
} from "@/lib/data/psychotest";

export type CreateState = { errors?: string[]; warnings?: string[] };

/**
 * 폼은 문항·선택지·결과 유형이 동적으로 늘어나서 FormData 로 평탄화하면
 * 인덱스 파싱이 지저분해진다. 클라이언트에서 JSON 한 덩어리로 보내고
 * 여기서 형태를 검사한다. 신뢰 경계는 이 함수다.
 */
function parsePayload(raw: FormDataEntryValue | null): PsychotestInput | null {
  if (typeof raw !== "string") return null;

  try {
    const parsed = JSON.parse(raw) as PsychotestInput;
    if (!Array.isArray(parsed.questions)) return null;
    if (!Array.isArray(parsed.resultTypes)) return null;
    if (!["draft", "review", "public"].includes(parsed.status)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function createContent(
  _prevState: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const operator = await requireOperator();

  // 작성은 content.edit, 바로 공개는 content.publish 가 있어야 한다.
  const canEdit = await checkPermission("content.edit");
  if (!canEdit.allowed) return { errors: [canEdit.reason] };

  const input = parsePayload(formData.get("payload"));
  if (!input) return { errors: ["입력을 읽지 못했습니다. 다시 시도해주세요."] };

  if (input.status === "public") {
    const canPublish = await checkPermission("content.publish");
    if (!canPublish.allowed) {
      return {
        errors: [
          `바로 공개할 수 없습니다. ${canPublish.reason} 검수 대기로 저장한 뒤 진행하세요.`,
        ],
      };
    }
  }

  const { errors, warnings } = validatePsychotest(input);
  if (errors.length > 0) return { errors, warnings };

  const result = await createPsychotest(input, operator.id);
  if ("error" in result) return { errors: [result.error], warnings };

  await recordAudit({
    operatorId: operator.id,
    action: "content.create",
    targetType: "content",
    targetId: result.contentId,
    detail: `MBTI 등록: ${input.title} (문항 ${input.questions.length} · 결과 유형 ${input.resultTypes.length} · ${input.status})`,
  });

  revalidatePath("/contents");
  redirect("/contents");
}
