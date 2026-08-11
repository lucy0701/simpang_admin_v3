/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Supabase 스키마 타입 — 지금은 플레이스홀더다.
 *
 * 모든 테이블을 느슨하게 열어두어 어떤 쿼리든 컴파일은 통과하지만, 컬럼 오타는
 * 잡아주지 못한다. 실제 타입 안전성을 얻으려면 CLI 로 생성해 이 파일을 통째로
 * 덮어쓰면 된다 (`<project-ref>` 는 Supabase 프로젝트 URL 의 서브도메인):
 *
 *   npx supabase login
 *   npm run db:types -- --project-id <project-ref>
 *
 * 생성된 파일도 `Database` 를 export 하므로 나머지 코드는 그대로 동작한다.
 */

type LooseTable = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: Record<string, LooseTable>;
    Views: Record<string, LooseTable>;
    Functions: Record<string, { Args: Record<string, any>; Returns: any }>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
