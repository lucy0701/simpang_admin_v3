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

/**
 * URL 형식을 미리 검증한다.
 *
 * 값을 안 채우고 `https://<project-ref>.supabase.co` 를 그대로 두면
 * supabase-js 가 "Invalid supabaseUrl: Provided URL is malformed" 만 던져서
 * 원인을 짚기 어렵다. 여기서 무엇이 잘못됐는지 알려준다.
 */
function requiredUrl(value: string | undefined, name: string): string {
  const url = required(value, name);

  if (url.includes("<") || url.includes(">")) {
    throw new Error(
      `환경변수 ${name} 에 플레이스홀더가 그대로 남아 있습니다 (${url}). .env.local 에서 실제 Supabase 프로젝트 URL 로 바꿔주세요.`,
    );
  }

  try {
    new URL(url);
  } catch {
    throw new Error(
      `환경변수 ${name} 가 올바른 URL 이 아닙니다 (${url}). https://<project-ref>.supabase.co 형태여야 합니다.`,
    );
  }

  return url;
}

/** 브라우저·서버 양쪽에서 쓰는 공개 설정. anon key 는 RLS 로 보호된다. */
export function publicSupabaseConfig() {
  return {
    url: requiredUrl(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    anonKey: required(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
  };
}
