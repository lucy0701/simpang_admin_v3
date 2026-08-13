# Next.js App Router 파일 구조

> 기준: Next.js 16 (App Router). 문서 원본은 `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`.

## 먼저: 컨테이너/프레젠테이션 패턴은 안 쓴다

React 초기에 널리 쓰이던 **Container / Presentational** 분리(데이터를 가져오는 컨테이너 + 그리기만 하는 프레젠테이션)는 이제 권장되지 않는다. 훅이 나오면서 "데이터를 가져오는 컴포넌트"를 따로 만들 이유가 사라졌고, 이 패턴을 처음 정리한 Dan Abramov 본인이 2019년에 더 이상 권하지 않는다고 밝혔다.

App Router 에서 그 자리를 대신하는 건 **Server Component / Client Component** 구분이다.

| 예전 | 지금 |
| --- | --- |
| Container — 데이터를 가져와 내려준다 | **Server Component** — `async` 로 DB·API 를 직접 읽는다 |
| Presentational — props 로 받아 그린다 | **Client Component** — `"use client"`, 상태·이벤트를 다룬다 |

차이가 중요하다. 컨테이너/프레젠테이션은 **관례**였지만, 서버/클라이언트는 **실제 실행 위치**가 다르다. 서버 컴포넌트의 코드는 브라우저로 내려가지 않으므로 여기에 DB 접근과 시크릿을 둔다.

### 나누는 기준

Client Component 로 만들어야 하는 경우는 정해져 있다.

- `useState` · `useReducer` · `useEffect` 등 훅을 쓸 때
- `onClick` · `onChange` 같은 이벤트 핸들러가 필요할 때
- 브라우저 API(`localStorage`, `window`)를 쓸 때

그 외에는 전부 Server Component 로 둔다. 기본값이 서버다.

### 경계는 최대한 아래로 내린다

페이지 전체를 `"use client"` 로 만들면 그 아래가 전부 클라이언트가 된다. 상호작용이 필요한 부분만 잘라내는 편이 낫다.

```
app/(admin)/contents/page.tsx        Server — DB 조회, 권한 확인
  └ content-table.tsx                Client — 체크박스 선택 상태
```

목록 조회와 권한 판단은 서버에 남고, 체크박스 선택만 클라이언트로 간다.

> **주의**: Server Component 는 함수를 Client Component 에 props 로 넘길 수 없다. 직렬화되지 않기 때문이다. 아이콘 컴포넌트를 그대로 넘겼다가 `Functions cannot be passed directly to Client Components` 로 런타임에 깨진 적이 있다 (`components/admin/sidebar.tsx` 의 `ICONS` 참고). 이럴 땐 문자열 키를 넘기고 클라이언트에서 컴포넌트를 고른다.

---

## Next.js 가 정하는 것 / 정하지 않는 것

Next.js 는 **라우팅에 관한 파일 이름만** 정한다. 나머지 폴더 구조는 "unopinionated" — 알아서 하라는 입장이다.

### 라우팅 규칙 (프레임워크가 정함)

폴더가 URL 세그먼트가 되고, 그 안의 특수 파일이 화면을 만든다.

| 파일 | 역할 |
| --- | --- |
| `page.tsx` | 이 경로의 화면. 이게 있어야 URL 이 열린다 |
| `layout.tsx` | 하위 경로를 감싸는 공통 UI. 이동해도 다시 마운트되지 않는다 |
| `loading.tsx` | Suspense 경계. 로딩 중 표시 |
| `error.tsx` | Error 경계 |
| `not-found.tsx` | 404 화면 |
| `route.ts` | API 엔드포인트 (page 와 같은 경로에 공존 불가) |

루트에는 `proxy.ts`(Next 16 에서 `middleware.ts` 가 이 이름으로 바뀌었다), `next.config.ts`, `instrumentation.ts` 가 온다.

### 폴더 표기 두 가지

```
app/(admin)/dashboard/page.tsx   →  /dashboard      괄호는 URL 에서 빠진다
app/_internal/helper.ts          →  라우팅에서 제외
```

- **`(group)`** — URL 에 영향을 주지 않고 라우트를 묶는다. 이 프로젝트의 `(admin)` 이 그렇다. 로그인이 필요한 화면들이 `(admin)/layout.tsx` 하나를 공유하지만 URL 은 `/dashboard` 다.
- **`_folder`** — 라우팅에서 통째로 빼는 private 폴더. `app` 안의 파일은 원래 `page`·`route` 가 아니면 라우팅되지 않으므로 필수는 아니고, 의도를 드러내는 용도다.

---

## 코드를 어디에 둘 것인가 — 세 가지 전략

공식 문서가 제시하는 선택지다. 정답은 없고 **한 가지를 골라 일관되게** 쓰는 게 전부다.

### 1. `app` 밖에 둔다 (이 프로젝트가 쓰는 방식)

```
app/          라우팅만
components/   공용 컴포넌트
lib/          데이터·인증·유틸
```

`app` 을 열면 화면 목록이 그대로 보인다. 공용 코드와 라우트가 섞이지 않는다.

### 2. `app` 안 최상위에 둔다

```
app/
  components/
  lib/
  dashboard/page.tsx
```

모든 코드가 `app` 아래 모인다. import 경로가 짧아지지만 라우트 폴더와 일반 폴더가 같은 층에 섞인다.

### 3. 기능·라우트별로 쪼갠다

```
app/
  components/          전역 공용
  dashboard/
    components/        이 화면 전용
    page.tsx
```

큰 프로젝트에서 화면별 코드가 멀어지지 않게 한다.

---

## 이 프로젝트의 구조

전략 1 을 쓰되, **한 화면에서만 쓰는 파일은 그 화면 폴더에 같이 둔다**(colocation). `app` 안의 파일은 `page`·`route`·`layout` 이 아니면 라우팅되지 않으므로 안전하다.

```
app/
  layout.tsx                      루트 레이아웃 (폰트·테마 스크립트)
  globals.css                     디자인 토큰, panel/display 유틸리티
  not-found.tsx
  login/
    page.tsx                      Server
    login-form.tsx                Client — 이 화면에서만 쓰므로 여기 둔다
  invite/[token]/
    page.tsx  accept-form.tsx  actions.ts
  (admin)/                        로그인이 필요한 구역 (URL 에는 안 나옴)
    layout.tsx                    사이드바 + requireOperator() 인가 경계
    dashboard/page.tsx
    contents/
      page.tsx                    전체 목록
      content-table.tsx           Client — 선택·일괄 처리
      list-controls.tsx           Server — 검색·필터·페이지네이션
      actions.ts                  Server Action (공개 전환·홈 편성·삭제)
      mbti/
        page.tsx
        new/  page.tsx  psychotest-form.tsx  actions.ts
    members/  comments/  operators/

components/
  ui/                             shadcn 생성물. 직접 고치되 재생성 시 덮어써진다
  admin/                          이 서비스 고유 컴포넌트
    sidebar.tsx  user-menu.tsx  theme.tsx  page-header.tsx

lib/
  supabase/                       클라이언트 3종 (browser / server / service_role)
  auth/                           dal.ts(인가 경계) · actions.ts · invite.ts · audit.ts
  data/                           화면용 조회 (queries.ts, psychotest.ts)
  utils.ts                        cn()

proxy.ts                          Next 16 의 middleware. 세션 갱신 + 낙관적 리다이렉트
docs/                             이 문서
```

### 규칙

**한 화면에서만 쓰면 그 폴더에, 두 곳 이상에서 쓰면 `components/` 로 옮긴다.**
`login-form.tsx` 는 `/login` 에서만 쓰므로 `app/login/` 에 있다. `page-header.tsx` 는 모든 화면이 쓰므로 `components/admin/` 에 있다.

**`actions.ts` 는 쓰는 화면 옆에 둔다.**
Server Action 은 그 화면의 동작이다. 다만 여러 화면이 공유하면 `lib/auth/actions.ts` 처럼 올린다.

**데이터 접근은 `lib/` 안에서만 한다.**
`lib/data/queries.ts` 와 `lib/auth/dal.ts` 에 `import "server-only"` 가 붙어 있어 클라이언트에서 import 하면 빌드가 깨진다. service_role 키가 브라우저로 새는 경로를 원천 차단한다.

**인가는 화면이 아니라 DAL 에서 판단한다.**
`proxy.ts` 의 리다이렉트는 UX 용 낙관적 검사다. 실제 차단은 `(admin)/layout.tsx` 의 `requireOperator()` 와 Server Action 안의 `checkPermission()` 이다. 화면에서 버튼을 숨겨도 Server Action 은 별도 진입점이라 거기서 다시 확인해야 한다.

---

## 파일 이름

프레임워크가 정한 이름(`page`·`layout`·`route`·`actions` 등) 외에는 **kebab-case** 로 쓴다.

```
content-table.tsx      list-controls.tsx      user-menu.tsx
```

컴포넌트 이름은 PascalCase(`ContentTable`), 파일 이름은 kebab-case 다. 대소문자만 다른 파일을 macOS 에서 만들면 git 이 헷갈리는 문제를 피할 수 있다.

---

## 자주 헷갈리는 것

**`layout.tsx` 는 이동해도 다시 마운트되지 않는다.** 사이드바의 열림 상태 같은 걸 여기 두면 페이지를 옮겨도 유지된다. 반대로 매번 초기화하고 싶으면 `template.tsx` 를 쓴다.

**`page.tsx` 의 `params` · `searchParams` 는 Promise 다.** Next 15 부터 바뀌었다. `const { id } = await params`.

**`cookies()` 도 async 다.** 그래서 `lib/supabase/server.ts` 의 `createClient()` 가 `async` 다.

**`components/ui/` 는 shadcn 이 생성한다.** 직접 고쳐도 되지만 `shadcn add` 로 같은 컴포넌트를 다시 받으면 덮어써진다. 오래 갈 수정은 `components/admin/` 에 감싸는 컴포넌트를 만드는 편이 안전하다.
