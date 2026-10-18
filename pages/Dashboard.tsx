import { Link } from "react-router";
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  Coins,
  Lightbulb,
  MousePointerClick,
  Plus,
  Target,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useMonitoVoice } from "@/hooks/useMonitoVoice";
import { MonitoAvatar } from "@/components/MonitoAvatar";
import { TaxonomyBadge } from "@/components/TaxonomyBadge";
import { CampoBadge } from "@/components/CampoBadge";
import { TAXONOMY_COLORS, ZDP_LABEL } from "@/lib/taxonomy";
import { ERROR_CODES } from "@contracts/monito";
import { CREDIT_COSTS } from "@contracts/credits";

const FORMAT_SHORT: Record<string, string> = {
  multiple_choice: "Opción múltiple",
  flashcards: "Flashcards",
  flowchart: "Secuencia",
};
const FORMAT_ITEMS: Record<string, string> = {
  multiple_choice: "reactivos",
  flashcards: "tarjetas",
  flowchart: "pasos",
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="paper-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-2 font-display text-2xl text-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const overview = trpc.analytics.overview.useQuery();
  const activities = trpc.activities.list.useQuery();
  const wallet = trpc.credits.wallet.useQuery();
  const voice = useMonitoVoice("docente");

  const firstName = user?.name?.split(" ")[0] ?? "Profe";
  const heatMax = Math.max(
    1,
    ...(overview.data?.heatRows ?? []).flatMap((r) =>
      ERROR_CODES.map((c) => r.cells[c] ?? 0),
    ),
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <MonitoAvatar
            pose="estudio"
            color="azul"
            size={68}
            className="shrink-0"
          />
          <div>
            <h1 className="font-display text-2xl text-primary md:text-3xl">
              Hola, {firstName}
            </h1>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {voice.saludo}
            </p>
          </div>
        </div>
        <Link
          to="/nueva"
          className="tactile inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground"
        >
          <Plus className="h-5 w-5" />
          Nueva actividad
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={BookOpenCheck}
          label="Actividades"
          value={
            overview.data ? String(overview.data.activitiesCount) : "—"
          }
          hint={
            overview.data
              ? `${overview.data.publishedCount} publicadas`
              : undefined
          }
        />
        <StatCard
          icon={MousePointerClick}
          label="Sesiones de juego"
          value={overview.data ? String(overview.data.sessionsCount) : "—"}
        />
        <StatCard
          icon={Target}
          label="Tasa de aciertos"
          value={
            overview.data?.correctRate != null
              ? `${Math.round(overview.data.correctRate * 100)}%`
              : "—"
          }
        />
        <div className="paper-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Error dominante
            </span>
          </div>
          <div className="mt-3">
            {overview.data?.dominantError ? (
              <TaxonomyBadge code={overview.data.dominantError} />
            ) : (
              <p className="font-display text-2xl text-primary">—</p>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            En todo tu grupo
          </p>
        </div>
        <Link to="/creditos" className="paper-card block p-5 transition-transform hover:-translate-y-0.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Coins className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Créditos IA
            </span>
          </div>
          <p className="mt-2 font-display text-2xl text-primary">
            {wallet.data ? wallet.data.balance : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Generar: {CREDIT_COSTS.generation} · Clonar: gratis
          </p>
        </Link>
      </div>

      {/* Diagnóstico accionable del grupo */}
      {overview.data && overview.data.diagnosis.length > 0 && overview.data.responsesCount > 0 && (
        <div className="paper-card mt-6 p-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg text-primary">
              Diagnóstico del grupo
            </h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {overview.data.diagnosis.slice(0, 4).map((d, i) => (
              <div
                key={i}
                className={`rounded-2xl border-2 p-4 ${
                  d.tone === "alert"
                    ? "border-[#D97E0F]/50 bg-[#D97E0F]/10"
                    : d.tone === "ok"
                      ? "border-accent/50 bg-accent/10"
                      : "border-primary/40 bg-primary/5"
                }`}
              >
                <p className="text-sm font-extrabold">{d.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                  {d.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mapa de calor grupal: actividad × taxonomía */}
      {overview.data && overview.data.heatRows.length > 0 && (
        <div className="paper-card mt-6 overflow-x-auto p-6">
          <h2 className="font-display text-lg text-primary">
            Mapa de calor de errores por actividad
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Dónde se concentra cada tipo de error en tu grupo completo.
          </p>
          <table className="mt-4 w-full min-w-[520px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-44" />
                {ERROR_CODES.map((code) => (
                  <th key={code} className="pb-1 text-center">
                    <span
                      className="inline-block rounded-lg px-2 py-1 text-[11px] font-extrabold"
                      style={{
                        backgroundColor: TAXONOMY_COLORS[code].soft,
                        color: TAXONOMY_COLORS[code].hex,
                      }}
                    >
                      {code}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overview.data.heatRows.map((row) => (
                <tr key={row.activityId}>
                  <th className="pr-2 text-left">
                    <Link
                      to={`/actividad/${row.activityId}`}
                      className="line-clamp-1 text-xs font-bold text-primary hover:underline"
                    >
                      {row.title}
                    </Link>
                  </th>
                  {ERROR_CODES.map((code) => {
                    const n = row.cells[code] ?? 0;
                    const intensity = n / heatMax;
                    return (
                      <td key={code} className="text-center">
                        <div
                          className="mx-auto flex h-9 w-full items-center justify-center rounded-xl text-sm font-extrabold"
                          style={{
                            backgroundColor:
                              n > 0
                                ? TAXONOMY_COLORS[code].hex
                                : "transparent",
                            opacity: n > 0 ? 0.25 + intensity * 0.75 : 1,
                            color:
                              n > 0
                                ? intensity > 0.45
                                  ? "#fff"
                                  : TAXONOMY_COLORS[code].hex
                                : "#00000018",
                            border:
                              n === 0 ? "2px dashed #00000012" : undefined,
                          }}
                        >
                          {n > 0 ? n : "·"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Biblioteca */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl text-primary">Mis actividades</h2>
        <Link
          to="/biblioteca"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
        >
          Explorar la biblioteca global <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {activities.isLoading && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="paper-card h-36 animate-pulse bg-muted" />
          ))}
        </div>
      )}

      {activities.data?.length === 0 && (
        <div className="paper-card mt-4 flex flex-col items-center gap-4 p-10 text-center">
          <p className="font-display text-lg text-primary">
            Tu biblioteca está lista para la primera semilla
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Escribe una pregunta como las del pizarrón y el motor generará
            reactivos, distractores diagnósticos y andamiaje de 5 peldaños.
          </p>
          <Link
            to="/nueva"
            className="tactile inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground"
          >
            <Plus className="h-5 w-5" /> Sembrar mi primera pregunta
          </Link>
        </div>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {activities.data?.map((a) => (
          <Link
            key={a.id}
            to={`/actividad/${a.id}`}
            className="paper-card group p-5 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-base leading-snug text-primary">
                {a.title}
              </h3>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  a.status === "published"
                    ? "bg-accent/25 text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {a.status === "published" ? "Publicada" : "Borrador"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-primary">
                {FORMAT_SHORT[a.formatId] ?? a.formatId}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
                {a.grade}° primaria
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                {a.reactivosCount} {FORMAT_ITEMS[a.formatId] ?? "elementos"}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                {ZDP_LABEL[a.zdpEstimada] ?? a.zdpEstimada}
              </span>
              {a.curriculumAnchor && (
                <CampoBadge campo={a.curriculumAnchor.campoFormativo} />
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              {a.status === "published" ? (
                <code className="rounded-lg bg-muted px-2 py-1 text-xs font-bold tracking-wider text-primary">
                  {a.shareCode}
                </code>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Publica para obtener código
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-sm font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Abrir <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
