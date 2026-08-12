"use client";

import { useActionState, useMemo, useState } from "react";

import { Panel } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { createContent, type CreateState } from "./actions";

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

/** 총점 범위와 결과 유형 커버리지. 저장 전에 화면에서 바로 보여준다. */
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
      { min: 0, max: 0 },
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
    initialState,
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [status, setStatus] = useState<"draft" | "review" | "public">("draft");
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

  const { range, gaps } = useCoverage(questions, resultTypes);

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

  const patchQuestion = (index: number, patch: Partial<Question>) =>
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );

  const patchAnswer = (qi: number, ai: number, patch: Partial<Answer>) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi
          ? {
              ...q,
              answers: q.answers.map((a, j) =>
                j === ai ? { ...a, ...patch } : a,
              ),
            }
          : q,
      ),
    );

  const patchType = (index: number, patch: Partial<ResultType>) =>
    setResultTypes((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="payload" value={payload} />

      {state.errors?.length ? (
        <Alert variant="destructive">
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

      <Panel title="기본 정보">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="내 안의 물고기 찾기"
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              placeholder="목록과 공유 카드에 쓰입니다."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="slug">슬러그</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="find-your-fish"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              공유 URL 에 쓰입니다. 영소문자 · 숫자 · 하이픈.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="thumbnail">썸네일 URL</Label>
            <Input
              id="thumbnail"
              value={thumbnail}
              onChange={(event) => setThumbnail(event.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
      </Panel>

      <Panel
        title={`문항 ${questions.length}`}
        description={`가능한 총점 ${range.min} ~ ${range.max}점. 선택지마다 점수를 주면 합산해서 결과 유형을 정합니다.`}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
          >
            문항 추가
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          {questions.map((question, qi) => (
            <div key={qi} className="flex flex-col gap-3 rounded-[14px] border-[3px] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {String(qi + 1).padStart(2, "0")}
                </span>
                {questions.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setQuestions((prev) => prev.filter((_, i) => i !== qi))
                    }
                  >
                    문항 삭제
                  </Button>
                ) : null}
              </div>

              <Input
                value={question.question}
                onChange={(event) =>
                  patchQuestion(qi, { question: event.target.value })
                }
                placeholder="주말 아침에 눈을 뜨면?"
              />

              <Input
                value={question.image ?? ""}
                onChange={(event) =>
                  patchQuestion(qi, { image: event.target.value || null })
                }
                placeholder="문항 이미지 URL (선택)"
              />

              <div className="flex flex-col gap-2">
                {question.answers.map((answer, ai) => (
                  <div key={ai} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-xs font-semibold text-muted-foreground">
                      {String.fromCharCode(65 + ai)}
                    </span>
                    <Input
                      value={answer.answer}
                      onChange={(event) =>
                        patchAnswer(qi, ai, { answer: event.target.value })
                      }
                      placeholder="선택지 내용"
                    />
                    <Input
                      type="number"
                      value={answer.score}
                      onChange={(event) =>
                        patchAnswer(qi, ai, {
                          score: Number(event.target.value),
                        })
                      }
                      className="w-20 shrink-0 text-right"
                      aria-label={`${ai + 1}번 선택지 점수`}
                    />
                    {question.answers.length > 2 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="선택지 삭제"
                        onClick={() =>
                          patchQuestion(qi, {
                            answers: question.answers.filter(
                              (_, j) => j !== ai,
                            ),
                          })
                        }
                      >
                        ×
                      </Button>
                    ) : null}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="self-start"
                  onClick={() =>
                    patchQuestion(qi, {
                      answers: [...question.answers, { answer: "", score: 1 }],
                    })
                  }
                >
                  선택지 추가
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title={`결과 유형 ${resultTypes.length}`}
        description="총점이 어느 범위에 드는지로 결과가 정해집니다. 범위는 겹치지 않게 하고, 빈 구간이 없어야 합니다."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setResultTypes((prev) => [...prev, emptyResultType()])}
          >
            결과 유형 추가
          </Button>
        }
      >
        {gaps.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>덮이지 않는 점수가 있습니다</AlertTitle>
            <AlertDescription>
              {gaps.join(", ")}점을 받은 플레이어에게 보여줄 결과가 없습니다.
              공개하려면 이 구간을 채워야 합니다.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-4">
          {resultTypes.map((type, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-[14px] border-[3px] p-4"
            >
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex min-w-48 flex-1 flex-col gap-2">
                  <Label>유형 이름</Label>
                  <Input
                    value={type.name}
                    onChange={(event) =>
                      patchType(index, { name: event.target.value })
                    }
                    placeholder="깊은 바다 고래"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>최소 점수</Label>
                  <Input
                    type="number"
                    value={type.min_score}
                    onChange={(event) =>
                      patchType(index, { min_score: Number(event.target.value) })
                    }
                    className="w-24 text-right"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>최대 점수</Label>
                  <Input
                    type="number"
                    value={type.max_score}
                    onChange={(event) =>
                      patchType(index, { max_score: Number(event.target.value) })
                    }
                    className="w-24 text-right"
                  />
                </div>
                {resultTypes.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setResultTypes((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    삭제
                  </Button>
                ) : null}
              </div>

              <Textarea
                value={type.description}
                onChange={(event) =>
                  patchType(index, { description: event.target.value })
                }
                rows={2}
                placeholder="결과 설명"
              />

              <Input
                value={type.card_image ?? ""}
                onChange={(event) =>
                  patchType(index, { card_image: event.target.value || null })
                }
                placeholder="공유 카드 이미지 URL (1:1 권장, 선택)"
              />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="노출 설정">
        <div className="flex flex-col gap-3">
          {(
            [
              ["isHomeFeatured", "홈 HOT NOW 편성"],
              ["allowComment", "댓글 허용"],
              ["allowGuestPlay", "비로그인 플레이"],
              ["showResultAd", "결과 광고 노출"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key}>{label}</Label>
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
      </Panel>

      <Panel title="저장">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">상태</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as "draft" | "review" | "public")
              }
            >
              <SelectTrigger id="status" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">작성중</SelectItem>
                <SelectItem value="review">검수 요청</SelectItem>
                <SelectItem value="public" disabled={!canPublish}>
                  바로 공개
                </SelectItem>
              </SelectContent>
            </Select>
            {!canPublish ? (
              <p className="text-xs text-muted-foreground">
                공개 권한이 없어 바로 공개할 수 없습니다. 검수 요청으로
                저장하세요.
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "저장 중…" : "저장"}
          </Button>
        </div>
      </Panel>
    </form>
  );
}
