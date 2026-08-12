import Link from "next/link";

import { PageHeader, Panel } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireOperator } from "@/lib/auth/dal";
import {
  CONTENT_PAGE_SIZE,
  CONTENT_STATUS_LABEL,
  CONTENT_TYPE_LABEL,
  contentSummary,
  listContents,
} from "@/lib/data/queries";

import { ContentTable } from "../content-table";
import { ListControls, Pagination } from "../list-controls";

/** MBTI 는 content_type 의 psychotest 에 대응한다. */
const MBTI_TYPES = ["psychotest"];

const STATUS_OPTIONS = Object.entries(CONTENT_STATUS_LABEL).map(
  ([value, label]) => ({ value, label }),
);

export default async function MbtiContentsPage({
  searchParams,
}: PageProps<"/contents/mbti">) {
  await requireOperator();

  const resolved = await searchParams;
  const params = {
    search: typeof resolved.search === "string" ? resolved.search : undefined,
    status: typeof resolved.status === "string" ? resolved.status : undefined,
    page: typeof resolved.page === "string" ? resolved.page : undefined,
  };
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const filtered = Boolean(params.search || params.status);

  const [{ rows, total }, summary] = await Promise.all([
    listContents({
      types: MBTI_TYPES,
      status: params.status,
      search: params.search,
      page,
    }),
    contentSummary({ types: MBTI_TYPES }),
  ]);

  return (
    <>
      <PageHeader
        title="MBTI"
        summary={`전체 ${summary.total}개 · 공개 ${summary.publicCount} · 검수 대기 ${summary.review} · 비공개 ${summary.private}`}
        actions={
          <Button asChild>
            <Link href="/contents/mbti/new">MBTI 등록</Link>
          </Button>
        }
      />

      <Panel>
        <ListControls
          basePath="/contents/mbti"
          params={params}
          // 유형이 하나뿐이라 유형 필터는 두지 않는다.
          typeOptions={[]}
          statusOptions={STATUS_OPTIONS}
        />

        <ContentTable
          rows={rows}
          typeLabels={CONTENT_TYPE_LABEL}
          emptyTitle={
            filtered
              ? "조건에 맞는 MBTI 콘텐츠가 없습니다"
              : "등록된 MBTI 콘텐츠가 없습니다"
          }
          emptyDescription={
            filtered
              ? "검색어나 상태 필터를 바꿔보세요."
              : "MBTI 등록 버튼으로 문항과 결과 유형을 만들어보세요."
          }
        />

        <Pagination
          basePath="/contents/mbti"
          params={params}
          page={page}
          total={total}
          pageSize={CONTENT_PAGE_SIZE}
        />
      </Panel>
    </>
  );
}
