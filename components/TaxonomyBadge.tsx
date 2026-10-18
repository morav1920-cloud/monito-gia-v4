import type { ErrorCode } from "@contracts/monito";
import { TAXONOMY_COLORS } from "@/lib/taxonomy";

export function TaxonomyBadge({
  code,
  size = "md",
}: {
  code: ErrorCode;
  size?: "sm" | "md";
}) {
  const c = TAXONOMY_COLORS[code];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
      style={{ backgroundColor: c.soft, color: c.hex }}
      title={c.label}
    >
      <span
        className="inline-block rounded-full"
        style={{
          backgroundColor: c.hex,
          width: size === "sm" ? 8 : 10,
          height: size === "sm" ? 8 : 10,
        }}
      />
      {code}
    </span>
  );
}
