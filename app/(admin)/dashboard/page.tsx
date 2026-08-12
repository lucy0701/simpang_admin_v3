import Link from "next/link";

import {
  EmptyState,
  PageHeader,
  Panel,
  StatTile,
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
import {
  getRolePermissions,
  requireOperator,
  type PermissionEffect,
} from "@/lib/auth/dal";
import {
  dashboardStats,
  listRecentAudit,
  topContents,
} from "@/lib/data/queries";

const EFFECT_LABEL: Record<PermissionEffect, string> = {
  allow: "허용",
  approval_required: "승인 필요",
  extra_grant: "별도 권한",
  deny: "차단",
};

function percent(part: number, whole: number): string {
  if (whole === 0) return "—";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

export default async function DashboardPage() {
  const operator = await requireOperator();

  const [stats, top, audit, permissions] = await Promise.all([
    dashboardStats(),
    topContents(),
    listRecentAudit(6),
    getRolePermissions(),
  ]);

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const grantedCount = [...permissions.values()].filter(
    (effect) => effect !== "deny"
  ).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        summary={`${today} · ${operator.name} 님`}
        actions={
          <Button asChild>
            <Link href="/contents">콘텐츠 관리</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3.5">
        <StatTile
          label="오늘 플레이"
          value={stats.plays.toLocaleString("ko-KR")}
          note={`완주 ${percent(stats.completedPlays, stats.plays)}`}
          tone="primary"
        />
        <StatTile
          label="오늘 결과 공유"
          value={stats.shares.toLocaleString("ko-KR")}
          note={`플레이 대비 ${percent(stats.shares, stats.plays)}`}
        />
        <StatTile
          label="오늘 신규 가입"
          value={stats.signups.toLocaleString("ko-KR")}
        />
        <StatTile
          label="신고 대기"
          value={stats.reports.toLocaleString("ko-KR")}
          note={stats.reports > 0 ? "처리가 필요합니다" : "밀린 신고 없음"}
          tone={stats.reports > 0 ? "destructive" : "muted"}
        />
        <StatTile
          label="공개 콘텐츠"
          value={stats.contents.toLocaleString("ko-KR")}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Panel
          title="인기 콘텐츠"
          description="공개 상태 · 플레이 수 기준"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/contents">전체 보기</Link>
            </Button>
          }
        >
          {top.length === 0 ? (
            <EmptyState
              title="공개된 콘텐츠가 없습니다"
              description="content 테이블에 status='public' 인 행이 생기면 플레이 수 순으로 나열됩니다."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="text-right">플레이</TableHead>
                  <TableHead className="text-right">좋아요</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top.map((content, index) => (
                  <TableRow key={content.id}>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {content.title}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {content.playCount.toLocaleString("ko-KR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {content.likeCount.toLocaleString("ko-KR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel
            title="내 권한"
            description={`${
              operator.role?.name ?? "역할 미지정"
            } · ${grantedCount}개 사용 가능`}
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link href="/operators">권한 관리</Link>
              </Button>
            }
          >
            {permissions.size === 0 ? (
              <EmptyState title="연결된 권한이 없습니다" />
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {[...permissions.entries()]
                  .filter(([, effect]) => effect !== "deny")
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([code, effect]) => (
                    <li key={code}>
                      <Badge
                        variant={effect === "allow" ? "default" : "secondary"}
                        className="font-mono text-[11px]"
                      >
                        {code}
                        <span className="ml-1 opacity-70">
                          {EFFECT_LABEL[effect]}
                        </span>
                      </Badge>
                    </li>
                  ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="최근 활동"
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link href="/operators">전체 보기</Link>
              </Button>
            }
          >
            {audit.length === 0 ? (
              <EmptyState title="기록된 활동이 없습니다" />
            ) : (
              <ul className="flex flex-col gap-2.5 text-[13px]">
                {audit.map((row) => (
                  <li key={row.id} className="flex gap-3">
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {new Date(row.createdAt).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="min-w-0">
                      <span className="font-medium">
                        {row.operatorName ?? "(삭제된 운영자)"}
                      </span>
                      <span className="text-muted-foreground">
                        {" · "}
                        {row.detail ?? row.action}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
