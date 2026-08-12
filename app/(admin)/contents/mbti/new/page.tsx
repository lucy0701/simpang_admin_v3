import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkPermission, requireOperator } from "@/lib/auth/dal";

import { PsychotestForm } from "./psychotest-form";

/**
 * 편집기는 자체 상단 바(breadcrumb · 제목 · 저장 버튼)를 갖는 3열 화면이라
 * 공용 PageHeader 를 쓰지 않는다.
 */
export default async function NewMbtiPage() {
  await requireOperator();

  const [canEdit, canPublish] = await Promise.all([
    checkPermission("content.edit"),
    checkPermission("content.publish"),
  ]);

  if (!canEdit.allowed) {
    return (
      <Alert>
        <AlertTitle>등록 권한이 없습니다</AlertTitle>
        <AlertDescription>{canEdit.reason}</AlertDescription>
      </Alert>
    );
  }

  return <PsychotestForm canPublish={canPublish.allowed} />;
}
