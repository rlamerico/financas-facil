import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Entrar"
      subtitle="Acesse seu painel financeiro."
      footer={
        <>
          Não tem conta?{" "}
          <Link href="/signup" className="font-medium text-primary">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
