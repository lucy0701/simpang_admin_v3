import { Badge } from "@/components/ui/badge";
import {
  getRolePermissions,
  requireOperator,
  type PermissionEffect,
} from "@/lib/auth/dal";

/** effect 별 표시. deny 는 굳이 나열하지 않고 개수만 알린다. */
const EFFECT_LABEL: Record<PermissionEffect, string> = {
  allow: "허용",
  approval_required: "승인 필요",
  extra_grant: "별도 권한 필요",
  deny: "차단",
};

const EFFECT_VARIANT: Record<
  PermissionEffect,
  "default" | "secondary" | "outline"
> = {
  allow: "default",
  approval_required: "secondary",
  extra_grant: "outline",
  deny: "outline",
};

export default async function DashboardPage() {
  const operator = await requireOperator();
  const permissions = await getRolePermissions();

  const grouped = new Map<PermissionEffect, string[]>();
  for (const [code, effect] of permissions) {
    grouped.set(effect, [...(grouped.get(effect) ?? []), code]);
  }

  const visible: PermissionEffect[] = [
    "allow",
    "approval_required",
    "extra_grant",
  ];
  const denied = grouped.get("deny")?.length ?? 0;

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
          <dd>
            {operator.role
              ? `${operator.role.name} (${operator.role.code})`
              : "미지정"}
          </dd>
        </div>
      </dl>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">권한</h2>

        {permissions.size === 0 ? (
          <p className="text-sm text-muted-foreground">
            역할에 연결된 권한이 없습니다. role_permission 테이블을 확인하세요.
          </p>
        ) : (
          <>
            {visible.map((effect) => {
              const codes = grouped.get(effect);
              if (!codes?.length) return null;

              return (
                <div key={effect} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={EFFECT_VARIANT[effect]}>
                      {EFFECT_LABEL[effect]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {effect === "approval_required"
                        ? "건별 승인을 받으면 실행할 수 있습니다"
                        : effect === "extra_grant"
                          ? "개인정보 열람 권한을 부여받으면 실행할 수 있습니다"
                          : null}
                    </span>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {codes.sort().map((code) => (
                      <li
                        key={code}
                        className="rounded-full border px-3 py-1 font-mono text-xs"
                      >
                        {code}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {denied > 0 ? (
              <p className="text-xs text-muted-foreground">
                차단된 권한 {denied}개
              </p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
