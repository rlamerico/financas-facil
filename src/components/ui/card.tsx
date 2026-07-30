import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const cardVariants = cva("rounded-lg border transition-shadow duration-300", {
  variants: {
    variant: {
      /** Superfície padrão com elevação sutil. */
      flat: "border-border bg-surface shadow-card",
      /** Card em destaque: elevação maior + lift no hover. */
      elevated:
        "border-border bg-surface shadow-raised transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-overlay",
      /** Card-assinatura do produto: gradiente profundo da marca. */
      hero: "border-primary-700/40 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 text-white shadow-hero dark:border-primary-800/60",
    },
  },
  defaultVariants: { variant: "flat" },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />;
}

export { cardVariants };
