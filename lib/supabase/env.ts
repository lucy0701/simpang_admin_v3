/**
 * Supabase 환경변수 접근 지점.
 *
 * NEXT_PUBLIC_* 는 빌드 타임에 인라인되므로 반드시 `process.env.NEXT_PUBLIC_X`
 * 형태로 정적 참조해야 한다. (`process.env[name]` 같은 동적 접근은 인라인되지 않음)
 *
 * 값 검증은 모듈 로드 시점이 아니라 호출 시점에 한다. 모듈 최상단에서 throw 하면
 * 환경변수 없이 `next build` 만 돌릴 때 빌드가 깨진다.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `환경변수 ${name} 가 없습니다. .env.local.example 을 참고해 .env.local 을 채워주세요.`,
    );
  }
  return value;
}

/** 브라우저·서버 양쪽에서 쓰는 공개 설정. anon key 는 RLS 로 보호된다. */
export function publicSupabaseConfig() {
  return {
    url: required(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    anonKey: required(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
  };
}
