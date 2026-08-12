"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuBellRing,
  LuChartColumn,
  LuFolder,
  LuImage,
  LuLayoutDashboard,
  LuMegaphoneOff,
  LuSettings,
  LuSwords,
  LuUsers,
} from "react-icons/lu";

import { cn } from "@/lib/utils";

/**
 * 아이콘은 이름으로 받는다.
 *
 * 레이아웃(Server Component)에서 아이콘 컴포넌트를 그대로 넘기면
 * "Functions cannot be passed directly to Client Components" 로 런타임에
 * 깨진다. 함수는 서버→클라이언트 경계를 넘지 못한다. 직렬화되는 문자열 키만
 * 넘기고 실제 컴포넌트는 여기서 고른다.
 */
const ICONS = {
  dashboard: LuLayoutDashboard,
  content: LuFolder,
  members: LuUsers,
  comments: LuBellRing,
  rooms: LuSwords,
  ads: LuMegaphoneOff,
  stats: LuChartColumn,
  banners: LuImage,
  settings: LuSettings,
} as const;

export type IconName = keyof typeof ICONS;

/**
 * 시안의 좌측 내비게이션.
 *
 * 활성 항목은 검은 배경 + 흰 글자로 반전된다 (primary 초록이 아니다 —
 * 초록은 실행 버튼에만 쓰여서 "지금 여기" 와 "누를 것" 이 섞이지 않는다).
 *
 * 하위 항목은 그 구역에 들어와 있을 때만 펼친다. 항상 펼쳐 두면 사이드바가
 * 길어지고 지금 어느 구역에 있는지가 흐려진다.
 */

export type NavItem = {
  href: string;
  label: string;
  icon?: IconName;
  /** 처리 대기 건수. 0 이면 표시하지 않는다. */
  badge?: number;
  /** 신고처럼 밀린 일은 danger, 진행중 방 개수처럼 상태 표시는 info. */
  badgeTone?: "danger" | "info";
  /** 아직 화면이 없는 항목. 눌리지 않게 하고 흐리게 둔다. */
  disabled?: boolean;
  children?: NavItem[];
};

export type NavGroup = { items: NavItem[] };

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 하위 항목 중 하나라도 현재 위치면 그 구역이 열린 것으로 본다. */
function sectionOpen(pathname: string, item: NavItem) {
  return (
    isActive(pathname, item.href) ||
    (item.children?.some((child) => isActive(pathname, child.href)) ?? false)
  );
}

function NavBadge({ value, tone }: { value: number; tone: "danger" | "info" }) {
  return (
    <span
      className={cn(
        "rounded-full px-1.75 py-0.5 text-[11px] font-semibold text-white tabular-nums",
        tone === "danger" ? "bg-destructive" : "bg-primary",
      )}
    >
      {value}
    </span>
  );
}

function NavEntry({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const open = sectionOpen(pathname, item);
  const Icon = item.icon ? ICONS[item.icon] : null;

  const inner = (
    <>
      <span className="flex min-w-0 items-center gap-2.5">
        {Icon ? <Icon aria-hidden className="size-4.5 shrink-0" /> : null}
        <span className="truncate">{item.label}</span>
      </span>
      {item.badge ? (
        <NavBadge value={item.badge} tone={item.badgeTone ?? "danger"} />
      ) : null}
    </>
  );

  return (
    <>
      {item.disabled ? (
        <span
          aria-disabled
          title="아직 만들지 않은 화면입니다"
          className="flex h-9.5 cursor-not-allowed items-center justify-between rounded-lg px-3 text-sm text-muted-foreground/50"
        >
          {inner}
        </span>
      ) : (
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-9.5 items-center justify-between rounded-lg px-3 text-sm transition-colors",
            open
              ? "bg-foreground font-medium text-background"
              : "hover:bg-accent",
          )}
        >
          {inner}
        </Link>
      )}

      {open && item.children?.length
        ? item.children.map((child) => {
            const childActive = isActive(pathname, child.href);

            const label = (
              <span className="flex items-center gap-2">
                <span aria-hidden className="text-[10px] leading-none">
                  ●
                </span>
                {/*
                  상위 항목은 검은 반전으로 현재 위치를 알린다. 하위까지 같은
                  방식을 쓰면 어디에 있는지 헷갈려서 굵기와 밑줄로 구분한다.
                */}
                <span
                  className={cn(
                    "border-b-3 pb-0.5",
                    childActive ? "border-primary" : "border-transparent",
                  )}
                >
                  {child.label}
                </span>
              </span>
            );

            return child.disabled ? (
              <span
                key={child.href}
                aria-disabled
                title="아직 만들지 않은 화면입니다"
                className="flex h-8.5 cursor-not-allowed items-center pl-6 text-sm text-muted-foreground/50"
              >
                {label}
              </span>
            ) : (
              <Link
                key={child.href}
                href={child.href}
                aria-current={childActive ? "page" : undefined}
                className={cn(
                  "flex h-8.5 items-center rounded-lg pl-6 text-sm transition-colors hover:bg-accent",
                  childActive ? "font-semibold" : "text-muted-foreground",
                )}
              >
                {label}
              </Link>
            );
          })
        : null}
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
    <aside className="flex w-55 shrink-0 flex-col gap-6 border-r-3 p-4.5 pt-6">
      <div className="flex flex-col gap-1 px-3">
        <span className="display text-xl leading-none">Playground</span>
        <span className="text-xs text-muted-foreground">운영자 콘솔</span>
      </div>

      {/* 첫 그룹은 일상 업무, 마지막 그룹은 설정. 사이를 비워 설정을 아래로 민다. */}
      {groups.map((group, index) => (
        <div
          key={index}
          className={cn(
            "flex flex-col gap-0.5",
            index === groups.length - 1 && groups.length > 1
              ? "mt-auto border-t-3 pt-4"
              : null,
          )}
        >
          {group.items.map((item) => (
            <NavEntry key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      ))}

      <div className="flex items-center gap-2.5 rounded-xl bg-muted p-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
          {initials}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-medium">
            {operator.name}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {operator.roleName ?? "역할 미지정"}
          </span>
        </span>
      </div>
    </aside>
  );
}
