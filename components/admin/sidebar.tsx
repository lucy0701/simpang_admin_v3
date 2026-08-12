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
  /** 하위 항목. 접지 않고 항상 펼쳐 둔다 (3개뿐이라 감출 이득이 없다). */
  children?: NavItem[];
};

export type NavGroup = { items: NavItem[] };

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 최상위 항목 하나(+하위 항목). 하위는 들여쓰고 배경 없이 글자 굵기로만 구분한다. */
function NavEntry({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);

  return (
    <>
      {item.disabled ? (
        <span
          aria-disabled
          title="아직 만들지 않은 화면입니다"
          className="flex h-[38px] cursor-not-allowed items-center rounded-[10px] px-3 text-sm text-muted-foreground/50"
        >
          {item.label}
        </span>
      ) : (
        <Link
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
      )}

      {item.children?.map((child) =>
        child.disabled ? (
          <span
            key={child.href}
            aria-disabled
            title="아직 만들지 않은 화면입니다"
            className="flex h-[34px] cursor-not-allowed items-center pl-6 text-sm text-muted-foreground/50"
          >
            {child.label}
          </span>
        ) : (
          <Link
            key={child.href}
            href={child.href}
            aria-current={isActive(pathname, child.href) ? "page" : undefined}
            className={cn(
              "flex h-[34px] items-center rounded-[10px] pl-6 text-sm transition-colors hover:bg-accent",
              isActive(pathname, child.href)
                ? "font-semibold"
                : "text-muted-foreground",
            )}
          >
            {/*
              상위 항목은 검은 반전으로 현재 위치를 알리지만, 하위 항목까지
              같은 방식을 쓰면 둘 중 어디에 있는지 헷갈린다. 글자 굵기만으로는
              약해서 밑줄로 "여기" 를 분명히 한다.
            */}
            <span
              className={cn(
                "border-b-[3px] pb-0.5",
                isActive(pathname, child.href)
                  ? "border-primary"
                  : "border-transparent",
              )}
            >
              {child.label}
            </span>
          </Link>
        ),
      )}
    </>
  );
}

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
          {group.items.map((item) => (
            <NavEntry key={item.href} item={item} pathname={pathname} />
          ))}
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
