"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signup, type SignupActionState } from "@/app/signup/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

const initialState: SignupActionState = { error: null, success: false };

const fieldClassName =
  "h-11 w-full rounded-lg border border-border bg-surface shadow-card px-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Criando conta..." : "Criar minha conta"}
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signup, initialState);

  if (state.success) {
    return (
      <p className="rounded-[var(--radius)] bg-success/10 p-4 text-sm text-success">
        Conta criada! Verifique seu e-mail para confirmar o cadastro antes de
        entrar.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-sm font-medium">
          Nome completo
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          className={cn(fieldClassName)}
          placeholder="Seu nome"
        />
      </div>

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
          autoComplete="new-password"
          required
          className={cn(fieldClassName)}
          placeholder="••••••••"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirmar senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
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
