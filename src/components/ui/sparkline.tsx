"use client";

import { useId } from "react";

/**
 * Calcula os pontos (x,y) de uma polyline SVG a partir de uma série de
 * valores, normalizando pra caber em `width`x`height`. Função pura,
 * separada do componente pra ser testável sem precisar renderizar SVG.
 */
export function buildSparklinePoints(
  values: number[],
  width: number,
  height: number,
): string {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    const y = height / 2;
    return `0,${y} ${width},${y}`;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

/**
 * Pontos do polígono de área sob a linha: mesma linha, fechada nos dois
 * cantos inferiores — usado pro preenchimento em gradiente.
 */
export function buildSparklineAreaPoints(
  values: number[],
  width: number,
  height: number,
): string {
  const line = buildSparklinePoints(values, width, height);

  if (line === "") {
    return "";
  }

  return `${line} ${width},${height} 0,${height}`;
}

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  /** Preenche a área sob a linha com um gradiente do `currentColor`. */
  showArea?: boolean;
  className?: string;
}

/**
 * Mini gráfico de tendência em SVG puro (sem lib de gráfico) — PRD pede só
 * um indicador visual de tendência nos cards. A cor vem de `currentColor`,
 * então o tema (claro/escuro) e o contexto controlam via classe de texto.
 */
export function Sparkline({
  values,
  width = 120,
  height = 32,
  strokeColor = "currentColor",
  showArea = false,
  className,
}: SparklineProps) {
  const gradientId = useId();

  if (values.length === 0) {
    return null;
  }

  const points = buildSparklinePoints(values, width, height);
  const areaPoints = buildSparklineAreaPoints(values, width, height);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Tendência de saldo"
      preserveAspectRatio="none"
    >
      {showArea && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill={`url(#${gradientId})`} />
        </>
      )}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
