import type { ErrorCode, ScaffoldType } from "@contracts/monito";

/** Colores diagnósticos de la taxonomía (derivados de la paleta del sistema) */
export const TAXONOMY_COLORS: Record<
  ErrorCode,
  { hex: string; soft: string; label: string; corto: string }
> = {
  CONCEPT: {
    hex: "#7E549F",
    soft: "#EDE4F5",
    label: "Error conceptual",
    corto: "Concepto",
  },
  PROC: {
    hex: "#D97E0F",
    soft: "#FBEBCF",
    label: "Error procedimental",
    corto: "Procedimiento",
  },
  ATTN: {
    hex: "#3E9090",
    soft: "#DDF0F0",
    label: "Despiste",
    corto: "Atención",
  },
  READ: {
    hex: "#D94F45",
    soft: "#FBE3DF",
    label: "Comprensión lectora",
    corto: "Lectura",
  },
  GUESS: {
    hex: "#CE6E9A",
    soft: "#F9E3EE",
    label: "Respuesta al azar",
    corto: "Azar",
  },
};

export const SCAFFOLD_META: Record<
  ScaffoldType,
  { nombre: string; pista: string }
> = {
  activacion: { nombre: "Activación", pista: "Reconecta con lo que ya sabe" },
  reencuadre: { nombre: "Reencuadre", pista: "El problema con otras palabras" },
  estrategia: { nombre: "Estrategia", pista: "Un método, no la respuesta" },
  descomposicion: { nombre: "Descomposición", pista: "El problema en pasos" },
  analogo_resuelto: {
    nombre: "Análogo resuelto",
    pista: "Un primo del problema, resuelto",
  },
};

export const ZDP_LABEL: Record<string, string> = {
  baja: "ZDP cercana",
  media: "ZDP media",
  alta: "ZDP retadora",
};
