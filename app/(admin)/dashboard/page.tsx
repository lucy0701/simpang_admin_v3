import { getPermissionCodes, requireOperator } from "@/lib/auth/dal";

export default async function DashboardPage() {
  const operator = await requireOperator();
  const permissions = await getPermissionCodes();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">대시보드</h1>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">운영자</dt>
          <dd>
            {operator.name} ({operator.email})
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">역할</dt>
          <dd>{operator.role ? `${operator.role.name} (${operator.role.code})` : "미지정"}</dd>
        </div>
      </dl>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">허용된 권한</h2>
        {permissions.size === 0 ? (
          <p className="text-sm text-muted-foreground">
            부여된 권한이 없습니다. role_permission 테이블을 확인하세요.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {[...permissions].sort().map((code) => (
              <li
                key={code}
                className="rounded-full border px-3 py-1 text-xs"
              >
                {code}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
