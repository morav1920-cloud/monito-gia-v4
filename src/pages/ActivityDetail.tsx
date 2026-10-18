import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Lightbulb,
  PencilOff,
  Share2,
  Trash2,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { TaxonomyBadge } from "@/components/TaxonomyBadge";
import { CampoBadge } from "@/components/CampoBadge";
import { SCAFFOLD_META, TAXONOMY_COLORS, ZDP_LABEL } from "@/lib/taxonomy";
import { downloadMicroApp } from "@/lib/exportMicroApp";
import { ERROR_CODES, ERROR_CODE_META, type ErrorCode } from "@contracts/monito";
import { CAMPO_META } from "@contracts/curriculum";

type Tab = "reactivos" | "andamiaje" | "analitica";

const FORMAT_META: Record<string, { label: string; items: string }> = {
  multiple_choice: { label: "Opción múltiple", items: "reactivos" },
  flashcards: { label: "Flashcards 3D", items: "tarjetas" },
  flowchart: { label: "Secuencia interactiva", items: "pasos" },
};

interface DiagnosisInsight {
  tone: "alert" | "ok" | "info";
  title: string;
  body: string;
}

interface Stats {
  sessionsCount: number;
  responsesCount: number;
  correctRate: number | null;
  errorDistribution: Record<string, number>;
  scaffoldHistogram: number[];
  perReactivo: Record<
    string,
    { total: number; correct: number; errors: Record<string, number> }
  >;
  reactivoOrder: string[];
  diagnosis: DiagnosisInsight[];
  recentSessions: {
    id: number;
    alias: string;
    correctCount: number;
    totalAnswered: number;
    maxScaffoldUsed: number;
  }[];
}

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const activityId = Number(id);
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<Tab>("reactivos");
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exportedKb, setExportedKb] = useState<number | null>(null);

  const activity = trpc.activities.byId.useQuery({ id: activityId });
  const stats = trpc.analytics.activityStats.useQuery(
    { activityId },
    { enabled: tab === "analitica" },
  );

  const setStatus = trpc.activities.setStatus.useMutation({
    onSuccess: async () => {
      await utils.activities.byId.invalidate({ id: activityId });
      await utils.activities.list.invalidate();
    },
  });
  const setShared = trpc.library.setShared.useMutation({
    onSuccess: async () => {
      await utils.activities.byId.invalidate({ id: activityId });
      await utils.library.browse.invalidate();
    },
  });
  const del = trpc.activities.delete.useMutation({
    onSuccess: async () => {
      await utils.activities.list.invalidate();
      navigate("/dashboard");
    },
  });

  if (activity.isLoading)
    return (
      <div className="mx-auto max-w-4xl">
        <div className="paper-card h-64 animate-pulse bg-muted" />
      </div>
    );
  if (!activity.data)
    return (
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-display text-xl text-primary">
          Actividad no encontrada
        </p>
        <Link to="/dashboard" className="mt-4 inline-block font-bold underline">
          Volver al panel
        </Link>
      </div>
    );

  const a = activity.data;
  const content = a.content;
  const isPublished = a.status === "published";
  const fmt = content.formatId ?? "multiple_choice";
  const fmtMeta = FORMAT_META[fmt] ?? { label: fmt, items: "elementos" };
  const itemCount =
    content.reactivos?.length ??
    content.tarjetas?.length ??
    content.pasos?.length ??
    0;

  function copyCode() {
    navigator.clipboard.writeText(a.shareCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function exportApp() {
    const bytes = downloadMicroApp(content, a.shareCode, a.curriculumAnchor);
    setExportedKb(Math.max(1, Math.round(bytes / 1024)));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Mi panel
      </Link>

      {/* Encabezado */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl leading-tight text-primary md:text-3xl">
            {a.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">
              {fmtMeta.label}
            </span>
            <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
              {a.grade}° primaria
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
              {ZDP_LABEL[content.meta.zdpEstimada]}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
              {itemCount} {fmtMeta.items}
            </span>
            {a.curriculumAnchor && (
              <CampoBadge campo={a.curriculumAnchor.campoFormativo} size="md" />
            )}
            <span
              className={`rounded-full px-3 py-1 ${
                isPublished
                  ? "bg-accent/25 text-accent-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isPublished ? "Publicada" : "Borrador"}
            </span>
            {a.origin === "clone" && (
              <span className="rounded-full bg-[#B9A7D9]/40 px-3 py-1 text-primary">
                Clonada de la biblioteca
              </span>
            )}
            {a.isSharedToLibrary && (
              <span className="rounded-full bg-[#84A59D]/30 px-3 py-1 text-foreground">
                Compartida · {a.libraryClones}{" "}
                {a.libraryClones === 1 ? "clon" : "clones"}
              </span>
            )}
          </div>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            <strong className="text-foreground">Semilla:</strong>{" "}
            {a.seedQuestion}
          </p>
          {a.curriculumAnchor && (
            <div
              className="mt-3 max-w-xl rounded-2xl border-2 p-4"
              style={{
                borderColor: CAMPO_META[a.curriculumAnchor.campoFormativo].color,
                backgroundColor: CAMPO_META[a.curriculumAnchor.campoFormativo].bg,
              }}
            >
              <p
                className="text-xs font-bold uppercase tracking-wide"
                style={{
                  color: CAMPO_META[a.curriculumAnchor.campoFormativo].color,
                }}
              >
                Anclaje curricular oficial ·{" "}
                {CAMPO_META[a.curriculumAnchor.campoFormativo].nombre}
              </p>
              <p className="mt-1 text-sm font-bold">
                {a.curriculumAnchor.contenido}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/75">
                {a.curriculumAnchor.pda}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                Plan de Estudios 2022 · NEM fase 4 · afinidad del cruce:{" "}
                {Math.round(a.curriculumAnchor.score * 100)}%
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-stretch gap-2">
          {isPublished && (
            <button
              onClick={copyCode}
              className="tactile inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-primary/30 bg-card px-4 py-2.5 font-bold text-primary"
            >
              {copied ? (
                <Check className="h-4 w-4 text-accent" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "¡Copiado!" : a.shareCode}
            </button>
          )}
          <button
            onClick={() =>
              setStatus.mutate({
                id: a.id,
                status: isPublished ? "draft" : "published",
              })
            }
            disabled={setStatus.isPending}
            className="tactile inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 font-bold text-primary-foreground disabled:opacity-50"
          >
            {isPublished ? (
              <>
                <PencilOff className="h-4 w-4" /> Volver a borrador
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" /> Publicar a mi grupo
              </>
            )}
          </button>
          {isPublished && (
            <button
              onClick={() =>
                setShared.mutate({ id: a.id, shared: !a.isSharedToLibrary })
              }
              disabled={setShared.isPending}
              className="tactile inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-primary/30 bg-card px-4 py-2.5 font-bold text-primary disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
              {a.isSharedToLibrary
                ? "Retirar de la biblioteca"
                : "Compartir a la biblioteca"}
            </button>
          )}
          <div className="flex gap-2">
            {isPublished && (
              <Link
                to={`/jugar/${a.shareCode}`}
                className="tactile inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-border bg-card px-3 py-2 text-sm font-bold text-primary"
              >
                <ExternalLink className="h-4 w-4" /> Probar
              </Link>
            )}
            <button
              onClick={exportApp}
              className="tactile inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-border bg-card px-3 py-2 text-sm font-bold text-primary"
            >
              <Download className="h-4 w-4" /> Micro-app
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="tactile inline-flex items-center justify-center rounded-2xl border-2 border-border bg-card px-3 py-2 text-sm font-bold text-destructive"
              aria-label="Eliminar actividad"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {exportedKb !== null && (
            <p className="text-center text-xs font-bold text-accent">
              Micro-app descargada · {exportedKb} KB · offline
            </p>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm font-bold text-destructive">
            ¿Eliminar esta actividad y sus analíticas? No se puede deshacer.
          </p>
          <button
            onClick={() => del.mutate({ id: a.id })}
            className="rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground"
          >
            Sí, eliminar
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex gap-2 border-b-2 border-border">
        {(
          [
            [
              "reactivos",
              fmt === "flashcards"
                ? "Tarjetas y diagnóstico"
                : fmt === "flowchart"
                  ? "Secuencia correcta"
                  : "Reactivos y diagnóstico",
            ],
            [
              "andamiaje",
              fmt === "multiple_choice" ? "Andamiaje 5 peldaños" : "Pistas (andamiaje)",
            ],
            ["analitica", "Analítica del grupo"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-t-2xl px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="py-6">
        {tab === "reactivos" && fmt === "flashcards" && (
          <div className="space-y-4">
            {(content.tarjetas ?? []).map((t, i) => (
              <article key={t.id} className="paper-card p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Tarjeta {i + 1}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border-2 border-border bg-background p-4">
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      Frente
                    </p>
                    <p className="mt-1 font-extrabold">{t.frente}</p>
                  </div>
                  <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4">
                    <p className="text-xs font-bold uppercase text-primary">
                      Reverso
                    </p>
                    <p className="mt-1 font-extrabold">{t.reverso}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-[#FFF7E8] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Pista (andamiaje)
                  </p>
                  <p className="mt-1 text-sm">{t.pista}</p>
                </div>
                {t.errorTipico && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">
                      Error típico si falla:
                    </span>
                    <TaxonomyBadge code={t.errorTipico} size="sm" />
                  </div>
                )}
              </article>
            ))}
            <div className="rounded-2xl bg-accent/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-accent-foreground">
                Mensaje de cierre (Dweck)
              </p>
              <p className="mt-1 text-sm">{content.mensajeCierre}</p>
            </div>
          </div>
        )}

        {tab === "reactivos" && fmt === "flowchart" && (
          <div className="space-y-6">
            <article className="paper-card p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Contexto
              </p>
              <p className="mt-2 rounded-2xl bg-secondary/60 px-4 py-3 text-sm font-semibold">
                {content.contexto}
              </p>
              <p className="mt-3 text-sm">
                <strong>Instrucción al alumno:</strong> {content.instruccion}
              </p>
              <ol className="mt-4 space-y-2">
                {(content.pasos ?? [])
                  .slice()
                  .sort((a, b) => a.orden - b.orden)
                  .map((p) => (
                    <li
                      key={p.id}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-sm text-primary-foreground">
                        {p.orden}
                      </span>
                      <div>
                        <p className="font-bold">{p.texto}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <strong>Pista:</strong> {p.pista}
                        </p>
                      </div>
                    </li>
                  ))}
              </ol>
            </article>
            <article className="paper-card p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Errores frecuentes al ordenar
              </p>
              <ul className="mt-3 space-y-2">
                {(content.erroresFrecuentes ?? []).map((e, i) => (
                  <li
                    key={i}
                    className="rounded-2xl border border-salmon/50 bg-[#FDF0EE] px-4 py-3 text-sm"
                  >
                    {e}
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-accent/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-accent-foreground">
                  Mensaje de cierre (Dweck)
                </p>
                <p className="mt-1 text-sm">{content.mensajeCierre}</p>
              </div>
            </article>
          </div>
        )}

        {tab === "reactivos" && fmt === "multiple_choice" && (
          <div className="space-y-6">
            {(content.reactivos ?? []).map((r, ri) => (
              <article key={r.id} className="paper-card p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Reactivo {ri + 1}
                </p>
                {r.contexto && (
                  <p className="mt-3 rounded-2xl bg-secondary/60 px-4 py-3 text-sm font-semibold">
                    {r.contexto}
                  </p>
                )}
                <h3 className="mt-3 text-lg font-extrabold">{r.enunciado}</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {r.opciones.map((o) => (
                    <div
                      key={o.id}
                      className={`rounded-2xl border-2 p-4 ${
                        o.correcta
                          ? "border-accent bg-accent/15"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold">{o.texto}</span>
                        {o.correcta ? (
                          <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
                            Correcta
                          </span>
                        ) : (
                          o.errorCode && <TaxonomyBadge code={o.errorCode} size="sm" />
                        )}
                      </div>
                      {!o.correcta && o.diagnostico && (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {o.diagnostico}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl bg-accent/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-accent-foreground">
                    Feedback al acertar (Dweck)
                  </p>
                  <p className="mt-1 text-sm">{r.feedbackCorrecto}</p>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {r.feedbackPorError.map((f) => (
                    <div
                      key={f.codigo}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <TaxonomyBadge code={f.codigo} size="sm" />
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {f.mensaje}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "andamiaje" && fmt === "flashcards" && (
          <div className="space-y-4">
            {(content.tarjetas ?? []).map((t, i) => (
              <article
                key={t.id}
                className="paper-card flex items-start gap-4 p-5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-sm text-primary-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold">{t.frente}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t.pista}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === "andamiaje" && fmt === "flowchart" && (
          <div className="space-y-4">
            {(content.pasos ?? [])
              .slice()
              .sort((a, b) => a.orden - b.orden)
              .map((p) => (
                <article
                  key={p.id}
                  className="paper-card flex items-start gap-4 p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-sm text-primary-foreground">
                    {p.orden}
                  </span>
                  <div>
                    <p className="font-bold">{p.texto}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {p.pista}
                    </p>
                  </div>
                </article>
              ))}
          </div>
        )}

        {tab === "andamiaje" && fmt === "multiple_choice" && (
          <div className="space-y-6">
            {(content.reactivos ?? []).map((r, ri) => (
              <article key={r.id} className="paper-card p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Reactivo {ri + 1} · {r.enunciado.slice(0, 70)}
                  {r.enunciado.length > 70 ? "…" : ""}
                </p>
                <ol className="mt-4 space-y-3">
                  {r.andamiaje.map((s) => (
                    <li
                      key={s.nivel}
                      className="flex gap-4 rounded-2xl border border-border bg-background p-4"
                      style={{ marginLeft: `${(s.nivel - 1) * 12}px` }}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-sm text-primary-foreground">
                        {s.nivel}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-primary">
                          {SCAFFOLD_META[s.tipo].nombre}
                          <span className="ml-2 font-normal text-muted-foreground">
                            {SCAFFOLD_META[s.tipo].pista}
                          </span>
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">
                          {s.pista}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        )}

        {tab === "analitica" && (
          <AnalyticsPanel
            stats={stats.data}
            isLoading={stats.isLoading}
            isPublished={isPublished}
            shareCode={a.shareCode}
          />
        )}
      </div>
    </div>
  );
}

function AnalyticsPanel({
  stats,
  isLoading,
  isPublished,
  shareCode,
}: {
  stats: Stats | undefined;
  isLoading: boolean;
  isPublished: boolean;
  shareCode: string;
}) {
  if (isLoading)
    return <div className="paper-card h-48 animate-pulse bg-muted" />;

  if (!stats || stats.sessionsCount === 0)
    return (
      <div className="paper-card flex flex-col items-center gap-3 p-10 text-center">
        <p className="font-display text-lg text-primary">
          Aún no hay sesiones de juego
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          {isPublished
            ? `Comparte el código ${shareCode} con tu grupo. En cuanto jueguen, aquí verás el mapa diagnóstico de errores.`
            : "Publica la actividad para obtener su código y compartirla con tu grupo."}
        </p>
      </div>
    );

  const maxError = Math.max(1, ...Object.values(stats.errorDistribution));
  const maxScaffold = Math.max(1, ...stats.scaffoldHistogram);

  // Mapa de calor: máximo de una celda para normalizar intensidad
  const reactivoIds = stats.reactivoOrder.filter(
    (rid) => stats.perReactivo[rid],
  );
  const maxCell = Math.max(
    1,
    ...reactivoIds.flatMap((rid) =>
      ERROR_CODES.map((c) => stats.perReactivo[rid].errors[c] ?? 0),
    ),
  );

  const TONE_STYLE: Record<DiagnosisInsight["tone"], string> = {
    alert: "border-[#D97E0F]/50 bg-[#D97E0F]/10",
    ok: "border-accent/50 bg-accent/10",
    info: "border-primary/40 bg-primary/5",
  };

  return (
    <div className="space-y-6">
      {/* Diagnóstico accionable automatizado */}
      <div className="paper-card p-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base text-primary">
            Diagnóstico accionable
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Lectura pedagógica automática de los datos del grupo — sin gastar
          créditos de IA.
        </p>
        <div className="mt-4 space-y-3">
          {stats.diagnosis.map((d, i) => (
            <div
              key={i}
              className={`rounded-2xl border-2 p-4 ${TONE_STYLE[d.tone]}`}
            >
              <p className="text-sm font-extrabold">{d.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                {d.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="paper-card p-4 text-center">
          <p className="font-display text-2xl text-primary">
            {stats.sessionsCount}
          </p>
          <p className="text-xs font-bold text-muted-foreground">sesiones</p>
        </div>
        <div className="paper-card p-4 text-center">
          <p className="font-display text-2xl text-primary">
            {stats.correctRate != null
              ? `${Math.round(stats.correctRate * 100)}%`
              : "—"}
          </p>
          <p className="text-xs font-bold text-muted-foreground">aciertos</p>
        </div>
        <div className="paper-card p-4 text-center">
          <p className="font-display text-2xl text-primary">
            {stats.responsesCount}
          </p>
          <p className="text-xs font-bold text-muted-foreground">respuestas</p>
        </div>
      </div>

      {/* Mapa de calor: reactivo × taxonomía */}
      <div className="paper-card overflow-x-auto p-6">
        <h3 className="font-display text-base text-primary">
          Mapa de calor de errores
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Cada celda muestra cuántos errores de ese tipo ocurrieron en cada
          reactivo. La intensidad marca el punto crítico.
        </p>
        <table className="mt-4 w-full min-w-[480px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-16" />
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
              <th className="pb-1 text-center text-[11px] font-extrabold text-muted-foreground">
                Aciertos
              </th>
            </tr>
          </thead>
          <tbody>
            {reactivoIds.map((rid, ri) => {
              const r = stats.perReactivo[rid];
              return (
                <tr key={rid}>
                  <th className="pr-2 text-left font-display text-xs text-primary">
                    R{ri + 1}
                  </th>
                  {ERROR_CODES.map((code) => {
                    const n = r.errors[code] ?? 0;
                    const intensity = n / maxCell;
                    return (
                      <td key={code} className="text-center">
                        <div
                          className="mx-auto flex h-10 w-full items-center justify-center rounded-xl text-sm font-extrabold transition-transform hover:scale-105"
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
                          title={`${n} ${ERROR_CODE_META[code].nombre}`}
                        >
                          {n > 0 ? n : "·"}
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center">
                    <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-accent/15 px-2 text-sm font-extrabold text-accent">
                      {r.correct}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Distribución global de errores */}
      <div className="paper-card p-6">
        <h3 className="font-display text-base text-primary">
          Distribución por taxonomía
        </h3>
        <div className="mt-4 space-y-3">
          {ERROR_CODES.map((code) => {
            const n = stats.errorDistribution[code] ?? 0;
            return (
              <div key={code} className="flex items-center gap-3">
                <div className="w-36 shrink-0">
                  <TaxonomyBadge code={code as ErrorCode} size="sm" />
                </div>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(n / maxError) * 100}%`,
                      backgroundColor: TAXONOMY_COLORS[code].hex,
                      minWidth: n > 0 ? 8 : 0,
                    }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-extrabold">
                  {n}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {ERROR_CODE_META.CONCEPT.nombre} pide reenseñar el concepto;{" "}
          {ERROR_CODE_META.PROC.nombre} pide practicar el procedimiento;{" "}
          {ERROR_CODE_META.READ.nombre} pide trabajar la lectura del enunciado.
        </p>
      </div>

      {/* Histograma de andamiaje */}
      <div className="paper-card p-6">
        <h3 className="font-display text-base text-primary">
          Histograma de andamiaje
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Peldaño más alto consultado por respuesta (0 = resolvió sin pistas).
          Mucha concentración en 4–5 indica que el tema exige andamiaje
          profundo.
        </p>
        <div className="mt-4 flex items-end gap-2">
          {stats.scaffoldHistogram.map((n, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-extrabold">{n}</span>
              <div
                className="w-full rounded-t-xl"
                style={{
                  height: `${Math.max(4, (n / maxScaffold) * 90)}px`,
                  backgroundColor:
                    i === 0 ? "#84A59D" : i >= 4 ? "#F28482" : "#563E79",
                  opacity: i === 0 || i >= 4 ? 0.85 : 0.45 + i * 0.1,
                }}
                title={`${n} respuestas en peldaño ${i}`}
              />
              <span className="text-xs font-bold text-muted-foreground">
                {i === 0 ? "Sin" : i}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="paper-card p-6">
        <h3 className="font-display text-base text-primary">
          Sesiones recientes
        </h3>
        <div className="mt-3 divide-y divide-border">
          {stats.recentSessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              <span className="font-bold">{s.alias}</span>
              <span className="text-muted-foreground">
                {s.correctCount}/{s.totalAnswered} aciertos
                {s.maxScaffoldUsed > 0 &&
                  ` · andamiaje hasta peldaño ${s.maxScaffoldUsed}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
