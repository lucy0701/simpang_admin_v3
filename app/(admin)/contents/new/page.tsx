import Link from "next/link";

import { PageHeader, Panel } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { checkPermission, requireOperator } from "@/lib/auth/dal";

/**
 * 콘텐츠 유형 선택.
 *
 * 유형마다 편집기가 완전히 다르다(문항·결과 유형이 있는 MBTI, 게임 설정이 있는
 * 미니게임 …). 하나의 폼에 분기를 쌓는 대신 유형을 먼저 고르고 전용 화면으로
 * 보낸다. 지금 만들 수 있는 건 MBTI 뿐이다.
 */
const CONTENT_TYPES = [
  {
    href: "/contents/mbti/new",
    title: "MBTI",
    description:
      "문항에 점수를 배정하고 총점 범위로 결과 유형을 정합니다. 결과는 공유 카드로 나갑니다.",
    ready: true,
  },
  {
    href: "#",
    title: "심리테스트",
    description: "MBTI 와 다른 판정 방식을 쓸 예정입니다.",
    ready: false,
  },
];

export default async function NewContentPage() {
  await requireOperator();
  const canEdit = await checkPermission("content.edit");

  return (
    <>
      <PageHeader
        title="콘텐츠 등록"
        summary="만들 콘텐츠 유형을 고르세요."
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONTENT_TYPES.map((type) =>
            type.ready ? (
              <Link
                key={type.title}
                href={type.href}
                className="panel flex flex-col gap-2 p-5 transition-colors hover:bg-accent"
              >
                <span className="text-base font-semibold">{type.title}</span>
                <span className="text-[13px] text-muted-foreground">
                  {type.description}
                </span>
                <span className="mt-2 text-[13px] font-medium text-primary">
                  만들기 →
                </span>
              </Link>
            ) : (
              <div
                key={type.title}
                aria-disabled
                className="panel flex cursor-not-allowed flex-col gap-2 p-5 opacity-50"
              >
                <span className="text-base font-semibold">{type.title}</span>
                <span className="text-[13px] text-muted-foreground">
                  {type.description}
                </span>
                <span className="mt-2 text-[13px] text-muted-foreground">
                  준비 중
                </span>
              </div>
            )
          )}
        </div>
      )}

      <Panel title="참고">
        <p className="text-[13px] text-muted-foreground">
          멀티게임은 실시간 방 운영이라 이 목록에서 다루지 않습니다.
        </p>
      </Panel>
    </>
  );
}
