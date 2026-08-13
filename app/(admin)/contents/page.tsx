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

import { ContentTable } from "./_components/content-table";
import { ListControls, Pagination } from "./_components/list-controls";

/**
 * 전체 콘텐츠 목록.
 *
 * 멀티게임은 뺀다. 실시간 방 운영이라 등록·편성·삭제라는 이 화면의 조작이
 * 맞지 않고, 별도 화면에서 다뤄야 한다.
 */
const EXCLUDED_TYPES = ["multigame"];

const STATUS_OPTIONS = Object.entries(CONTENT_STATUS_LABEL).map(
  ([value, label]) => ({ value, label })
);

const TYPE_OPTIONS = Object.entries(CONTENT_TYPE_LABEL)
  .filter(([value]) => !EXCLUDED_TYPES.includes(value))
  .map(([value, label]) => ({ value, label }));

export default async function ContentsPage({
  searchParams,
}: PageProps<"/contents">) {
  await requireOperator();

  const resolved = await searchParams;
  const params = {
    search: typeof resolved.search === "string" ? resolved.search : undefined,
    type: typeof resolved.type === "string" ? resolved.type : undefined,
    status: typeof resolved.status === "string" ? resolved.status : undefined,
    page: typeof resolved.page === "string" ? resolved.page : undefined,
  };
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const filtered = Boolean(params.search || params.type || params.status);

  const [{ rows, total }, summary] = await Promise.all([
    listContents({
      types: params.type ? [params.type] : undefined,
      excludeTypes: params.type ? undefined : EXCLUDED_TYPES,
      status: params.status,
      search: params.search,
      page,
    }),
    contentSummary({ excludeTypes: EXCLUDED_TYPES }),
  ]);

  return (
    <>
      <PageHeader
        title="Contents"
        summary={`전체 ${summary.total}개 · 공개 ${summary.publicCount} · 검수 대기 ${summary.review} · 비공개 ${summary.private}`}
        actions={
          <>
            <Button variant="outline">CSV 내보내기</Button>
            <Button asChild>
              <Link href="/contents/new">콘텐츠 등록</Link>
            </Button>
          </>
        }
      />

      <Panel>
        <ListControls
          basePath="/contents"
          params={params}
          typeOptions={TYPE_OPTIONS}
          statusOptions={STATUS_OPTIONS}
        />

        <ContentTable
          rows={rows}
          typeLabels={CONTENT_TYPE_LABEL}
          emptyTitle={
            filtered
              ? "조건에 맞는 콘텐츠가 없습니다"
              : "등록된 콘텐츠가 없습니다"
          }
          emptyDescription={
            filtered
              ? "검색어나 필터를 바꿔보세요."
              : "콘텐츠 등록 버튼으로 첫 콘텐츠를 만들어보세요."
          }
        />

        <Pagination
          basePath="/contents"
          params={params}
          page={page}
          total={total}
          pageSize={CONTENT_PAGE_SIZE}
        />
      </Panel>
    </>
  );
}
