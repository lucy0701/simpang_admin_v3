import {
  EmptyState,
  PageHeader,
  Panel,
  StatTile,
} from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireOperator } from "@/lib/auth/dal";
import {
  listPendingReports,
  REPORT_REASON_LABEL,
  reportSummary,
  PROVIDER_LABEL,
} from "@/lib/data/queries";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return `${Math.max(1, Math.floor(diff / 60_000))}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default async function CommentsPage() {
  await requireOperator();

  const [reports, summary] = await Promise.all([
    listPendingReports(),
    reportSummary(),
  ]);

  return (
    <>
      <PageHeader
        title="Comments"
        summary={`신고 대기 ${
          summary.pending
        } · 오늘 등록 ${summary.commentsToday.toLocaleString("ko-KR")}`}
        actions={<Button variant="outline">금칙어 목록</Button>}
      />

      <div className="flex flex-wrap gap-3.5">
        <StatTile
          label="신고 대기"
          value={summary.pending}
          note={
            reports[0]
              ? `가장 오래된 건 ${timeAgo(reports[0].createdAt)}`
              : "대기 중인 신고 없음"
          }
          tone={summary.pending > 0 ? "destructive" : "muted"}
        />
        <StatTile label="욕설 · 비방" value={summary.abuse} />
        <StatTile label="스팸 · 광고" value={summary.spam} />
        <StatTile label="기타" value={summary.etc} />
      </div>

      <Panel
        title="신고 큐"
        description="원문과 맥락을 한 화면에서 보고 바로 처리합니다. 오래된 신고가 위로 옵니다."
      >
        {reports.length === 0 ? (
          <EmptyState
            title="처리할 신고가 없습니다"
            description="comment_report 에 pending 상태인 행이 없습니다."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex flex-col gap-3 rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="font-medium">
                    {report.authorNickname ?? "(알 수 없음)"}
                  </span>
                  <span className="text-muted-foreground">
                    · {PROVIDER_LABEL[report.authorProvider ?? ""] ?? "—"}
                  </span>
                  <span className="text-muted-foreground">
                    · {report.contentTitle ?? "(삭제된 콘텐츠)"}
                  </span>
                  <span className="text-muted-foreground">
                    · {timeAgo(report.createdAt)}
                  </span>
                  <Badge variant="destructive">
                    {REPORT_REASON_LABEL[report.reason] ?? report.reason}
                    {report.commentReportCount > 1
                      ? ` ${report.commentReportCount}건`
                      : ""}
                  </Badge>
                  {report.commentStatus !== "visible" ? (
                    <Badge variant="secondary">이미 숨김</Badge>
                  ) : null}
                </div>

                <p className="rounded-lg bg-muted px-3.5 py-3 text-sm">
                  {report.commentBody ?? "(원문이 삭제되었습니다)"}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm">숨김 + 경고</Button>
                  <Button size="sm" variant="outline">
                    7일 차단
                  </Button>
                  <Button size="sm" variant="outline">
                    영구 차단
                  </Button>
                  <Button size="sm" variant="ghost">
                    신고 반려
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
