import Link from "next/link";

import {
  EmptyState,
  PageHeader,
  Panel,
} from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireOperator } from "@/lib/auth/dal";
import {
  CONTENT_STATUS_LABEL,
  CONTENT_TYPE_LABEL,
  contentSummary,
  listContents,
} from "@/lib/data/queries";

/** 상태별 배지 색. 검수 대기만 눈에 띄어야 해서 destructive 를 아낀다. */
function statusVariant(status: string) {
  if (status === "public") return "default" as const;
  if (status === "review") return "destructive" as const;
  return "secondary" as const;
}

export default async function ContentsPage() {
  await requireOperator();

  const [contents, summary] = await Promise.all([
    listContents(),
    contentSummary(),
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
              <Link href="/contents/new">심리테스트 등록</Link>
            </Button>
          </>
        }
      />

      <Panel>
        {contents.length === 0 ? (
          <EmptyState
            title="등록된 콘텐츠가 없습니다"
            description="content 테이블이 비어 있습니다. 콘텐츠를 등록하면 여기에 유형·상태·지표와 함께 나열됩니다."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">플레이</TableHead>
                <TableHead className="text-right">좋아요</TableHead>
                <TableHead className="text-right">댓글</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.map((content) => (
                <TableRow key={content.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {content.title}
                      {content.isHomeFeatured ? (
                        <Badge variant="outline">홈 편성</Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {CONTENT_TYPE_LABEL[content.contentType] ??
                      content.contentType}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(content.status)}>
                      {CONTENT_STATUS_LABEL[content.status] ?? content.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {content.playCount.toLocaleString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {content.likeCount.toLocaleString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {content.commentCount.toLocaleString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {new Date(content.createdAt).toLocaleDateString("ko-KR", {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      수정
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
