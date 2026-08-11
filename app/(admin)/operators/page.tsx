import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireOperator } from "@/lib/auth/dal";
import { listPendingInvites, listRoles } from "@/lib/auth/invite";
import { createAdminClient } from "@/lib/supabase/admin";

import { revoke } from "./actions";
import { InviteForm } from "./invite-form";

async function listOperators() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("operator")
    .select("id, name, email, status, last_access_at, role:role_id (name)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    status: row.status as string,
    roleName:
      (Array.isArray(row.role) ? row.role[0]?.name : row.role?.name) ?? null,
  }));
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function OperatorsPage() {
  await requireOperator();

  const [roles, operators, invites] = await Promise.all([
    listRoles(),
    listOperators(),
    listPendingInvites(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">운영자</h1>

      <Card>
        <CardHeader>
          <CardTitle>운영자 초대</CardTitle>
          <CardDescription>
            어드민에는 자체 가입이 없습니다. 초대 링크를 받은 사람만 계정을 만들 수
            있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              역할이 없습니다. Supabase 의 <code className="font-mono">role</code> ·{" "}
              <code className="font-mono">permission</code> 테이블에 데이터를 먼저
              넣어주세요.
            </p>
          ) : (
            <InviteForm roles={roles} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>대기 중인 초대 ({invites.length})</CardTitle>
          <CardDescription>수락되지 않은 초대입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              대기 중인 초대가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이메일</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>초대한 사람</TableHead>
                  <TableHead>만료</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>{invite.role?.name ?? "미지정"}</TableCell>
                    <TableCell>{invite.invitedBy ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invite.expiresAt)}
                    </TableCell>
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>운영자 목록 ({operators.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operators.map((operator) => (
                <TableRow key={operator.id}>
                  <TableCell>{operator.name}</TableCell>
                  <TableCell>{operator.email}</TableCell>
                  <TableCell>{operator.roleName ?? "미지정"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        operator.status === "active" ? "default" : "secondary"
                      }
                    >
                      {operator.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
