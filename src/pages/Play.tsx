import { useRef, useState } from "react";
import { useParams } from "react-router";
import {
  CheckCircle2,
  Layers,
  Lightbulb,
  ListOrdered,
  RotateCcw,
  SearchX,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { MonitoLogo } from "@/components/MonitoLogo";
import { CampoBadge } from "@/components/CampoBadge";
import {
  MonitoAvatar,
  MonitoCompanion,
  type MonitoPose,
} from "@/components/MonitoAvatar";
import { MONITO_VOICE, pickLine, useMonitoVoice } from "@/hooks/useMonitoVoice";
import {
  CAMPO_MONITO_COLOR,
  type CampoFormativo,
  type MonitoColor,
} from "@contracts/curriculum";
import { SCAFFOLD_META } from "@/lib/taxonomy";
import type {
  ErrorCode,
  FlashCard,
  FlowchartStep,
  MonitoReactivo,
  StoredContent,
} from "@contracts/monito";

type Phase = "alias" | "playing" | "done";

interface PlayContext {
  sessionId: number | null;
  alias: string;
  content: StoredContent;
  campo: CampoFormativo | null;
  monitoColor: MonitoColor;
  submit: (entry: {
    reactivoId: string;
    selectedOptionId?: string;
    isCorrect: boolean;
    errorCode: ErrorCode | null;
    scaffoldLevel: number;
    timeMs: number;
  }) => void;
  finish: (stats: {
    correctCount: number;
    totalAnswered: number;
    maxScaffoldUsed: number;
  }) => void;
}

/** Estado del compañero holográfico: pose + globo de diálogo */
function useCompanionState() {
  const [comp, setComp] = useState<{ pose: MonitoPose; msg: string | null }>({
    pose: "estudio",
    msg: null,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function say(pose: MonitoPose, msg: string | null) {
    if (timer.current) clearTimeout(timer.current);
    setComp({ pose, msg });
  }
  /** Cambia de pose tras una pausa (duda → idea/explicación) */
  function sayAfter(ms: number, pose: MonitoPose, msg: string | null) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setComp({ pose, msg }), ms);
  }
  return { comp, say, sayAfter };
}

export default function Play() {
  const { code = "" } = useParams<{ code: string }>();
  const activity = trpc.play.byCode.useQuery({ code }, { retry: false });
  const voice = useMonitoVoice("alumno");

  const [phase, setPhase] = useState<Phase>("alias");
  const [alias, setAlias] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);

  const startSession = trpc.play.startSession.useMutation();
  const submitResponse = trpc.play.submitResponse.useMutation();
  const finishSession = trpc.play.finishSession.useMutation();

  if (activity.isLoading)
    return (
      <Shell>
        <div className="paper-card h-64 w-full animate-pulse bg-muted" />
      </Shell>
    );

  if (activity.error || !activity.data)
    return (
      <Shell>
        <div className="paper-card w-full p-10 text-center">
          <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-xl text-primary">
            Código no encontrado
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Revisa el código con tu maestra o maestro. Debe verse como
            MON-AB3K.
          </p>
        </div>
      </Shell>
    );

  const a = activity.data;
  const content = a.content as StoredContent;
  const campo = (a.campoFormativo as CampoFormativo | null) ?? null;
  const monitoColor: MonitoColor = campo
    ? CAMPO_MONITO_COLOR[campo]
    : "azul";

  function begin() {
    startSession.mutate(
      { code, alias: alias.trim() || "Explorador" },
      {
        onSuccess: ({ sessionId: sid }) => {
          setSessionId(sid);
          setPhase("playing");
        },
      },
    );
  }

  const ctx: PlayContext = {
    sessionId,
    alias: alias.trim() || "Explorador",
    content,
    campo,
    monitoColor,
    submit: (entry) => {
      if (!sessionId) return;
      submitResponse.mutate({ sessionId, ...entry });
    },
    finish: (stats) => {
      if (sessionId) finishSession.mutate({ sessionId, ...stats });
      setPhase("done");
    },
  };

  /* ---- Pantalla: alias ---- */
  if (phase === "alias")
    return (
      <Shell>
        <div className="paper-card w-full animate-pop-in p-8 text-center">
          <div className="flex flex-col items-center">
            <MonitoAvatar pose="saludo" color={monitoColor} size={104} />
            <p className="mt-1 max-w-xs rounded-2xl border-2 border-primary/15 bg-secondary/50 px-4 py-2.5 text-[13px] font-semibold leading-snug">
              {voice.saludo}
            </p>
          </div>
          <h1 className="mt-4 font-display text-2xl text-primary">
            {a.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {content.meta.aprendizajeEsperado}
          </p>
          {a.campoFormativo && (
            <p className="mt-3 text-xs font-bold text-muted-foreground">
              <CampoBadge campo={a.campoFormativo} size="md" />
            </p>
          )}
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            maxLength={30}
            placeholder="Escribe tu nombre o apodo"
            aria-label="Tu nombre o apodo"
            className="mt-6 w-full rounded-2xl border-2 border-input bg-background px-5 py-4 text-center text-xl font-bold outline-none focus:border-primary"
            onKeyDown={(e) => e.key === "Enter" && begin()}
          />
          <button
            onClick={begin}
            disabled={startSession.isPending}
            className="tactile mt-4 w-full rounded-2xl bg-primary px-6 py-4 font-display text-xl text-primary-foreground disabled:opacity-50"
          >
            {startSession.isPending ? "Preparando…" : "¡Empezar!"}
          </button>
        </div>
      </Shell>
    );

  /* ---- Pantalla: resumen ---- */
  if (phase === "done")
    return (
      <Shell>
        <div className="paper-card w-full animate-pop-in p-8 text-center">
          <div className="flex flex-col items-center">
            <MonitoAvatar pose="exito" color={monitoColor} size={104} />
            <p className="mt-1 max-w-sm rounded-2xl border-2 border-accent/40 bg-accent/10 px-4 py-2.5 text-[13px] font-semibold leading-snug">
              {voice.despedida}
            </p>
          </div>
          <h1 className="mt-4 font-display text-2xl text-primary">
            ¡Sesión completada, {ctx.alias}!
          </h1>
          <p className="mt-5 text-lg leading-relaxed">
            {content.mensajeCierre}
          </p>
          <button
            onClick={() => setPhase("alias")}
            className="tactile mt-6 rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground"
          >
            Jugar otra vez
          </button>
        </div>
      </Shell>
    );

  /* ---- Pantalla: jugando (router por arquetipo) ---- */
  if (content.formatId === "flashcards" && content.tarjetas)
    return (
      <Shell>
        <FlashcardsPlay ctx={ctx} tarjetas={content.tarjetas} />
      </Shell>
    );
  if (content.formatId === "flowchart" && content.pasos)
    return (
      <Shell>
        <FlowchartPlay
          ctx={ctx}
          pasos={content.pasos}
          orden={(content as StoredContent & { _orden?: Record<string, number> })._orden ?? {}}
          contexto={content.contexto ?? ""}
          instruccion={content.instruccion ?? "Ordena los pasos"}
        />
      </Shell>
    );
  return (
    <Shell>
      <QuizPlay ctx={ctx} reactivos={content.reactivos ?? []} />
    </Shell>
  );
}

/* ================= OPCIÓN MÚLTIPLE ================= */

function QuizPlay({
  ctx,
  reactivos,
}: {
  ctx: PlayContext;
  reactivos: MonitoReactivo[];
}) {
  const [idx, setIdx] = useState(0);
  const [level, setLevel] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<{
    kind: "ok" | "retry";
    text: string;
  } | null>(null);

  const correctRef = useRef(0);
  const answeredRef = useRef(0);
  const maxLevelRef = useRef(0);
  const startRef = useRef(Date.now());
  const companion = useCompanionState();

  const r = reactivos[idx];

  function resetReactivoState() {
    setLevel(0);
    setPicked(null);
    setResolved(false);
    setLastFeedback(null);
    companion.say("estudio", null);
    startRef.current = Date.now();
  }

  function askHint() {
    // Monito: primero duda, luego chispa de idea (o explicación en peldaños altos)
    companion.say("duda", MONITO_VOICE.alumno.andamiaje.duda);
    setLevel((l) => {
      const next = Math.min(l + 1, 5);
      if (next > maxLevelRef.current) maxLevelRef.current = next;
      companion.sayAfter(
        1100,
        next >= 4 ? "explicacion" : "idea",
        next >= 4
          ? MONITO_VOICE.alumno.andamiaje.explicacion
          : MONITO_VOICE.alumno.andamiaje.idea,
      );
      return next;
    });
  }

  function feedbackFor(codigo: ErrorCode | null): string {
    if (!codigo)
      return "Buen intento. Respira, revisa las pistas y prueba otro camino: así entrena tu cerebro.";
    const item = r.feedbackPorError.find((f) => f.codigo === codigo);
    return (
      item?.mensaje ??
      "Buen intento. Respira, revisa las pistas y prueba otro camino: así entrena tu cerebro."
    );
  }

  function pick(optionId: string) {
    if (resolved || picked === optionId) return;
    const option = r.opciones.find((o) => o.id === optionId);
    if (!option) return;

    const isCorrect = !!option.correcta;
    const timeMs = Date.now() - startRef.current;
    answeredRef.current += 1;
    if (isCorrect) correctRef.current += 1;

    ctx.submit({
      reactivoId: r.id,
      selectedOptionId: optionId,
      isCorrect,
      errorCode: isCorrect ? null : (option.errorCode as ErrorCode | null),
      scaffoldLevel: level,
      timeMs,
    });

    setPicked(optionId);
    if (isCorrect) {
      setResolved(true);
      setLastFeedback({ kind: "ok", text: r.feedbackCorrecto });
      companion.say("exito", pickLine(MONITO_VOICE.alumno.celebraciones));
    } else {
      setLastFeedback({
        kind: "retry",
        text: feedbackFor(option.errorCode as ErrorCode | null),
      });
      companion.say("idea", pickLine(MONITO_VOICE.alumno.apoyo));
    }
  }

  function retry() {
    setPicked(null);
    setLastFeedback(null);
  }

  function advance() {
    if (idx < reactivos.length - 1) {
      setIdx(idx + 1);
      resetReactivoState();
    } else {
      ctx.finish({
        correctCount: correctRef.current,
        totalAnswered: answeredRef.current,
        maxScaffoldUsed: maxLevelRef.current,
      });
    }
  }

  if (!r) return null;

  return (
    <div className="w-full">
      {/* Progreso */}
      <div className="mb-4 flex gap-1.5">
        {reactivos.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < idx ? "bg-accent" : i === idx ? "bg-primary/60" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="paper-card p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Reactivo {idx + 1} de {reactivos.length}
        </p>
        {r.contexto && (
          <p className="mt-3 rounded-2xl bg-secondary/60 px-4 py-3 font-semibold leading-relaxed">
            {r.contexto}
          </p>
        )}
        <h2 className="mt-4 text-xl font-extrabold leading-snug md:text-2xl">
          {r.enunciado}
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {r.opciones.map((o) => {
            const isPicked = picked === o.id;
            const showCorrect = resolved && o.correcta;
            return (
              <button
                key={o.id}
                onClick={() => pick(o.id)}
                disabled={resolved}
                className={`tactile min-h-[64px] rounded-2xl border-2 px-5 py-4 text-left text-lg font-extrabold transition-colors ${
                  showCorrect
                    ? "border-accent bg-accent/20"
                    : isPicked
                      ? "border-salmon bg-[#FDF0EE]"
                      : "border-border bg-background hover:border-primary"
                } ${resolved ? "cursor-default" : ""}`}
                style={
                  isPicked && !showCorrect
                    ? { borderColor: "#F28482" }
                    : undefined
                }
              >
                {o.texto}
              </button>
            );
          })}
        </div>

        {/* Retroalimentación Dweck */}
        {lastFeedback && (
          <div
            className={`animate-pop-in mt-5 rounded-2xl border-2 p-5 ${
              lastFeedback.kind === "ok"
                ? "border-accent bg-accent/15"
                : "border-salmon bg-[#FDF0EE]"
            }`}
            role="status"
          >
            <p className="leading-relaxed">{lastFeedback.text}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {lastFeedback.kind === "retry" && (
                <button
                  onClick={retry}
                  className="tactile inline-flex items-center gap-2 rounded-2xl border-2 border-primary bg-card px-5 py-3 font-bold text-primary"
                >
                  <RotateCcw className="h-4 w-4" /> Probar otro camino
                </button>
              )}
              <button
                onClick={advance}
                className="tactile rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground"
              >
                {lastFeedback.kind === "ok"
                  ? idx < reactivos.length - 1
                    ? "Siguiente reactivo"
                    : "Ver mi resultado"
                  : "Continuar"}
              </button>
            </div>
          </div>
        )}

        {/* Andamiaje */}
        <div className="mt-5">
          {level > 0 && (
            <div className="mb-4 rounded-2xl border-2 border-dashed border-[#E0A93F] bg-[#FFF7E8] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Andamiaje · peldaño {level} de 5
              </p>
              <ol className="mt-2 space-y-2">
                {r.andamiaje.slice(0, level).map((s) => (
                  <li
                    key={s.nivel}
                    className="animate-pop-in rounded-xl border-l-[6px] border-[#FFCE80] bg-background px-4 py-3"
                  >
                    <p className="text-xs font-bold text-muted-foreground">
                      {s.nivel}. {SCAFFOLD_META[s.tipo].nombre}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed">
                      {s.pista}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {level < 5 && !resolved && (
            <button
              onClick={askHint}
              className="tactile inline-flex items-center gap-2 rounded-2xl border-2 border-[#E0A93F] bg-[#FFCE80] px-5 py-3 font-bold text-foreground"
            >
              <Lightbulb className="h-5 w-5" />
              {level === 0 ? "Necesito una pista" : `Otra pista (${level + 1}/5)`}
            </button>
          )}
        </div>
      </div>

      {/* Compañero holográfico */}
      <MonitoCompanion
        pose={companion.comp.pose}
        color={ctx.monitoColor}
        message={companion.comp.msg}
      />
    </div>
  );
}

/* ================= FLASHCARDS ================= */

function FlashcardsPlay({
  ctx,
  tarjetas,
}: {
  ctx: PlayContext;
  tarjetas: FlashCard[];
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const knownRef = useRef(0);
  const againRef = useRef(0);
  const hintsRef = useRef(0);
  const startRef = useRef(Date.now());
  const companion = useCompanionState();

  const t = tarjetas[idx];
  if (!t) return null;

  function mark(known: boolean) {
    const timeMs = Date.now() - startRef.current;
    if (known) knownRef.current += 1;
    else againRef.current += 1;
    companion.say(
      known ? "alegria" : "idea",
      known
        ? pickLine(MONITO_VOICE.alumno.celebraciones)
        : pickLine(MONITO_VOICE.alumno.apoyo),
    );
    ctx.submit({
      reactivoId: t.id,
      selectedOptionId: "-",
      isCorrect: known,
      errorCode: known ? null : ((t.errorTipico as ErrorCode | null) ?? "CONCEPT"),
      scaffoldLevel: hintShown ? 1 : 0,
      timeMs,
    });
    if (idx < tarjetas.length - 1) {
      setIdx(idx + 1);
      setFlipped(false);
      setHintShown(false);
      startRef.current = Date.now();
    } else {
      ctx.finish({
        correctCount: knownRef.current,
        totalAnswered: knownRef.current + againRef.current,
        maxScaffoldUsed: hintsRef.current > 0 ? 1 : 0,
      });
    }
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex gap-1.5">
        {tarjetas.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < idx ? "bg-accent" : i === idx ? "bg-primary/60" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="paper-card p-6 md:p-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <Layers className="h-4 w-4" /> Tarjeta {idx + 1} de {tarjetas.length}
        </p>

        {/* Tarjeta 3D */}
        <button
          onClick={() => setFlipped(true)}
          className="mt-5 block w-full [perspective:900px]"
          aria-label={flipped ? "Respuesta de la tarjeta" : "Toca para ver la respuesta"}
        >
          <div
            className={`relative min-h-[210px] w-full transition-transform duration-500 [transform-style:preserve-3d] ${
              flipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-border bg-background p-6 text-center shadow-[0_4px_0_rgba(63,43,92,.12)] [backface-visibility:hidden]">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Piensa antes de voltear
              </p>
              <p className="mt-3 text-2xl font-extrabold leading-snug">
                {t.frente}
              </p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-primary bg-[#EFE8F7] p-6 text-center shadow-[0_4px_0_rgba(63,43,92,.12)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Respuesta
              </p>
              <p className="mt-3 text-2xl font-extrabold leading-snug text-primary">
                {t.reverso ?? "…"}
              </p>
            </div>
          </div>
        </button>

        {/* Pista */}
        <div className="mt-5">
          {hintShown ? (
            <div className="animate-pop-in rounded-2xl border-2 border-dashed border-[#E0A93F] bg-[#FFF7E8] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Pista
              </p>
              <p className="mt-1 text-sm leading-relaxed">{t.pista}</p>
            </div>
          ) : (
            <button
              onClick={() => {
                setHintShown(true);
                hintsRef.current += 1;
                companion.say("duda", MONITO_VOICE.alumno.andamiaje.duda);
                companion.sayAfter(
                  1100,
                  "idea",
                  MONITO_VOICE.alumno.andamiaje.idea,
                );
              }}
              className="tactile inline-flex items-center gap-2 rounded-2xl border-2 border-[#E0A93F] bg-[#FFCE80] px-5 py-3 font-bold text-foreground"
            >
              <Lightbulb className="h-5 w-5" /> Una pista antes de responder
            </button>
          )}
        </div>

        {/* Autoevaluación honesta */}
        <div className="mt-5 text-center">
          {flipped ? (
            <div className="animate-pop-in">
              <p className="mb-3 text-sm text-muted-foreground">
                ¿La sabías? Sé honesto: eso es entrenar de verdad.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => mark(false)}
                  className="tactile rounded-2xl border-2 border-primary bg-card px-6 py-3 font-bold text-primary"
                >
                  Aún no · repasar
                </button>
                <button
                  onClick={() => mark(true)}
                  className="tactile rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground"
                >
                  ¡La sabía!
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Toca la tarjeta cuando tengas tu respuesta en mente.
            </p>
          )}
        </div>
      </div>

      {/* Compañero holográfico */}
      <MonitoCompanion
        pose={companion.comp.pose}
        color={ctx.monitoColor}
        message={companion.comp.msg}
      />
    </div>
  );
}

/* ================= SECUENCIA (FLOWCHART) ================= */

function FlowchartPlay({
  ctx,
  pasos,
  orden,
  contexto,
  instruccion,
}: {
  ctx: PlayContext;
  pasos: Omit<FlowchartStep, "orden">[];
  orden: Record<string, number>;
  contexto: string;
  instruccion: string;
}) {
  const [pool, setPool] = useState(() => shuffle(pasos));
  const [placed, setPlaced] = useState<Omit<FlowchartStep, "orden">[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const hintsRef = useRef(0);
  const startRef = useRef(Date.now());
  const companion = useCompanionState();

  const nextPos = placed.length + 1;

  function pick(paso: Omit<FlowchartStep, "orden">) {
    attemptsRef.current += 1;
    const timeMs = Date.now() - startRef.current;
    const correct = orden[paso.id] === nextPos;
    ctx.submit({
      reactivoId: "secuencia",
      selectedOptionId: paso.id,
      isCorrect: correct,
      errorCode: correct ? null : "CONCEPT",
      scaffoldLevel: hintsRef.current > 0 ? Math.min(hintsRef.current, 5) : 0,
      timeMs,
    });
    if (correct) {
      setPlaced([...placed, paso]);
      setPool(pool.filter((p) => p.id !== paso.id));
      setFeedback(null);
      companion.say("alegria", pickLine(MONITO_VOICE.alumno.celebraciones));
      startRef.current = Date.now();
      if (placed.length + 1 === pasos.length) {
        ctx.finish({
          correctCount: pasos.length,
          totalAnswered: attemptsRef.current,
          maxScaffoldUsed: hintsRef.current > 0 ? Math.min(hintsRef.current, 5) : 0,
        });
      }
    } else {
      setFeedback(
        "Buen intento. Ese paso va en otro momento del proceso: piensa qué tiene que pasar ANTES para que esto pueda ocurrir.",
      );
      companion.say("idea", pickLine(MONITO_VOICE.alumno.apoyo));
    }
  }

  function showHint() {
    hintsRef.current += 1;
    const withPista = pool.find((p) => p.pista);
    setFeedback(withPista?.pista ?? "Piensa qué debe pasar justo en este momento del proceso.");
    companion.say("duda", MONITO_VOICE.alumno.andamiaje.duda);
    companion.sayAfter(
      1100,
      "explicacion",
      MONITO_VOICE.alumno.andamiaje.explicacion,
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex gap-1.5">
        {pasos.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < placed.length
                ? "bg-accent"
                : i === placed.length
                  ? "bg-primary/60"
                  : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="paper-card p-6 md:p-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <ListOrdered className="h-4 w-4" /> {instruccion}
        </p>
        <p className="mt-3 rounded-2xl bg-secondary/60 px-4 py-3 font-semibold leading-relaxed">
          {contexto}
        </p>

        {/* Secuencia construida */}
        <div className="mt-5 space-y-2">
          {placed.map((p, i) => (
            <div
              key={p.id}
              className="animate-pop-in flex items-center gap-3 rounded-2xl border-2 border-accent bg-accent/15 px-4 py-3 font-bold"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary font-display text-sm text-primary-foreground">
                {i + 1}
              </span>
              {p.texto}
              <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-accent" />
            </div>
          ))}
          {placed.length < pasos.length && (
            <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-4 py-3 text-muted-foreground">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted font-display text-sm">
                {nextPos}
              </span>
              Elige el paso que va aquí…
            </div>
          )}
        </div>

        {/* Pool de pasos */}
        {pool.length > 0 && (
          <>
            <p className="mt-6 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Pasos disponibles
            </p>
            <div className="mt-2 space-y-2">
              {pool.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pick(p)}
                  className="tactile w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-left font-bold hover:border-primary"
                >
                  {p.texto}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Retroalimentación */}
        {feedback && (
          <div
            className="animate-pop-in mt-5 rounded-2xl border-2 border-salmon bg-[#FDF0EE] p-4"
            role="status"
          >
            <p className="leading-relaxed">{feedback}</p>
          </div>
        )}

        {pool.length > 0 && (
          <button
            onClick={showHint}
            className="tactile mt-5 inline-flex items-center gap-2 rounded-2xl border-2 border-[#E0A93F] bg-[#FFCE80] px-5 py-3 font-bold text-foreground"
          >
            <Lightbulb className="h-5 w-5" /> Una pista sobre el paso {nextPos}
          </button>
        )}
      </div>

      {/* Compañero holográfico */}
      <MonitoCompanion
        pose={companion.comp.pose}
        color={ctx.monitoColor}
        message={companion.comp.msg}
      />
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-start justify-center px-4 py-8 md:py-14">
      <div className="flex w-full max-w-xl flex-col items-center">
        <div className="mb-5 flex items-center gap-2 opacity-80">
          <MonitoLogo size={28} />
          <span className="font-display text-sm text-primary">Monito gIA</span>
        </div>
        {children}
      </div>
    </div>
  );
}
