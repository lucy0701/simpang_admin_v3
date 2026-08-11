import {
  EmptyState,
  PageHeader,
  Panel,
} from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { checkPermission, requireOperator } from "@/lib/auth/dal";
import { listPendingInvites, listRoles } from "@/lib/auth/invite";
import {
  listOperators,
  listRecentAudit,
  permissionMatrix,
  piiHandlerCount,
  type MatrixCell,
} from "@/lib/data/queries";

import { revoke } from "./actions";
import { InviteForm } from "./invite-form";

/**
 * 시안의 4-state 매트릭스. 색으로 상태를 구분하되 글자로도 읽히게 한다
 * (색만으로 구분하면 색각 이상에서 허용/차단이 같아 보인다).
 */
const CELL_STYLE: Record<MatrixCell, { label: string; className: string }> = {
  allow: { label: "허용", className: "bg-primary/10 text-primary" },
  deny: { label: "차단", className: "bg-muted text-muted-foreground" },
  approval_required: {
    label: "승인 필요",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  extra_grant: {
    label: "별도 권한",
    className: "bg-destructive/10 text-destructive",
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function OperatorsPage() {
  await requireOperator();

  const [canInvite, roles, operators, invites, matrix, piiHandlers, audit] =
    await Promise.all([
      checkPermission("operator.invite"),
      listRoles(),
      listOperators(),
      listPendingInvites(),
      permissionMatrix(),
      piiHandlerCount(),
      listRecentAudit(8),
    ]);

  return (
    <>
      <PageHeader
        title="Roles & Access"
        summary={`운영자 ${operators.length}명 · 역할 ${matrix.roles.length}개 · 개인정보 취급자 ${piiHandlers}명`}
      />

      <Panel
        title="권한 매트릭스"
        description="역할별로 무엇을 할 수 있는지. 승인 필요는 건별 승인 후, 별도 권한은 개인정보 열람 권한을 부여받은 뒤 실행됩니다."
      >
        {matrix.permissions.length === 0 ? (
          <EmptyState
            title="권한이 정의되어 있지 않습니다"
            description="permission · role_permission 테이블이 비어 있습니다."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-56">권한</TableHead>
                  {matrix.roles.map((role) => (
                    <TableHead key={role.id} className="text-center">
                      {role.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrix.permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <span className="flex flex-col">
                        <span className="font-medium">{permission.name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {permission.code}
                        </span>
                      </span>
                    </TableCell>
                    {matrix.roles.map((role) => {
                      const effect =
                        matrix.cells.get(`${role.id}:${permission.id}`) ??
                        "deny";
                      const cell = CELL_STYLE[effect];
                      return (
                        <TableCell key={role.id} className="text-center">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${cell.className}`}
                          >
                            {cell.label}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <Panel
        title="운영자 초대"
        description="어드민에는 자체 가입이 없습니다. 초대 링크를 받은 사람만 계정을 만들 수 있습니다."
      >
        {!canInvite.allowed ? (
          <Alert>
            <AlertTitle>초대 권한이 없습니다</AlertTitle>
            <AlertDescription>{canInvite.reason}</AlertDescription>
          </Alert>
        ) : roles.length === 0 ? (
          <EmptyState
            title="역할이 없습니다"
            description="role 테이블에 데이터를 먼저 넣어주세요."
          />
        ) : (
          <InviteForm roles={roles} />
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={`운영자 ${operators.length}`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>최근 접속</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operators.map((operator) => (
                <TableRow key={operator.id}>
                  <TableCell>
                    <span className="flex flex-col">
                      <span className="flex items-center gap-1.5 font-medium">
                        {operator.name}
                        {operator.isExternal ? (
                          <Badge variant="outline">외부</Badge>
                        ) : null}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {operator.email}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {operator.roleName ?? "미지정"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {operator.lastAccessAt
                      ? formatDate(operator.lastAccessAt)
                      : "기록 없음"}
                  </TableCell>
                  <TableCell>
                    <span className="flex flex-col gap-1">
                      <Badge
                        variant={
                          operator.status === "active" ? "default" : "secondary"
                        }
                      >
                        {operator.status}
                      </Badge>
                      {!operator.is2fa ? (
                        <span className="text-[11px] text-destructive">
                          2FA 미설정
                        </span>
                      ) : null}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel
            title={`초대 대기 ${invites.length}`}
            description="발급 후 3일 내 미수락 시 자동 만료됩니다."
          >
            {invites.length === 0 ? (
              <EmptyState title="대기 중인 초대가 없습니다" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이메일</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>만료</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {invite.role?.name ?? "미지정"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invite.expiresAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {canInvite.allowed ? (
                          <form action={revoke}>
                            <input
                              type="hidden"
                              name="inviteId"
                              value={invite.id}
                            />
                            <Button type="submit" variant="ghost" size="sm">
                              취소
                            </Button>
                          </form>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Panel>

          <Panel title="최근 활동 로그">
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
