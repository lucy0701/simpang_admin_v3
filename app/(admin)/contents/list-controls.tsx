import Link from "next/link";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * 검색·필터·페이지 이동은 전부 URL 로 표현한다.
 * 서버에서 그대로 쿼리에 반영되고, 링크를 공유하거나 새로고침해도 상태가 남는다.
 */

function withParam(
  base: string,
  params: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
): string {
  const merged = { ...params, ...patch };
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export function ListControls({
  basePath,
  params,
  typeOptions,
  statusOptions,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  /** 비우면 유형 필터를 감춘다 (MBTI 전용 목록처럼 유형이 하나뿐일 때). */
  typeOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 검색은 GET 폼이라 JS 없이도 동작한다. */}
      <form action={basePath} className="min-w-56 flex-1">
        {Object.entries(params)
          .filter(([key]) => key !== "search" && key !== "page")
          .map(([key, value]) =>
            value ? (
              <input key={key} type="hidden" name={key} value={value} />
            ) : null,
          )}
        <Input
          name="search"
          defaultValue={params.search ?? ""}
          placeholder="제목으로 검색"
          aria-label="제목으로 검색"
        />
      </form>

      {typeOptions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {[{ value: "", label: "전체" }, ...typeOptions].map((option) => {
            const active = (params.type ?? "") === option.value;
            return (
              <Link
                key={option.value || "all"}
                href={withParam(basePath, params, {
                  type: option.value || undefined,
                  page: undefined,
                })}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "hover:bg-accent",
                )}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        {[{ value: "", label: "상태 전체" }, ...statusOptions].map((option) => {
          const active = (params.status ?? "") === option.value;
          return (
            <Link
              key={option.value || "all"}
              href={withParam(basePath, params, {
                status: option.value || undefined,
                page: undefined,
              })}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "hover:bg-accent",
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Pagination({
  basePath,
  params,
  page,
  total,
  pageSize,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  total: number;
  pageSize: number;
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage <= 1) return null;

  // 페이지가 많아져도 버튼이 넘치지 않게 현재 위치 주변만 보여준다.
  const start = Math.max(1, Math.min(page - 2, lastPage - 4));
  const pages = Array.from(
    { length: Math.min(5, lastPage) },
    (_, index) => start + index,
  ).filter((value) => value <= lastPage);

  const item = (label: string, target: number, disabled: boolean) =>
    disabled ? (
      <span
        key={label}
        className="flex size-9 items-center justify-center rounded-lg border text-sm text-muted-foreground/40"
      >
        {label}
      </span>
    ) : (
      <Link
        key={label}
        href={withParam(basePath, params, { page: String(target) })}
        className="flex size-9 items-center justify-center rounded-lg border text-sm hover:bg-accent"
      >
        {label}
      </Link>
    );

  return (
    <nav
      aria-label="페이지"
      className="flex items-center justify-center gap-1.5 pt-2"
    >
      {item("‹", page - 1, page <= 1)}
      {pages.map((value) => (
        <Link
          key={value}
          href={withParam(basePath, params, {
            page: value === 1 ? undefined : String(value),
          })}
          aria-current={value === page ? "page" : undefined}
          className={cn(
            "flex size-9 items-center justify-center rounded-lg border text-sm tabular-nums transition-colors",
            value === page
              ? "border-foreground bg-foreground text-background"
              : "hover:bg-accent",
          )}
        >
          {value}
        </Link>
      ))}
      {item("›", page + 1, page >= lastPage)}
    </nav>
  );
}
