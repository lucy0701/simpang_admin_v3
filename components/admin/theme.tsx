"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

/**
 * 테마 전환.
 *
 * globals.css 가 이미 세 상태를 표현하고 있어서 그대로 따른다.
 *   클래스 없음 → 시스템 설정을 따름
 *   .dark       → 항상 다크
 *   .light      → 항상 라이트
 * next-themes 같은 라이브러리는 system 일 때도 해석된 클래스를 붙이는데,
 * 그러면 "시스템을 따른다" 는 상태가 CSS 에서 사라진다. 여기서는 클래스를
 * 지우는 것이 곧 시스템 모드다.
 */

export type Theme = "system" | "dark" | "light";

const STORAGE_KEY = "simpang-theme";

/**
 * 첫 페인트 전에 저장된 테마를 적용하는 스크립트.
 * 이게 없으면 서버가 보낸 기본 상태가 잠깐 보였다가 바뀌는 깜빡임이 생긴다.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)});var e=document.documentElement;e.classList.remove("dark","light");if(t==="dark"||t==="light")e.classList.add(t);}catch(_){}})();`;

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  if (theme !== "system") root.classList.add(theme);
}

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

/** 서버에는 저장된 값이 없다. 그쪽에서는 언제나 system 으로 본다. */
function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
  } catch {
    // 프라이빗 모드 등에서 localStorage 가 막혀 있으면 시스템 설정으로 둔다.
  }
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  /*
   * 초기값을 마운트 후 effect 로 맞추면 렌더가 한 번 더 돈다.
   * 지연 초기화로 클라이언트 첫 렌더부터 저장된 값을 쓴다.
   * 서버와 값이 달라지지만, 이 값을 읽는 건 열렸을 때만 그려지는 메뉴뿐이라
   * 하이드레이션 시점에는 DOM 차이가 없다. 실제 화면 색은 themeScript 가
   * 이미 칠해놨다.
   */
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 저장만 실패한다. 이번 세션에는 적용된 상태로 남는다.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme 은 ThemeProvider 안에서만 쓸 수 있다");
  return context;
}

export const THEME_LABEL: Record<Theme, string> = {
  system: "시스템",
  dark: "다크",
  light: "라이트",
};
