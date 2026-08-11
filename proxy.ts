import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/supabase/database.types";
import { publicSupabaseConfig } from "@/lib/supabase/env";

/**
 * Next 16 에서 `middleware.ts` 는 `proxy.ts` 로 이름이 바뀌었다. 동작은 동일하다.
 *
 * 역할은 두 가지다.
 *  1. 매 요청마다 Supabase 액세스 토큰을 갱신하고 갱신된 쿠키를 응답에 실어 보낸다.
 *     (Server Component 는 쿠키를 쓸 수 없으므로 이 갱신이 없으면 세션이 끊긴다)
 *  2. 미로그인 사용자를 /login 으로 보내는 낙관적 리다이렉트.
 *
 * 여기서 DB 조회를 하지 않는 게 중요하다. proxy 는 prefetch 를 포함한 모든 요청에서
 * 돌기 때문이다. 실제 인가 판단은 lib/auth/dal.ts 에서 한다.
 */

// /invite 는 아직 계정이 없는 사람이 여는 링크라 반드시 열려 있어야 한다.
const PUBLIC_PATHS = ["/login", "/auth", "/invite"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = publicSupabaseConfig();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // 갱신된 세션 쿠키가 담긴 응답이 CDN 에 캐시되지 않도록 하는 헤더들.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // 응답을 만들기 전에 호출해야 갱신된 토큰이 쿠키에 실린다.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  const { pathname } = request.nextUrl;

  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return withRefreshedCookies(NextResponse.redirect(loginUrl), response);
  }

  if (isAuthenticated && pathname === "/login") {
    return withRefreshedCookies(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      response,
    );
  }

  return response;
}

/** 리다이렉트로 갈아탈 때 방금 갱신된 세션 쿠키를 잃지 않도록 옮겨 담는다. */
function withRefreshedCookies(
  target: NextResponse,
  source: NextResponse,
): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  return target;
}

export const config = {
  // 정적 자산에는 돌지 않게 한다. matcher 가 없으면 _next/static, public/ 까지 걸려
  // CSS·JS·이미지가 로그인 리다이렉트에 막힌다.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
