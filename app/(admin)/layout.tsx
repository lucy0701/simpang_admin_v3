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
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-3 dark:border-white/15">
        <span className="text-sm font-semibold">Playground Admin</span>
        <div className="flex items-center gap-4 text-sm">
          <span className="opacity-70">
            {operator.name}
            {operator.role ? ` · ${operator.role.name}` : ""}
          </span>
          <form action={logout}>
            <button type="submit" className="underline opacity-70 hover:opacity-100">
              로그아웃
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
