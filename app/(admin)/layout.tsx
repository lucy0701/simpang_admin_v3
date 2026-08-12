import { Sidebar, type NavGroup } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/actions";
import { requireOperator } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 보호 구역. 여기 밑의 모든 라우트는 활성 운영자만 볼 수 있다.
 * proxy.ts 의 리다이렉트는 UX 용이고, 실제 차단은 이 레이아웃의 requireOperator() 다.
 */

/** 사이드바 배지에 쓸 미처리 신고 건수. */
async function pendingReportCount(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("comment_report")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return count ?? 0;
}

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const operator = await requireOperator();
  const pendingReports = await pendingReportCount();

  const groups: NavGroup[] = [
    {
      items: [
        { href: "/dashboard", label: "대시보드" },
        {
          href: "/contents",
          label: "콘텐츠",
          children: [
            // 지금 만들 수 있는 건 MBTI 뿐이다. content.content_type 의
            // 'psychotest' 가 이것에 해당한다 (enum 값은 스키마 그대로 둔다).
            { href: "/contents/mbti", label: "MBTI" },
          ],
        },
        { href: "/members", label: "회원" },
        { href: "/comments", label: "댓글 · 신고", badge: pendingReports },
        // 대응 테이블이 없어 아직 만들 수 없는 화면들.
        { href: "/ads", label: "광고 슬롯", disabled: true },
        { href: "/stats", label: "통계", disabled: true },
      ],
    },
    {
      items: [
        { href: "/operators", label: "권한 · 계정" },
        { href: "/banners", label: "배너 · 편성", disabled: true },
      ],
    },
  ];

  return (
    <div className="flex min-h-full flex-1">
      <Sidebar
        groups={groups}
        operator={{ name: operator.name, roleName: operator.role?.name ?? null }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end border-b-3 px-7 py-3">
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              로그아웃
            </Button>
          </form>
        </div>
        <main className="flex flex-1 flex-col gap-6 p-7">{children}</main>
      </div>
    </div>
  );
}
