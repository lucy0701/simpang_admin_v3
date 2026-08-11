import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { findInviteByToken, inviteErrorMessage } from "@/lib/auth/invite";

import { AcceptForm } from "./accept-form";

export const metadata: Metadata = {
  title: "운영자 초대 · Playground Admin",
};

export default async function InvitePage({
  params,
}: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const result = await findInviteByToken(token);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {"error" in result ? (
          <>
            <h1 className="mb-1 text-2xl font-semibold">초대를 열 수 없습니다</h1>
            <p className="mb-8 text-sm text-muted-foreground">
              {inviteErrorMessage(result.error)}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">로그인 화면으로</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-semibold">운영자 계정 만들기</h1>
            <p className="mb-8 text-sm text-muted-foreground">
              {result.invite.email} 으로 초대되었습니다
              {result.invite.roleName ? ` · ${result.invite.roleName}` : ""}.
            </p>
            <AcceptForm token={token} />
          </>
        )}
      </div>
    </main>
  );
}
