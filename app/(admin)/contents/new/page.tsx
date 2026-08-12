import Link from "next/link";

import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { checkPermission, requireOperator } from "@/lib/auth/dal";

import { PsychotestForm } from "./psychotest-form";

export default async function NewContentPage() {
  await requireOperator();

  const [canEdit, canPublish] = await Promise.all([
    checkPermission("content.edit"),
    checkPermission("content.publish"),
  ]);

  return (
    <>
      <PageHeader
        title="심리테스트 등록"
        summary="문항과 결과 유형을 함께 만듭니다. 점수를 합산해 결과를 정하는 방식입니다."
        actions={
          <Button asChild variant="outline">
            <Link href="/contents">목록으로</Link>
          </Button>
        }
      />

      {!canEdit.allowed ? (
        <Alert>
          <AlertTitle>등록 권한이 없습니다</AlertTitle>
          <AlertDescription>{canEdit.reason}</AlertDescription>
        </Alert>
      ) : (
        <PsychotestForm canPublish={canPublish.allowed} />
      )}
    </>
  );
}
