import { Coins, Sparkles, Copy, Shuffle, Gift } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { CREDIT_COSTS, WELCOME_CREDITS } from "@contracts/credits";

const COST_ROWS = [
  {
    icon: Copy,
    name: "Clonar de la biblioteca",
    cost: CREDIT_COSTS.clone,
    note: "Actividad validada por la comunidad, entrega instantánea, cero tokens.",
  },
  {
    icon: Shuffle,
    name: "Variante isomorfa con IA",
    cost: CREDIT_COSTS.variant,
    note: "Mismo aprendizaje que una actividad de la biblioteca, contextos y números nuevos.",
  },
  {
    icon: Sparkles,
    name: "Generación original",
    cost: CREDIT_COSTS.generation,
    note: "El motor MGAA completo trabaja tu semilla desde cero.",
  },
];

export default function Credits() {
  const wallet = trpc.credits.wallet.useQuery();
  const history = trpc.credits.history.useQuery();

  const balance = wallet.data?.balance;
  const low = balance !== undefined && balance < 10;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl text-primary md:text-3xl">
        Créditos de IA
      </h1>
      <p className="mt-2 text-muted-foreground">
        Los créditos solo se gastan cuando el motor genera con IA. Clonar de la
        biblioteca comunitaria siempre es gratis.
      </p>

      {/* Saldo */}
      <div
        className={`paper-card mt-6 flex items-center gap-5 p-6 ${
          low ? "border-2 border-destructive/40" : ""
        }`}
      >
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
          <Coins className="h-8 w-8" />
        </span>
        <div>
          <p className="font-display text-4xl text-primary">
            {balance === undefined ? "…" : balance}
          </p>
          <p className="text-sm font-bold text-muted-foreground">
            créditos disponibles
            {balance !== undefined &&
              ` · ≈ ${Math.floor(balance / CREDIT_COSTS.generation)} generaciones originales`}
          </p>
          {low && (
            <p className="mt-1 text-sm font-bold text-destructive">
              Saldo bajo: prioriza clonar de la biblioteca para no gastar
              tokens.
            </p>
          )}
        </div>
      </div>

      {/* Tabla de costos */}
      <h2 className="mt-8 font-display text-lg text-primary">
        ¿Cuánto cuesta cada cosa?
      </h2>
      <div className="mt-3 space-y-3">
        {COST_ROWS.map((row) => (
          <div
            key={row.name}
            className="paper-card flex items-center gap-4 p-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
              <row.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">{row.name}</p>
              <p className="text-sm text-muted-foreground">{row.note}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3.5 py-1.5 font-display text-sm ${
                row.cost === 0
                  ? "bg-accent/25 text-accent-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {row.cost === 0 ? "Gratis" : `${row.cost} créditos`}
            </span>
          </div>
        ))}
      </div>

      {/* Historial */}
      <h2 className="mt-8 font-display text-lg text-primary">Movimientos</h2>
      {history.isLoading && (
        <div className="paper-card mt-3 h-32 animate-pulse bg-muted" />
      )}
      {history.data && history.data.length === 0 && (
        <div className="paper-card mt-3 p-6 text-center text-sm text-muted-foreground">
          Aún no hay movimientos. Tu bono de bienvenida de {WELCOME_CREDITS}{" "}
          créditos aparece al primer uso.
        </div>
      )}
      {history.data && history.data.length > 0 && (
        <div className="paper-card mt-3 divide-y divide-border">
          {history.data.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 px-5 py-3.5"
            >
              <div className="flex items-center gap-3">
                {t.amount > 0 ? (
                  <Gift className="h-4 w-4 shrink-0 text-accent" />
                ) : (
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                )}
                <div>
                  <p className="text-sm font-bold">{t.reasonLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString("es-MX", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-display text-sm ${
                    t.amount > 0 ? "text-accent" : "text-primary"
                  }`}
                >
                  {t.amount > 0 ? `+${t.amount}` : t.amount}
                </p>
                <p className="text-xs text-muted-foreground">
                  saldo: {t.balanceAfter}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
