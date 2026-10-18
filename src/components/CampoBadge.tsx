import { CAMPO_META, type CampoFormativo } from "@contracts/curriculum";

/**
 * Badge del campo formativo NEM (Lenguajes, Saberes, Ética/Naturaleza,
 * Humano/Comunitario). Se usa en dashboard, detalle, biblioteca y runtime.
 */
export function CampoBadge({
  campo,
  size = "sm",
}: {
  campo: CampoFormativo | string | null | undefined;
  size?: "sm" | "md";
}) {
  if (!campo || !(campo in CAMPO_META)) return null;
  const meta = CAMPO_META[campo as CampoFormativo];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${
        size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-1 text-[11px]"
      }`}
      style={{ backgroundColor: meta.bg, color: meta.color }}
      title={`Campo formativo NEM: ${meta.nombre}`}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.corto}
    </span>
  );
}
