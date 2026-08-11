"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * 시안의 220px 좌측 내비게이션.
 *
 * 활성 항목은 검은 배경 + 흰 글자로 반전된다 (primary 초록이 아니다 —
 * 초록은 실행 버튼에만 쓰여서 "지금 여기" 와 "누를 것" 이 섞이지 않는다).
 */

export type NavItem = {
  href: string;
  label: string;
  /** 처리 대기 건수. 0 이면 표시하지 않는다. */
  badge?: number;
  /** 아직 화면이 없는 항목. 눌리지 않게 하고 흐리게 둔다. */
  disabled?: boolean;
};

export type NavGroup = { items: NavItem[] };

export function Sidebar({
  groups,
  operator,
}: {
  groups: NavGroup[];
  operator: { name: string; roleName: string | null };
}) {
  const pathname = usePathname();

  const initials = operator.name.slice(0, 2);

  return (
    <aside className="flex w-[220px] shrink-0 flex-col gap-6 border-r-[3px] p-[18px] pt-6">
      <div className="flex flex-col gap-1 px-3">
        <span className="display text-xl leading-none">Playground</span>
        <span className="text-xs text-muted-foreground">운영자 콘솔</span>
      </div>

      {groups.map((group, index) => (
        <div key={index} className="flex flex-col gap-0.5">
          {index > 0 ? <div className="mb-5 h-[3px] bg-border" /> : null}
          {group.items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  aria-disabled
                  title="아직 만들지 않은 화면입니다"
                  className="flex h-[38px] cursor-not-allowed items-center rounded-[10px] px-3 text-sm text-muted-foreground/50"
                >
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-[38px] items-center justify-between rounded-[10px] px-3 text-sm transition-colors",
                  active
                    ? "bg-foreground font-medium text-background"
                    : "hover:bg-accent",
                )}
              >
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-destructive px-[7px] py-0.5 text-[11px] font-semibold text-white tabular-nums">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="mt-auto flex items-center gap-2.5 border-t-[3px] pt-4">
        <span className="flex size-8 items-center justify-center rounded-[10px] bg-accent text-xs font-bold text-muted-foreground">
          {initials}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px]">{operator.name}</span>
          <span className="truncate text-[11px] text-muted-foreground">
            {operator.roleName ?? "역할 미지정"}
          </span>
        </span>
      </div>
    </aside>
  );
}
