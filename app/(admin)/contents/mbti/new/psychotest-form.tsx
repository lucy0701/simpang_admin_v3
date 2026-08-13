"use client";

import { useActionState, useMemo, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { createContent, type CreateState } from "./actions";

/**
 * 시안의 3열 편집기.
 *   왼쪽  문항 목록 — 지금 편집 중인 문항을 반전으로 표시
 *   가운데 선택한 문항 하나 — 질문·이미지·선택지
 *   오른쪽 결과 유형 · 공유 카드 · 노출 설정
 *
 * 저장 구조는 mbti_test_question 의 questions jsonb 형태를 그대로 따른다.
 *   [{ order_no, image, question, answers: [{ answer, score }] }]
 * 선택지가 여러 결과 유형에 점수를 나눠 주는 방식(MBTI 다축)은 아직 구현 대상이
 * 아니므로 선택지당 점수는 하나다. 결과는 총점이 어느 범위에 드는지로 정해진다.
 */

type Answer = { answer: string; score: number };
type Question = { question: string; image: string | null; answers: Answer[] };
type ResultType = {
  name: string;
  description: string;
  min_score: number;
  max_score: number;
  card_image: string | null;
};

const initialState: CreateState = {};

/** 결과 유형 구분용 색. 스키마에 색 컬럼이 없어 순서로 정한다(편집기 표시 전용). */
const TYPE_COLORS = [
  "bg-blue-500",
  "bg-pink-400",
  "bg-green-500",
  "bg-yellow-400",
  "bg-purple-500",
  "bg-orange-400",
];

const emptyQuestion = (): Question => ({
  question: "",
  image: null,
  answers: [
    { answer: "", score: 1 },
    { answer: "", score: 2 },
  ],
});

const emptyResultType = (): ResultType => ({
  name: "",
  description: "",
  min_score: 0,
  max_score: 0,
  card_image: null,
});

function useCoverage(questions: Question[], resultTypes: ResultType[]) {
  return useMemo(() => {
    const range = questions.reduce(
      (acc, q) => {
        const scores = q.answers.map((a) => a.score);
        if (scores.length === 0) return acc;
        return {
          min: acc.min + Math.min(...scores),
          max: acc.max + Math.max(...scores),
        };
      },
      { min: 0, max: 0 }
    );

    const covered = new Set<number>();
    for (const type of resultTypes) {
      for (let s = type.min_score; s <= type.max_score; s += 1) covered.add(s);
    }

    const gaps: number[] = [];
    if (questions.length > 0 && resultTypes.length > 0) {
      for (let s = range.min; s <= range.max; s += 1) {
        if (!covered.has(s)) gaps.push(s);
      }
    }
    return { range, gaps };
  }, [questions, resultTypes]);
}

export function PsychotestForm({ canPublish }: { canPublish: boolean }) {
  const [state, formAction, pending] = useActionState(
    createContent,
    initialState
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [flags, setFlags] = useState({
    isHomeFeatured: false,
    allowComment: true,
    allowGuestPlay: true,
    showResultAd: false,
  });
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [resultTypes, setResultTypes] = useState<ResultType[]>([
    emptyResultType(),
  ]);
  const [current, setCurrent] = useState(0);
  const [activeType, setActiveType] = useState(0);

  // 제출 버튼마다 다른 상태로 저장한다. 폼 제출 직전에 확정한다.
  const [status, setStatus] = useState<"draft" | "review" | "public">("draft");

  const { range, gaps } = useCoverage(questions, resultTypes);
  const question = questions[current] ?? questions[0];

  const payload = JSON.stringify({
    title,
    description: description || null,
    thumbnail: thumbnail || null,
    slug: slug || null,
    status,
    ...flags,
    questions: questions.map((q, index) => ({
      order_no: index + 1,
      question: q.question,
      image: q.image,
      answers: q.answers,
    })),
    resultTypes: resultTypes.map((type) => ({
      ...type,
      description: type.description || null,
    })),
  });

  const patchQuestion = (patch: Partial<Question>) =>
    setQuestions((prev) =>
      prev.map((q, i) => (i === current ? { ...q, ...patch } : q))
    );

  const patchAnswer = (index: number, patch: Partial<Answer>) =>
    patchQuestion({
      answers: question.answers.map((a, i) =>
        i === index ? { ...a, ...patch } : a
      ),
    });

  const patchType = (index: number, patch: Partial<ResultType>) =>
    setResultTypes((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
    setCurrent(questions.length);
  };

  const removeQuestion = () => {
    setQuestions((prev) => prev.filter((_, i) => i !== current));
    setCurrent((prev) => Math.max(0, prev - 1));
  };

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="payload" value={payload} />

      {state.errors?.length ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>저장하지 못했습니다</AlertTitle>
          <AlertDescription>
            <ul className="flex list-disc flex-col gap-1 pl-4">
              {state.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="panel flex flex-1 flex-col overflow-hidden">
        {/* ── 상단 바 ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="shrink-0 text-[13px] text-muted-foreground">
              콘텐츠 › MBTI ›
            </span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="제목을 입력하세요"
              aria-label="제목"
              className="h-9 max-w-md border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="mr-1 text-xs text-muted-foreground">
              자동 저장 없음
            </span>
            <Button
              type="submit"
              variant="outline"
              disabled={pending}
              onClick={() => setStatus("draft")}
            >
              임시저장
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={pending}
              onClick={() => setStatus("review")}
            >
              검수 요청
            </Button>
            <Button
              type="submit"
              disabled={pending || !canPublish}
              title={canPublish ? undefined : "공개 권한이 없습니다"}
              onClick={() => setStatus("public")}
            >
              공개
            </Button>
          </div>
        </div>

        {/* ── 3열 ── */}
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* 왼쪽: 문항 목록 */}
          <div className="flex w-full shrink-0 flex-col gap-3 border-b p-4 lg:w-65 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                문항 {questions.length}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addQuestion}
              >
                추가
              </Button>
            </div>

            <ol className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {questions.map((item, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-current={index === current ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      index === current
                        ? "bg-foreground font-medium text-background"
                        : "bg-muted/60 hover:bg-accent"
                    )}
                  >
                    <span className="font-mono text-xs opacity-70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">
                      {item.question || "(질문 없음)"}
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              문항 10~14개, 소요 2분 이하일 때 완주율이 가장 높습니다.
            </p>
          </div>

          {/* 가운데: 선택한 문항 */}
          <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold">
                문항 {String(current + 1).padStart(2, "0")}
              </h2>
              <span className="h-px flex-1 bg-border" />
              {questions.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={removeQuestion}
                >
                  삭제
                </Button>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="question">질문</Label>
              <Textarea
                id="question"
                value={question.question}
                onChange={(event) =>
                  patchQuestion({ question: event.target.value })
                }
                rows={3}
                placeholder="친구 약속이 갑자기 취소됐다. 제일 먼저 드는 생각은?"
                className="text-base"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_240px]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="question-image">문항 이미지 (선택)</Label>
                {question.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={question.image}
                    alt=""
                    className="h-32 w-full rounded-xl border border-dashed object-cover"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
                    이미지 URL 을 입력하세요 · 1200×800 권장
                  </div>
                )}
                <Input
                  id="question-image"
                  value={question.image ?? ""}
                  onChange={(event) =>
                    patchQuestion({ image: event.target.value || null })
                  }
                  placeholder="https://…"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>문항 유형</Label>
                <div className="flex h-9 items-center rounded-lg border px-3 text-sm text-muted-foreground">
                  선택형 (단일)
                </div>
                <p className="text-xs text-muted-foreground">
                  현재 스키마는 단일 선택만 저장합니다.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>
                  선택지 {question.answers.length} · 선택지마다 점수를 줍니다
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    patchQuestion({
                      answers: [...question.answers, { answer: "", score: 1 }],
                    })
                  }
                >
                  선택지 추가
                </Button>
              </div>

              {question.answers.map((answer, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  <span className="w-4 shrink-0 text-sm font-semibold text-muted-foreground">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <Input
                    value={answer.answer}
                    onChange={(event) =>
                      patchAnswer(index, { answer: event.target.value })
                    }
                    placeholder="선택지 내용"
                    className="border-0 shadow-none focus-visible:ring-0"
                  />
                  <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                    <span className="text-xs text-muted-foreground">점수</span>
                    <Input
                      type="number"
                      value={answer.score}
                      onChange={(event) =>
                        patchAnswer(index, {
                          score: Number(event.target.value),
                        })
                      }
                      aria-label={`${index + 1}번 선택지 점수`}
                      className="h-6 w-14 border-0 bg-transparent p-0 text-right text-sm font-semibold shadow-none focus-visible:ring-0"
                    />
                  </div>
                  {question.answers.length > 2 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="선택지 삭제"
                      onClick={() =>
                        patchQuestion({
                          answers: question.answers.filter(
                            (_, i) => i !== index
                          ),
                        })
                      }
                    >
                      ×
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 결과 유형 · 공유 카드 · 설정 */}
          <div className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-t p-4 lg:w-80 lg:border-t-0 lg:border-l">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  결과 유형 {resultTypes.length}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setResultTypes((prev) => [...prev, emptyResultType()]);
                    setActiveType(resultTypes.length);
                  }}
                >
                  추가
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                가능한 총점 {range.min}~{range.max}점. 총점이 드는 범위로 결과가
                정해집니다.
              </p>

              {gaps.length > 0 ? (
                <p className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                  {gaps.join(", ")}점을 덮는 유형이 없습니다. 이 점수를 받은
                  플레이어에게 보여줄 결과가 없습니다.
                </p>
              ) : null}

              <ul className="flex flex-col gap-2">
                {resultTypes.map((type, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => setActiveType(index)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                        index === activeType
                          ? "border-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <span
                        className={cn(
                          "size-8 shrink-0 rounded-md",
                          TYPE_COLORS[index % TYPE_COLORS.length]
                        )}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {type.name || "(이름 없음)"}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {type.min_score}~{type.max_score}점
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* 선택한 결과 유형 편집 */}
            {resultTypes[activeType] ? (
              <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">
                    결과 유형 {activeType + 1} 편집
                  </span>
                  {resultTypes.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        setResultTypes((prev) =>
                          prev.filter((_, i) => i !== activeType)
                        );
                        setActiveType((prev) => Math.max(0, prev - 1));
                      }}
                    >
                      삭제
                    </Button>
                  ) : null}
                </div>

                <Input
                  value={resultTypes[activeType].name}
                  onChange={(event) =>
                    patchType(activeType, { name: event.target.value })
                  }
                  placeholder="깊은 바다 고래"
                />

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={resultTypes[activeType].min_score}
                    onChange={(event) =>
                      patchType(activeType, {
                        min_score: Number(event.target.value),
                      })
                    }
                    aria-label="최소 점수"
                    className="text-right"
                  />
                  <span className="text-xs text-muted-foreground">~</span>
                  <Input
                    type="number"
                    value={resultTypes[activeType].max_score}
                    onChange={(event) =>
                      patchType(activeType, {
                        max_score: Number(event.target.value),
                      })
                    }
                    aria-label="최대 점수"
                    className="text-right"
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">
                    점
                  </span>
                </div>

                <Textarea
                  value={resultTypes[activeType].description}
                  onChange={(event) =>
                    patchType(activeType, { description: event.target.value })
                  }
                  rows={2}
                  placeholder="결과 설명"
                />

                <Input
                  value={resultTypes[activeType].card_image ?? ""}
                  onChange={(event) =>
                    patchType(activeType, {
                      card_image: event.target.value || null,
                    })
                  }
                  placeholder="공유 카드 이미지 URL"
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">공유 카드 미리보기</span>
              <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
                {resultTypes[activeType]?.card_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resultTypes[activeType].card_image ?? ""}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : null}
                {/* 카드 이미지는 무엇이 올지 모른다. 밝은 이미지나 빈 플레이스홀더
                    위에서도 유형명이 읽히도록 어두운 스크림을 항상 깐다. */}
                <span className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-3 left-3 text-lg font-bold text-white">
                  {resultTypes[activeType]?.name || "유형 이름"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                카카오 공유 시 1:1 로 잘립니다. 유형명은 하단 좌측에 고정됩니다.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold">노출 설정</span>
              {(
                [
                  ["isHomeFeatured", "홈 HOT NOW 편성"],
                  ["allowComment", "댓글 허용"],
                  ["allowGuestPlay", "비로그인 플레이"],
                  ["showResultAd", "결과 광고 노출"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-[13px] font-normal">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={flags[key]}
                    onCheckedChange={(checked) =>
                      setFlags((prev) => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t pt-4">
              <span className="text-sm font-semibold">기본 정보</span>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="slug" className="text-xs">
                  슬러그
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="find-your-fish"
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="thumbnail" className="text-xs">
                  썸네일 URL
                </Label>
                <Input
                  id="thumbnail"
                  value={thumbnail}
                  onChange={(event) => setThumbnail(event.target.value)}
                  placeholder="https://…"
                  className="text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description" className="text-xs">
                  설명
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={2}
                  placeholder="목록과 공유 카드에 쓰입니다."
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
