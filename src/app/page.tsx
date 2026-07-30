import Image from "next/image";
import Link from "next/link";
import {
  Wallet,
  Scale,
  Workflow,
  BellRing,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroMockup } from "@/components/landing/hero-mockup";

const features = [
  {
    icon: Wallet,
    title: "Gestão 360°",
    description:
      "Famílias e pequenos negócios no mesmo lugar — fluxos de caixa separados, porém integrados.",
  },
  {
    icon: Scale,
    title: "Planejado × Realizado",
    description:
      "Compare o orçamento com o que realmente aconteceu, mês a mês, em tempo real.",
  },
  {
    icon: Workflow,
    title: "Automação com n8n",
    description:
      "Importe extratos bancários e comprovantes automaticamente, sem digitação manual.",
  },
  {
    icon: BellRing,
    title: "Alertas inteligentes",
    description:
      "Receba avisos por WhatsApp ou Telegram quando um orçamento estiver perto do limite.",
  },
  {
    icon: Activity,
    title: "Dashboards em tempo real",
    description:
      "Cada nova transação atualiza seus painéis instantaneamente, sem precisar recarregar.",
  },
  {
    icon: ShieldCheck,
    title: "Seguro por padrão",
    description:
      "Perfis com permissões (admin, usuário, visitante) e isolamento de dados no banco.",
  },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Image
            src="/logo.png"
            alt="Finanças Fácil"
            width={160}
            height={65}
            priority
            className="h-9 w-auto"
          />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Começar grátis</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero assimétrico: texto + prévia 3D do Dashboard */}
        <section className="relative overflow-hidden">
          {/* Mesh gradient discreto nas cores da marca */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -top-32 right-[-10%] h-96 w-96 rounded-full bg-primary-200/40 blur-3xl dark:bg-primary-800/25" />
            <div className="absolute bottom-[-20%] left-[-5%] h-80 w-80 rounded-full bg-secondary-200/35 blur-3xl dark:bg-secondary-800/20" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-fade-up">
              <p className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                Substitua a planilha de finanças de uma vez
              </p>
              <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Controle financeiro 360° para sua{" "}
                <span className="text-primary">família</span> e seu{" "}
                <span className="text-secondary">negócio</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted">
                O Finanças Fácil reúne receitas, despesas, orçamentos e
                investimentos em um só lugar — com automação que importa seus
                dados e dashboards que comparam o planejado com o realizado.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/signup">Criar minha conta</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#recursos">Ver recursos</Link>
                </Button>
              </div>
            </div>

            <div className="animate-fade-up mx-auto w-full max-w-md [animation-delay:150ms] lg:max-w-none">
              <HeroMockup />
            </div>
          </div>
        </section>

        <section
          id="recursos"
          className="border-t border-border bg-surface py-20"
        >
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Tudo que sua planilha não faz
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="reveal-on-scroll rounded-lg border border-border bg-background p-6 shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-raised"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} Finanças Fácil</span>
          <span>Soluções Tecnológicas</span>
        </div>
      </footer>
    </>
  );
}
