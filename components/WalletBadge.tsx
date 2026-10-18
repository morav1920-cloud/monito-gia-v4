import { Link } from "react-router";
import { Coins } from "lucide-react";
import { trpc } from "@/providers/trpc";

/**
 * Monedero de créditos de IA. Visible en el sidebar del estudio:
 * el docente siempre sabe cuántas generaciones le quedan.
 */
export function WalletBadge({ compact = false }: { compact?: boolean }) {
  const wallet = trpc.credits.wallet.useQuery();
  const balance = wallet.data?.balance;

  if (compact)
    return (
      <Link
        to="/creditos"
        title="Créditos de IA"
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-primary transition-colors hover:opacity-80"
      >
        <Coins className="h-4 w-4" />
        <span className="sr-only">{balance ?? "…"} créditos</span>
      </Link>
    );

  const low = balance !== undefined && balance < 10;

  return (
    <Link
      to="/creditos"
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors ${
        low
          ? "border-destructive/40 bg-destructive/10"
          : "border-sidebar-border bg-sidebar-accent/60 hover:bg-sidebar-accent"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-primary">
        <Coins className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm leading-none text-sidebar-foreground">
          {balance === undefined ? "…" : balance}
        </span>
        <span className="mt-1 block truncate text-[11px] font-semibold text-sidebar-foreground/60">
          créditos de IA{low ? " · ¡por agotarse!" : ""}
        </span>
      </span>
    </Link>
  );
}
