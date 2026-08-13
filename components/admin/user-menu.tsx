"use client";

import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth/actions";

import { THEME_LABEL, useTheme, type Theme } from "./theme";

const THEMES: Theme[] = ["system", "dark", "light"];

/**
 * 사이드바 맨 아래 유저 카드. 누르면 오른쪽으로 개인 설정 메뉴가 열린다.
 * 지금은 테마와 로그아웃만 있고, 계정·타임존 같은 항목이 여기 붙을 자리다.
 */
export function UserMenu({
  name,
  email,
  roleName,
}: {
  name: string;
  email: string;
  roleName: string | null;
}) {
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();

  const initials = name.slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full shrink-0 items-center gap-2.5 rounded-xl bg-muted p-2.5 text-left transition-colors hover:bg-accent"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
            {initials}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-medium">{name}</span>
            <span className="truncate text-[11px] text-muted-foreground">
              {roleName ?? "역할 미지정"}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>

      {/* 사이드바가 화면 왼쪽 끝에 붙어 있어 오른쪽으로 편다. */}
      <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-60">
        <DropdownMenuLabel className="truncate font-normal">
          {email}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs text-muted-foreground">
          테마
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as Theme)}
        >
          {THEMES.map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {THEME_LABEL[value]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={pending}
          // Server Action 이라 메뉴가 닫히기 전에 전환이 시작되게 둔다.
          onSelect={() => startTransition(() => void logout())}
        >
          {pending ? "로그아웃 중…" : "로그아웃"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
