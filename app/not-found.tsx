import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * 로그인 직후 여기로 오는 경우가 있다. 로그인 전에 열어둔 주소가 존재하지 않는
 * 경로였다면, proxy 가 붙인 ?next= 를 따라 로그인 후 그 주소로 돌아오기 때문이다.
 * 그래서 빈 404 대신 대시보드로 가는 길을 준다.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-start gap-4">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-muted-foreground">
          주소가 바뀌었거나 아직 만들지 않은 페이지입니다.
        </p>
        <Button asChild className="mt-2">
          <Link href="/dashboard">대시보드로 가기</Link>
        </Button>
      </div>
    </main>
  );
}
