import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  Copy,
  Loader2,
  RefreshCw,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { MonitoLogo } from "@/components/MonitoLogo";
import { CampoBadge } from "@/components/CampoBadge";
import { ZDP_LABEL } from "@/lib/taxonomy";
import { CREDIT_COSTS } from "@contracts/credits";
import { CAMPO_META, type CurriculumAnchor } from "@contracts/curriculum";

const PIPELINE_STEPS = [
  "Analizando tu pregunta semilla…",
  "Mapeando la Zona de Desarrollo Próximo…",
  "Generando distractores plausibles…",
  "Clasificando errores en la taxonomía…",
  "Construyendo el andamiaje de 5 peldaños…",
  "Redactando retroalimentación de crecimiento…",
];

const EXAMPLE_SEEDS = [
  "Doña Mari tenía 253 elotes y vendió 178 en la feria. ¿Cuántos elotes le quedan?",
  "Un equipo de fútbol tiene 345 estampas y las reparte entre 5 niños en partes iguales. ¿Cuántas tocan a cada uno?",
  "En la tienda, un jugo cuesta $12.50. Si pago con un billete de $20, ¿cuánto cambio me dan?",
  "Una receta usa 3/4 de taza de harina y otra 1/2 taza. ¿Cuál usa más harina?",
];

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  AI_QUOTA: {
    title: "El motor de IA está sin cuota",
    body: "La generación con IA está pausada porque la cuota del sitio se agotó. El administrador puede recargarla en el panel de Kimi.",
  },
  AI_CONTENT: {
    title: "La semilla necesita otra redacción",
    body: "El motor no pudo trabajar con esta pregunta. Intenta reformularla con lenguaje de aula, sin contenido sensible.",
  },
  AI_CONFIG: {
    title: "Configuración del motor incompleta",
    body: "El servicio de IA aún no está provisionado en este despliegue. Vuelve a abrir o publicar el sitio una vez y reintenta.",
  },
  AI_TRANSIENT: {
    title: "El motor está ocupado",
    body: "Hubo una intermitencia temporal. Reintenta en unos segundos: tu semilla sigue aquí.",
  },
  NO_CREDITS: {
    title: "Te quedaste sin créditos de IA",
    body: "Tu monedero está en cero. Clonar de la biblioteca global siempre es gratis: busca ahí tu tema o pide una recarga al administrador.",
  },
};

type LibraryMatch = {
  id: number;
  title: string;
  grade: number;
  seedQuestion: string;
  libraryClones: number;
  reactivosCount: number;
  zdpEstimada: string;
  formatId: string;
  score: number;
};

const FORMAT_ITEMS: Record<string, string> = {
  multiple_choice: "reactivos",
  flashcards: "tarjetas",
  flowchart: "pasos",
};

interface PrefillState {
  seed?: string;
  grade?: number;
  mode?: "original" | "variant";
  sourceActivityId?: number;
}

export default function NewActivity() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state ?? {}) as PrefillState;

  const [seed, setSeed] = useState(prefill.seed ?? "");
  const [grade, setGrade] = useState(prefill.grade ?? 4);
  const [goal, setGoal] = useState("");
  const [formatId, setFormatId] = useState<string | null>(null); // null = el motor decide
  const [matches, setMatches] = useState<LibraryMatch[] | null>(null);
  const [anchor, setAnchor] = useState<CurriculumAnchor | null>(null);
  const [anchorChecked, setAnchorChecked] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const anchorTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isVariant = prefill.mode === "variant" && !!prefill.sourceActivityId;
  const cost = isVariant ? CREDIT_COSTS.variant : CREDIT_COSTS.generation;

  const utils = trpc.useUtils();
  const wallet = trpc.credits.wallet.useQuery();
  const templates = trpc.templates.list.useQuery();
  const clone = trpc.library.clone.useMutation({
    onSuccess: async (activity) => {
      await utils.activities.list.invalidate();
      navigate(`/actividad/${activity.id}`);
    },
  });
  const anchorPreview = trpc.curriculum.anchorPreview.useMutation({
    onSuccess: ({ anchor: a }) => {
      setAnchor(a);
      setAnchorChecked(true);
    },
  });

  // Cruce curricular en vivo (cómputo local, cero tokens): se dispara
  // debounced mientras el docente escribe la semilla
  useEffect(() => {
    setAnchorChecked(false);
    setAnchor(null);
    if (isVariant || seed.trim().length < 10) return;
    clearTimeout(anchorTimerRef.current);
    anchorTimerRef.current = setTimeout(() => {
      anchorPreview.mutate({ seedQuestion: seed.trim(), grade });
    }, 600);
    return () => clearTimeout(anchorTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, grade]);
  const generate = trpc.activities.generate.useMutation({
    onSuccess: async (result) => {
      if (result.kind === "library_matches") {
        setMatches(result.matches);
        return;
      }
      await utils.activities.list.invalidate();
      await utils.credits.wallet.invalidate();
      await utils.credits.history.invalidate();
      navigate(`/actividad/${result.activity.id}`);
    },
  });

  useEffect(() => {
    if (generate.isPending) {
      setStepIndex(0);
      intervalRef.current = setInterval(
        () => setStepIndex((i) => Math.min(i + 1, PIPELINE_STEPS.length - 1)),
        13000, // el motor tarda ~80s; el pulso acompaña sin mentir
      );
    }
    return () => clearInterval(intervalRef.current);
  }, [generate.isPending]);

  const errorInfo =
    generate.error && ERROR_COPY[generate.error.message]
      ? ERROR_COPY[generate.error.message]
      : generate.error
        ? ERROR_COPY.AI_TRANSIENT
        : null;

  function submit(opts?: { skipLibraryCheck?: boolean }) {
    if (seed.trim().length < 10 || generate.isPending) return;
    setMatches(null);
    generate.mutate({
      seedQuestion: seed.trim(),
      grade,
      learningGoal: goal.trim() || undefined,
      formatId: isVariant ? undefined : (formatId ?? undefined),
      mode: isVariant ? "variant" : "original",
      sourceActivityId: isVariant ? prefill.sourceActivityId : undefined,
      skipLibraryCheck: isVariant || (opts?.skipLibraryCheck ?? false),
    });
  }

  if (generate.isPending) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center pt-10 text-center">
        <div className="animate-float-soft">
          <MonitoLogo size={88} />
        </div>
        <h1 className="mt-6 font-display text-2xl text-primary">
          El motor está andamiando tu actividad
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cada reactivo pasa por los 6 módulos pedagógicos. Tarda alrededor de
          un minuto: la calidad del andamiaje lleva su tiempo.
        </p>
        <ol className="mt-8 w-full space-y-3 text-left">
          {PIPELINE_STEPS.map((step, i) => (
            <li
              key={step}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${
                i < stepIndex
                  ? "border-accent bg-accent/15"
                  : i === stepIndex
                    ? "animate-step-pulse border-primary/40 bg-card"
                    : "border-border bg-card/50 opacity-50"
              }`}
            >
              {i < stepIndex ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
              ) : i === stepIndex ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
              ) : (
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-border" />
              )}
              <span className="text-sm font-semibold">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-primary md:text-3xl">
        {isVariant ? "Variante isomorfa" : "Siembra una pregunta"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {isVariant
          ? "El motor creará contextos y números nuevos sobre el mismo aprendizaje de la actividad de la biblioteca."
          : "Escríbela como la pondrías en el pizarrón. El motor hará el resto: reactivos, distractores diagnósticos y andamiaje socrático."}
      </p>

      {/* Saldo disponible */}
      <div className="mt-4 flex items-center gap-2 text-sm font-bold text-muted-foreground">
        <Coins className="h-4 w-4 text-primary" />
        {wallet.data ? (
          <span>
            Tienes {wallet.data.balance} créditos · esta operación cuesta{" "}
            {cost}
          </span>
        ) : (
          <span>Consultando tu monedero…</span>
        )}
      </div>

      {errorInfo && (
        <div className="mt-6 flex flex-col gap-3 rounded-3xl border-2 border-destructive/40 bg-destructive/10 p-5">
          <div className="flex items-center gap-2 font-bold text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {errorInfo.title}
          </div>
          <p className="text-sm text-foreground/80">{errorInfo.body}</p>
          {generate.error?.message !== "NO_CREDITS" && (
            <button
              onClick={() => submit()}
              className="tactile inline-flex w-fit items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" /> Reintentar generación
            </button>
          )}
        </div>
      )}

      {/* Coincidencias de la biblioteca: ahorro antes que generación */}
      {matches && matches.length > 0 && (
        <div className="mt-6 rounded-3xl border-2 border-accent bg-accent/10 p-5">
          <p className="font-display text-base text-primary">
            La comunidad ya resolvió una semilla casi igual
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Clónala gratis (cero tokens) o genera tu versión original por{" "}
            {CREDIT_COSTS.generation} créditos.
          </p>
          <div className="mt-4 space-y-3">
            {matches.map((m) => (
              <div key={m.id} className="paper-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-sm text-primary">
                      {m.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {m.seedQuestion}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                        {m.grade}° primaria
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                        {m.reactivosCount} {FORMAT_ITEMS[m.formatId] ?? "elementos"}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                        {ZDP_LABEL[m.zdpEstimada] ?? m.zdpEstimada}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      onClick={() => clone.mutate({ sourceId: m.id })}
                      disabled={clone.isPending}
                      className="tactile inline-flex items-center gap-1.5 rounded-2xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                    >
                      {clone.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Clonar gratis
                    </button>
                    <button
                      onClick={() =>
                        navigate("/nueva", {
                          state: {
                            seed: m.seedQuestion,
                            grade: m.grade,
                            mode: "variant",
                            sourceActivityId: m.id,
                          },
                        })
                      }
                      className="tactile inline-flex items-center gap-1.5 rounded-2xl border-2 border-primary/30 bg-card px-3 py-2 text-xs font-bold text-primary"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      Variante · {CREDIT_COSTS.variant}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => submit({ skipLibraryCheck: true })}
            className="mt-4 text-sm font-bold text-primary underline underline-offset-2"
          >
            Ninguna me sirve: generar original por {CREDIT_COSTS.generation}{" "}
            créditos
          </button>
        </div>
      )}

      <div className="paper-card mt-6 space-y-5 p-6 md:p-8">
        <div>
          <label
            htmlFor="seed"
            className="mb-2 block text-sm font-bold text-primary"
          >
            Pregunta semilla
          </label>
          <textarea
            id="seed"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            rows={4}
            placeholder="Ej. Doña Mari tenía 253 elotes y vendió 178…"
            className="w-full rounded-2xl border-2 border-input bg-background px-4 py-3 text-base outline-none transition-colors focus:border-primary"
          />
          {!isVariant && (
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLE_SEEDS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setSeed(ex)}
                  className="rounded-full border border-border bg-muted px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {ex.length > 52 ? `${ex.slice(0, 52)}…` : ex}
                </button>
              ))}
            </div>
          )}

          {/* Anclaje curricular NEM/CONALITEG detectado en vivo */}
          {anchorPreview.isPending && (
            <p className="mt-3 text-xs font-semibold text-muted-foreground">
              Cruzando con el currículo oficial…
            </p>
          )}
          {!anchorPreview.isPending && anchorChecked && anchor && (
            <div
              className="animate-pop-in mt-3 rounded-2xl border-2 p-4"
              style={{
                borderColor: CAMPO_META[anchor.campoFormativo].color,
                backgroundColor: CAMPO_META[anchor.campoFormativo].bg,
              }}
            >
              <div className="flex items-center gap-2">
                <CampoBadge campo={anchor.campoFormativo} size="md" />
                <span className="text-[11px] font-bold text-muted-foreground">
                  Plan de Estudios 2022 · afinidad{" "}
                  {Math.round(anchor.score * 100)}%
                </span>
              </div>
              <p className="mt-2 text-sm font-bold">{anchor.contenido}</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/75">
                {anchor.pda}
              </p>
            </div>
          )}
          {!anchorPreview.isPending && anchorChecked && !anchor && (
            <p className="mt-3 rounded-2xl bg-muted px-4 py-3 text-xs font-semibold text-muted-foreground">
              Sin anclaje directo en el índice curricular de {grade}°: el motor
              trabajará la semilla como tema libre con el mismo rigor pedagógico.
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="grade"
              className="mb-2 block text-sm font-bold text-primary"
            >
              Grado
            </label>
            <select
              id="grade"
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full rounded-2xl border-2 border-input bg-background px-4 py-3 text-base font-semibold outline-none focus:border-primary"
            >
              {[3, 4, 5, 6].map((g) => (
                <option key={g} value={g}>
                  {g}° de primaria
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="goal"
              className="mb-2 block text-sm font-bold text-primary"
            >
              Aprendizaje esperado{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </label>
            <input
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Ej. Resuelve restas con llevadas"
              className="w-full rounded-2xl border-2 border-input bg-background px-4 py-3 text-base outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Matriz polivalente: el docente elige el formato o deja que el motor decida */}
        {!isVariant && templates.data && templates.data.length > 0 && (
          <div>
            <p className="mb-2 block text-sm font-bold text-primary">
              Formato de la micro-app
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => setFormatId(null)}
                className={`tactile rounded-2xl border-2 px-4 py-3 text-left ${
                  formatId === null
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/50"
                }`}
              >
                <p className="text-sm font-extrabold text-primary">
                  ✨ Automático
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  El motor elige el formato que mejor sirve a tu objetivo
                  pedagógico.
                </p>
              </button>
              {templates.data.map((t) => (
                <button
                  key={t.formatId}
                  onClick={() => setFormatId(t.formatId)}
                  className={`tactile rounded-2xl border-2 px-4 py-3 text-left ${
                    formatId === t.formatId
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <p className="text-sm font-extrabold text-primary">
                    {t.name}
                    {!t.hasRuntime && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        nuevo formato
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {t.pedagogicFit}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
        {isVariant && (
          <p className="rounded-2xl bg-muted px-4 py-3 text-xs font-semibold text-muted-foreground">
            Una variante hereda el formato de la actividad original: misma
            arquitectura, contexto nuevo.
          </p>
        )}

        <button
          onClick={() => submit()}
          disabled={
            seed.trim().length < 10 ||
            (wallet.data !== undefined && wallet.data.balance < cost)
          }
          className="tactile inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-display text-lg text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isVariant ? (
            <Shuffle className="h-5 w-5" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          {isVariant
            ? `Generar variante · ${cost} créditos`
            : `Generar actividad · ${cost} créditos`}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Mínimo 10 caracteres. Antes de cobrar, buscamos en la biblioteca
          global: si la comunidad ya la resolvió, te la ofrecemos gratis.
        </p>
      </div>
    </div>
  );
}
