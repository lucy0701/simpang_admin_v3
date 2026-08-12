import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 심리테스트 등록.
 *
 * 스키마가 정한 채점 모델을 그대로 따른다.
 *   - 답변마다 점수 하나(answers[].score)를 주고 합산한다
 *   - 결과 유형은 min_score~max_score 범위로 판정한다
 * 즉 점수 축이 하나뿐이라, 선택지 하나가 여러 결과 유형에 점수를 나눠 주는
 * 방식(시안의 "고래 +2 / 해마 +1")은 표현할 수 없다.
 *
 * 저장 대상이 세 테이블(content, mbti_test_question, mbti_test_result_type)로
 * 나뉘는데 PostgREST 에는 여러 테이블을 묶는 트랜잭션이 없다. 그래서 content 를
 * 먼저 만들고 실패 시 되돌리는 보상 삭제로 처리한다.
 */

export type Answer = { answer: string; score: number };
export type Question = {
  order_no: number;
  question: string;
  image: string | null;
  answers: Answer[];
};
export type ResultType = {
  name: string;
  description: string | null;
  min_score: number;
  max_score: number;
  card_image: string | null;
};

export type PsychotestInput = {
  title: string;
  description: string | null;
  thumbnail: string | null;
  slug: string | null;
  status: "draft" | "review" | "public";
  isHomeFeatured: boolean;
  allowComment: boolean;
  allowGuestPlay: boolean;
  showResultAd: boolean;
  questions: Question[];
  resultTypes: ResultType[];
};

/** 문항 구성에서 실제로 나올 수 있는 총점 범위. */
export function scoreRange(questions: Question[]): { min: number; max: number } {
  return questions.reduce(
    (acc, question) => {
      const scores = question.answers.map((a) => a.score);
      if (scores.length === 0) return acc;
      return {
        min: acc.min + Math.min(...scores),
        max: acc.max + Math.max(...scores),
      };
    },
    { min: 0, max: 0 },
  );
}

/**
 * 결과 유형이 가능한 총점을 빠짐없이 덮는지 검사한다.
 *
 * 이게 어긋나면 특정 점수를 받은 플레이어에게 보여줄 결과가 없다. 저장 시점에
 * 막지 않으면 서비스에서 빈 화면으로 드러난다.
 */
export function findScoreGaps(
  questions: Question[],
  resultTypes: ResultType[],
): string[] {
  if (questions.length === 0 || resultTypes.length === 0) return [];

  const { min, max } = scoreRange(questions);
  const covered = new Set<number>();
  for (const type of resultTypes) {
    for (let s = type.min_score; s <= type.max_score; s += 1) covered.add(s);
  }

  const gaps: number[] = [];
  for (let s = min; s <= max; s += 1) if (!covered.has(s)) gaps.push(s);
  if (gaps.length === 0) return [];

  // 연속 구간으로 묶어서 "3~5점" 처럼 읽히게 한다.
  const ranges: string[] = [];
  let start = gaps[0];
  let prev = gaps[0];
  for (const value of gaps.slice(1)) {
    if (value === prev + 1) {
      prev = value;
      continue;
    }
    ranges.push(start === prev ? `${start}점` : `${start}~${prev}점`);
    start = value;
    prev = value;
  }
  ranges.push(start === prev ? `${start}점` : `${start}~${prev}점`);
  return ranges;
}

export type ValidationResult = { errors: string[]; warnings: string[] };

export function validatePsychotest(input: PsychotestInput): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input.title.trim()) errors.push("제목을 입력해주세요.");

  if (input.slug && !/^[a-z0-9-]+$/.test(input.slug)) {
    errors.push("슬러그는 영소문자·숫자·하이픈만 쓸 수 있습니다.");
  }

  if (input.questions.length === 0) {
    errors.push("문항을 최소 1개 이상 만들어주세요.");
  }

  input.questions.forEach((question, index) => {
    const label = `문항 ${String(index + 1).padStart(2, "0")}`;
    if (!question.question.trim()) errors.push(`${label}: 질문이 비어 있습니다.`);
    if (question.answers.length < 2) {
      errors.push(`${label}: 선택지를 2개 이상 만들어주세요.`);
    }
    question.answers.forEach((answer, answerIndex) => {
      if (!answer.answer.trim()) {
        errors.push(
          `${label}: ${answerIndex + 1}번 선택지 내용이 비어 있습니다.`,
        );
      }
      if (!Number.isInteger(answer.score)) {
        errors.push(`${label}: ${answerIndex + 1}번 선택지 점수는 정수여야 합니다.`);
      }
    });
  });

  if (input.resultTypes.length === 0) {
    errors.push("결과 유형을 최소 1개 이상 만들어주세요.");
  }

  input.resultTypes.forEach((type, index) => {
    const label = `결과 유형 ${index + 1}`;
    if (!type.name.trim()) errors.push(`${label}: 이름이 비어 있습니다.`);
    if (type.min_score > type.max_score) {
      errors.push(`${label}: 최소 점수가 최대 점수보다 큽니다.`);
    }
  });

  // 점수 구멍은 저장 자체를 막지는 않되(작성 중일 수 있다), 공개하려면 막는다.
  const gaps = findScoreGaps(input.questions, input.resultTypes);
  if (gaps.length > 0) {
    const message = `결과 유형이 ${gaps.join(", ")} 구간을 덮지 않습니다. 이 점수를 받은 플레이어에게 보여줄 결과가 없습니다.`;
    if (input.status === "public") errors.push(message);
    else warnings.push(message);
  }

  return { errors, warnings };
}

export async function createPsychotest(
  input: PsychotestInput,
  authorOperatorId: string,
): Promise<{ contentId: number } | { error: string }> {
  const admin = createAdminClient();

  const { data: content, error: contentError } = await admin
    .from("content")
    .insert({
      title: input.title.trim(),
      description: input.description,
      thumbnail: input.thumbnail,
      content_type: "psychotest",
      status: input.status,
      slug: input.slug || null,
      author_operator_id: authorOperatorId,
      is_home_featured: input.isHomeFeatured,
      allow_comment: input.allowComment,
      allow_guest_play: input.allowGuestPlay,
      show_result_ad: input.showResultAd,
      published_at: input.status === "public" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (contentError || !content) {
    const duplicateSlug = contentError?.message?.includes("content_slug_key");
    return {
      error: duplicateSlug
        ? "이미 사용 중인 슬러그입니다."
        : (contentError?.message ?? "콘텐츠를 만들지 못했습니다."),
    };
  }

  const contentId = content.id as number;

  /** 자식 테이블 저장이 실패하면 문항 없는 콘텐츠가 남으므로 되돌린다. */
  const rollback = async (message: string) => {
    await admin.from("content").delete().eq("id", contentId);
    return { error: message };
  };

  const { error: questionError } = await admin
    .from("mbti_test_question")
    .insert({
      content_id: contentId,
      questions: input.questions.map((question, index) => ({
        order_no: index + 1,
        question: question.question.trim(),
        image: question.image,
        answers: question.answers.map((answer) => ({
          answer: answer.answer.trim(),
          score: answer.score,
        })),
      })),
    });

  if (questionError) return rollback(questionError.message);

  const { error: typeError } = await admin.from("mbti_test_result_type").insert(
    input.resultTypes.map((type) => ({
      content_id: contentId,
      name: type.name.trim(),
      description: type.description,
      min_score: type.min_score,
      max_score: type.max_score,
      card_image: type.card_image,
    })),
  );

  if (typeError) return rollback(typeError.message);

  return { contentId };
}
