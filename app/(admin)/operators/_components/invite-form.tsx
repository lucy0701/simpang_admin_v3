"use client";

import { useActionState, useState } from "react";

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
import type { InviteRole } from "@/lib/auth/invite";

import { inviteOperator, type InviteFormState } from "../actions";

const initialState: InviteFormState = {};

export function InviteForm({ roles }: { roles: InviteRole[] }) {
  const [state, formAction, pending] = useActionState(
    inviteOperator,
    initialState,
  );
  const [copied, setCopied] = useState(false);

  // 메일 발송을 붙이기 전까지는 절대 URL 을 만들어 그대로 복사하게 한다.
  const absoluteUrl =
    state.inviteUrl && typeof window !== "undefined"
      ? new URL(state.inviteUrl, window.location.origin).toString()
      : state.inviteUrl;

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="teammate@example.com"
          />
        </div>

        <div className="flex flex-col gap-2 sm:w-52">
          <Label htmlFor="roleId">역할</Label>
          <Select name="roleId" defaultValue={roles[0]?.id.toString()}>
            <SelectTrigger id="roleId" className="w-full">
              <SelectValue placeholder="역할 선택" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "발급 중…" : "초대 링크 발급"}
        </Button>
      </form>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {absoluteUrl ? (
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <p className="text-sm font-medium">초대 링크가 만들어졌습니다</p>
          <p className="text-xs text-muted-foreground">
            3일 뒤 만료됩니다. 아래 링크를 복사해 전달하세요.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={absoluteUrl} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(absoluteUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? "복사됨" : "복사"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
