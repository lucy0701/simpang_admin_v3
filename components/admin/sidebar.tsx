"use client";

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LuBellRing,
  LuChevronDown,
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

import { UserMenu } from "./user-menu";

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
  /**
   * 자체 화면이 없는 묶음(예: 운영 설정)은 href 를 비운다.
   * 그러면 눌렀을 때 이동하지 않고 하위 목록만 열고 닫는다.
   */
  href?: string;
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

function isActive(pathname: string, href?: string) {
  if (!href) return false;
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
        tone === "danger" ? "bg-destructive" : "bg-primary"
      )}
    >
      {value}
    </span>
  );
}

function NavEntry({
  item,
  pathname,
  open,
  onToggle,
}: {
  item: NavItem;
  pathname: string;
  open: boolean;
  onToggle: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const active = isActive(pathname, item.href);
  const Icon = item.icon ? ICONS[item.icon] : null;
  const hasChildren = Boolean(item.children?.length);
  // href 가 없으면 이동 대상이 없으니 열고 닫기만 한다.
  const toggleOnly = !item.href && hasChildren;

  /*
   * 강조와 여닫힘은 별개다.
   * 강조는 "지금 이 구역에 있다"(경로가 정함), 여닫힘은 "목록을 펼쳤다"
   * (사용자가 정함). 하나로 묶으면 현재 구역에서 접었을 때 내가 어디 있는지
   * 표시가 통째로 사라진다.
   */
  const inSection = sectionOpen(pathname, item);

  /*
   * 하위 항목 중 "현재 위치"는 하나여야 한다.
   * /contents 와 /contents/mbti 처럼 한쪽이 다른 쪽의 상위 경로면 둘 다
   * 일치해버리므로, 가장 구체적인(경로가 긴) 것만 남긴다.
   */
  const activeChildHref = item.children
    ?.filter((child) => isActive(pathname, child.href))
    .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))[0]?.href;

  const inner = (
    <>
      <span className="flex min-w-0 items-center gap-2.5">
        {Icon ? <Icon aria-hidden className="size-4.5 shrink-0" /> : null}
        <span className="truncate">{item.label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {item.badge ? (
          <NavBadge value={item.badge} tone={item.badgeTone ?? "danger"} />
        ) : null}
        {/* 하위가 있다는 걸 알려준다. 이동하는 항목도 열리므로 함께 붙인다. */}
        {hasChildren ? (
          <motion.span
            aria-hidden
            animate={{ rotate: open ? 180 : 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.2, ease: "easeOut" }
            }
            className="flex"
          >
            <LuChevronDown className="size-4" />
          </motion.span>
        ) : null}
      </span>
    </>
  );

  /*
   * 강조 배경을 항목마다 따로 켜고 끄면 선택이 바뀔 때 뚝 끊긴다.
   * layoutId 로 하나의 요소를 공유해 항목 사이를 미끄러지게 한다.
   * 사이드바에서 강조되는 항목은 언제나 하나뿐이라 id 하나로 충분하다.
   */
  const pill = inSection ? (
    <motion.span
      layoutId="nav-pill"
      aria-hidden
      className="absolute inset-0 rounded-lg bg-foreground"
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 520, damping: 42, mass: 0.6 }
      }
    />
  ) : null;

  // 글자색 전환은 배경이 미끄러지는 시간과 맞춘다. 어긋나면 이동 중에 글자가
  // 배경과 같은 색이 되는 순간이 생긴다.
  const rowClass = cn(
    "relative flex h-9.5 w-full items-center justify-between rounded-lg px-3 text-sm transition-colors duration-200",
    inSection ? "font-medium text-background" : "hover:bg-accent"
  );

  const hover = reduceMotion ? undefined : { x: 2 };
  const tap = reduceMotion ? undefined : { scale: 0.985 };
  const rowMotion = {
    transition: { type: "spring" as const, stiffness: 600, damping: 40 },
  };

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
      ) : toggleOnly ? (
        <motion.button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          whileHover={hover}
          whileTap={tap}
          {...rowMotion}
          className={rowClass}
        >
          {pill}
          <span className="relative flex w-full items-center justify-between">
            {inner}
          </span>
        </motion.button>
      ) : (
        <motion.div whileHover={hover} whileTap={tap} {...rowMotion}>
          <Link
            href={item.href!}
            aria-current={active ? "page" : undefined}
            className={rowClass}
          >
            {pill}
            <span className="relative flex w-full items-center justify-between">
              {inner}
            </span>
          </Link>
        </motion.div>
      )}

      <AnimatePresence initial={false}>
        {open && item.children?.length ? (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : // 높이는 스프링으로 밀고 투명도는 짧게 끊어 잔상을 줄인다.
                  {
                    height: {
                      type: "spring",
                      stiffness: 420,
                      damping: 36,
                      mass: 0.7,
                    },
                    opacity: { duration: 0.15 },
                  }
            }
            // 접히는 중에 내용이 삐져나오지 않게 한다.
            className="flex flex-col gap-0.5 overflow-hidden"
          >
            {item.children.map((child) => {
              const childActive =
                Boolean(child.href) && child.href === activeChildHref;

              const label = (
                <span className="flex items-center gap-2">
                  {childActive && (
                    <span
                      aria-hidden
                      className="text-[10px] leading-none text-primary"
                    >
                      ●
                    </span>
                  )}
                  {/*
                  상위 항목은 검은 반전으로 현재 위치를 알린다. 하위까지 같은
                  방식을 쓰면 어디에 있는지 헷갈려서 굵기와 밑줄로 구분한다.
                  */}
                  <span className={"pb-0.5"}>{child.label}</span>
                </span>
              );

              return child.disabled ? (
                <span
                  key={child.label}
                  aria-disabled
                  title="아직 만들지 않은 화면입니다"
                  className="flex h-8.5 cursor-not-allowed items-center pl-6 text-sm text-muted-foreground/50"
                >
                  {label}
                </span>
              ) : (
                <motion.div
                  key={child.label}
                  whileHover={hover}
                  whileTap={tap}
                  {...rowMotion}
                >
                  <Link
                    href={child.href!}
                    aria-current={childActive ? "page" : undefined}
                    className={cn(
                      "flex h-8.5 items-center rounded-lg pl-6 text-sm transition-colors duration-200 hover:bg-accent",
                      childActive ? "font-semibold" : "text-muted-foreground"
                    )}
                  >
                    {label}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function Sidebar({
  groups,
  operator,
}: {
  groups: NavGroup[];
  operator: { name: string; email: string; roleName: string | null };
}) {
  const pathname = usePathname();

  /**
   * 여닫힘은 기본적으로 현재 경로가 정한다 (그 구역에 있으면 열림).
   * 사용자가 직접 누른 항목만 이 state 에 남아 경로보다 우선한다.
   */
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  const isOpen = (item: NavItem) =>
    toggled[item.label] ?? sectionOpen(pathname, item);

  const toggle = (item: NavItem) =>
    setToggled((prev) => ({ ...prev, [item.label]: !isOpen(item) }));

  return (
    /*
     * 사이드바는 뷰포트에 붙어 본문과 따로 논다.
     * self-start 가 없으면 flex 가 컨테이너 높이만큼 늘여버려서 sticky 가
     * 붙을 여백이 사라진다.
     */
    <aside className="sticky top-0 flex h-dvh w-55 shrink-0 flex-col self-start border-r p-4.5 pt-6">
      <div className="flex gap-2">
        <div className="w-0.5 rounded-lg bg-default" />
        <div className="flex flex-col gap-1 px-3">
          <span className="display text-xl leading-none">SIMPANG</span>
          <span className="text-xs text-muted-foreground">Admin Console</span>
        </div>
      </div>

      {/*
        메뉴 영역만 늘어나고 줄어든다. 마지막 그룹에 mt-auto 를 줘서 아래에
        붙이면, 하위 항목이 펼쳐질 때 아래를 밀지 않고 위로 자란다.
        항목이 많아 넘치면 이 영역만 스크롤된다.
      */}
      {/*
        layoutScroll: 스크롤되는 조상이 있으면 framer 가 위치를 잘못 재서
        강조 배경이 엉뚱한 곳으로 튄다.
        LayoutGroup: layoutId 를 공유하는 항목들이 서로 다른 컴포넌트에
        흩어져 있어 같은 그룹으로 묶어줘야 이동으로 인식한다.
      */}
      <motion.nav
        layoutScroll
        className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto py-6"
      >
        <LayoutGroup>
          {groups.map((group, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col gap-0.5",
                index === groups.length - 1 && groups.length > 1
                  ? "mt-auto"
                  : null
              )}
            >
              {group.items.map((item) => (
                <NavEntry
                  key={item.label}
                  item={item}
                  pathname={pathname}
                  open={isOpen(item)}
                  onToggle={() => toggle(item)}
                />
              ))}
            </div>
          ))}
        </LayoutGroup>
      </motion.nav>

      {/* 네임카드는 스크롤 영역 밖이라 항상 화면 맨 아래에 남는다. */}
      <UserMenu
        name={operator.name}
        email={operator.email}
        roleName={operator.roleName}
      />
    </aside>
  );
}
