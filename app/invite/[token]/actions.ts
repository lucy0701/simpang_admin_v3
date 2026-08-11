"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { acceptInvite } from "@/lib/auth/invite";
import { createClient } from "@/lib/supabase/server";

export type AcceptState = { error?: string };

export async function accept(
  _prevState: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const token = String(formData.get("token") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!name) return { error: "이름을 입력해주세요." };
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (password !== passwordConfirm) {
    return { error: "비밀번호가 서로 다릅니다." };
  }

  const result = await acceptInvite({ token, name, password });
  if ("error" in result) return { error: result.message };

  // 계정이 막 만들어졌으니 바로 로그인시켜 대시보드로 보낸다.
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.email,
    password,
  });

  if (error) {
    // 계정 자체는 만들어졌다. 로그인만 다시 하면 된다.
    redirect("/login");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
