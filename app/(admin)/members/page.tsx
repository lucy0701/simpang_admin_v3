import { EmptyState, PageHeader, Panel } from "@/components/admin/page-header";
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
import { can, requireOperator } from "@/lib/auth/dal";
import { listMembers, memberSummary, PROVIDER_LABEL } from "@/lib/data/queries";

/**
 * 회원번호는 저장은 원본, 표시는 마스킹이 스키마의 전제다(PG-2****77).
 * 원본 열람은 pii.view 권한이 있을 때만 허용한다.
 */
function maskMemberNo(memberNo: string | null): string {
  if (!memberNo) return "—";
  if (memberNo.length <= 6) return memberNo;
  return `${memberNo.slice(0, 4)}****${memberNo.slice(-2)}`;
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return { label: "정상", variant: "secondary" as const };
    case "suspended":
      return { label: "정지", variant: "destructive" as const };
    case "banned":
      return { label: "차단", variant: "destructive" as const };
    default:
      return { label: "탈퇴", variant: "outline" as const };
  }
}

export default async function MembersPage() {
  await requireOperator();

  const [members, summary, canViewPii] = await Promise.all([
    listMembers(),
    memberSummary(),
    can("pii.view"),
  ]);

  return (
    <>
      <PageHeader
        title="Members"
        summary={`전체 ${summary.total.toLocaleString(
          "ko-KR"
        )} · 오늘 신규 ${summary.today.toLocaleString("ko-KR")} · 제재중 ${
          summary.suspended
        }`}
        actions={<Button variant="outline">제재 이력</Button>}
      />

      <Panel
        title="회원 목록"
        description={
          canViewPii
            ? "개인정보 열람 권한이 있어 회원번호 원본이 보입니다. 열람 사실은 기록됩니다."
            : "개인정보는 마스킹되어 표시됩니다. 원본 열람에는 별도 권한이 필요합니다."
        }
      >
        {members.length === 0 ? (
          <EmptyState
            title="가입한 회원이 없습니다"
            description="profiles 테이블이 비어 있습니다. auth.users 에 가입이 생기면 트리거가 자동으로 프로필을 만듭니다."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>닉네임</TableHead>
                <TableHead>가입 경로</TableHead>
                <TableHead>회원번호</TableHead>
                <TableHead className="text-right">플레이</TableHead>
                <TableHead className="text-right">댓글</TableHead>
                <TableHead>티어</TableHead>
                <TableHead>최근 접속</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const status = statusBadge(member.status);
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {member.nickname ?? "(닉네임 없음)"}
                        {member.reportReceived > 0 ? (
                          <span className="text-xs text-destructive">
                            신고 {member.reportReceived}회
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {PROVIDER_LABEL[member.provider ?? ""] ??
                        member.provider ??
                        "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {canViewPii
                        ? member.memberNo ?? "—"
                        : maskMemberNo(member.memberNo)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {member.playCount.toLocaleString("ko-KR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {member.commentCount.toLocaleString("ko-KR")}
                    </TableCell>
                    <TableCell className="text-xs font-semibold uppercase">
                      {member.tier}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.lastLoginAt
                        ? new Date(member.lastLoginAt).toLocaleString("ko-KR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "기록 없음"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  );
}
