import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { requireOperator } from "@/lib/auth/dal";

/**
 * 보호 구역. 여기 밑의 모든 라우트는 활성 운영자만 볼 수 있다.
 * proxy.ts 의 리다이렉트는 UX 용이고, 실제 차단은 이 레이아웃의 requireOperator() 다.
 */
export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const operator = await requireOperator();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="text-sm font-semibold">Playground Admin</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            {operator.name}
            {operator.role ? ` · ${operator.role.name}` : ""}
          </span>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              로그아웃
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
