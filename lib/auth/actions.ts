"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

/** 오픈 리다이렉트 방지: 같은 오리진의 절대경로만 허용한다. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력해주세요." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    // 계정 존재 여부가 드러나지 않도록 실패 사유는 뭉뚱그린다.
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  // 인증됐다고 끝이 아니다 — 어드민은 operator 로 등록된 활성 계정만 들어올 수 있다.
  const admin = createAdminClient();
  const { data: operator } = await admin
    .from("operator")
    .select("id, status")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (!operator || operator.status !== "active") {
    await supabase.auth.signOut();
    return { error: "운영자 권한이 없거나 비활성화된 계정입니다." };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
