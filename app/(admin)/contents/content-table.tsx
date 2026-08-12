"use client";

import { useActionState, useState } from "react";

import { EmptyState } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContentRow } from "@/lib/data/queries";
import { cn } from "@/lib/utils";

import { bulkDelete, bulkFeature, bulkPublish, type BulkState } from "./actions";

const initialState: BulkState = {};

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  public: { label: "공개", className: "bg-primary text-primary-foreground" },
  review: {
    label: "검수 대기",
    className: "bg-yellow-300 text-yellow-950",
  },
  private: { label: "비공개", className: "bg-muted text-muted-foreground" },
  draft: { label: "작성중", className: "bg-muted text-muted-foreground" },
};

export function ContentTable({
  rows,
  typeLabels,
  emptyTitle,
  emptyDescription,
}: {
  rows: ContentRow[];
  typeLabels: Record<string, string>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [publishState, publishAction, publishing] = useActionState(
    bulkPublish,
    initialState,
  );
  const [featureState, featureAction, featuring] = useActionState(
    bulkFeature,
    initialState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    bulkDelete,
    initialState,
  );

  const pending = publishing || featuring || deleting;
  const message =
    publishState.error ??
    featureState.error ??
    deleteState.error ??
    publishState.done ??
    featureState.done ??
    deleteState.done;
  const isError = Boolean(
    publishState.error ?? featureState.error ?? deleteState.error,
  );

  const allChecked = rows.length > 0 && selected.length === rows.length;

  const toggleAll = () =>
    setSelected(allChecked ? [] : rows.map((row) => row.id));

  const toggle = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {message ? (
        <p
          role="status"
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isError
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary",
          )}
        >
          {message}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="전체 선택"
                  className="size-4 accent-[var(--primary)]"
                />
              </TableHead>
              <TableHead className="w-16">썸네일</TableHead>
              <TableHead>제목</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">플레이</TableHead>
              <TableHead className="text-right">좋아요</TableHead>
              <TableHead className="text-right">댓글</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const status = STATUS_STYLE[row.status] ?? {
                label: row.status,
                className: "bg-muted text-muted-foreground",
              };
              const checked = selected.includes(row.id);

              return (
                <TableRow key={row.id} data-state={checked ? "selected" : undefined}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(row.id)}
                      aria-label={`${row.title} 선택`}
                      className="size-4 accent-[var(--primary)]"
                    />
                  </TableCell>
                  <TableCell>
                    {row.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.thumbnail}
                        alt=""
                        className="size-10 rounded-md object-cover"
                      />
                    ) : (
                      <span className="block size-10 rounded-md bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {row.title}
                      {row.isHomeFeatured ? (
                        <Badge variant="outline">홈 편성</Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeLabels[row.contentType] ?? row.contentType}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2.5 py-1 text-xs font-medium",
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.playCount.toLocaleString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.likeCount.toLocaleString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.commentCount.toLocaleString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {new Date(row.createdAt).toLocaleDateString("ko-KR", {
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* 수정 화면은 아직 없다. 링크를 걸면 404 로 보내게 된다. */}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      title="수정 화면은 아직 만들지 않았습니다"
                    >
                      수정
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 선택 액션 바. 시안처럼 목록 하단에 붙는다. */}
      {selected.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-foreground px-4 py-3 text-background">
          <span className="text-sm">{selected.length}개 선택됨</span>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { action: publishAction, label: "공개 전환" },
              { action: featureAction, label: "홈 편성" },
            ].map(({ action, label }) => (
              <form key={label} action={action}>
                {selected.map((id) => (
                  <input key={id} type="hidden" name="id" value={id} />
                ))}
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  // 액션 바는 배경이 반전돼 있어 --border 를 그대로 쓰면
                  // 테두리가 배경에 묻힌다. 대비되는 색을 직접 준다.
                  className="border-background/40 bg-transparent text-background hover:bg-background/15 hover:text-background"
                >
                  {label}
                </Button>
              </form>
            ))}

            {/* 삭제는 되돌릴 수 없어 한 번 더 묻는다. 네이티브 confirm 은 쓰지 않는다. */}
            {confirmingDelete ? (
              <form action={deleteAction} className="flex items-center gap-2">
                {selected.map((id) => (
                  <input key={id} type="hidden" name="id" value={id} />
                ))}
                <span className="text-xs">되돌릴 수 없습니다.</span>
                <Button
                  type="submit"
                  size="sm"
                  variant="destructive"
                  disabled={pending}
                >
                  정말 삭제
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-background"
                  onClick={() => setConfirmingDelete(false)}
                >
                  취소
                </Button>
              </form>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() => setConfirmingDelete(true)}
              >
                삭제
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
