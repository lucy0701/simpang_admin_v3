import type { ReactNode } from "react";

/**
 * 시안의 화면 머리말: 대문자 제목 + 한 줄 요약 + 우측 액션.
 * 요약에는 "전체 42개 · 공개 34" 처럼 지금 화면의 규모를 넣는다.
 */
export function PageHeader({
  title,
  summary,
  actions,
}: {
  title: string;
  summary?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <h1 className="display text-2xl leading-none">{title}</h1>
        {summary ? (
          <p className="text-[13px] text-muted-foreground">{summary}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** 시안의 3px 테두리 · 20px 라운드 카드. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel flex flex-col gap-4 p-[18px] ${className ?? ""}`}>
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            {title ? <h2 className="text-sm font-semibold">{title}</h2> : null}
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** 대시보드 지표 타일. */
export function StatTile({
  label,
  value,
  note,
  tone = "muted",
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: "muted" | "primary" | "destructive";
}) {
  const noteTone = {
    muted: "text-muted-foreground",
    primary: "text-primary",
    destructive: "text-destructive",
  }[tone];

  return (
    <div className="panel flex flex-1 flex-col gap-2.5 p-[18px]">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-[34px] leading-none font-extrabold tabular-nums">
        {value}
      </span>
      {note ? <span className={`text-xs ${noteTone}`}>{note}</span> : null}
    </div>
  );
}

/** 데이터가 없을 때. 시안에는 없지만 실제 DB 는 비어 있을 수 있다. */
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-[14px] bg-muted/60 px-6 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-md text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
