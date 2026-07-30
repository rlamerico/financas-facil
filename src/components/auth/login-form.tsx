"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginActionState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

const initialState: LoginActionState = { error: null };

const fieldClassName =
  "h-11 w-full rounded-lg border border-border bg-surface shadow-card px-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={cn(fieldClassName)}
          placeholder="voce@exemplo.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={cn(fieldClassName)}
          placeholder="••••••••"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-error">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
