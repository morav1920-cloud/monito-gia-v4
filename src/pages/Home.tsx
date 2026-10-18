import { Link } from "react-router";
import {
  ArrowRight,
  Blocks,
  Brain,
  Download,
  Layers,
  Sparkles,
} from "lucide-react";
import { MonitoLogo } from "@/components/MonitoLogo";
import { TAXONOMY_COLORS } from "@/lib/taxonomy";
import { ERROR_CODES, ERROR_CODE_META } from "@contracts/monito";

const STICKERS = [
  { text: "Andamiaje ZDP", color: "#84A59D", rot: "-6deg", pos: "left-[4%] top-[18%]" },
  { text: "Taxonomía de errores", color: "#F28482", rot: "5deg", pos: "right-[5%] top-[14%]" },
  { text: "Dweck", color: "#FFCE80", rot: "-4deg", pos: "left-[8%] bottom-[16%]" },
  { text: "Offline-first", color: "#F5CAC3", rot: "7deg", pos: "right-[7%] bottom-[20%]" },
  { text: "MonitoSchema v2", color: "#B9A7D9", rot: "3deg", pos: "right-[26%] top-[6%]" },
];

const STEPS = [
  {
    icon: Sparkles,
    title: "1. Siembras una pregunta",
    text: "Escribes la pregunta tal como la pondrías en el pizarrón. El motor la analiza y la ancla al plan SEP de 3° a 6°.",
  },
  {
    icon: Layers,
    title: "2. El motor andamia",
    text: "Genera reactivos isomorfos, distractores con diagnóstico de error y 5 peldaños de pistas socráticas que guían sin revelar.",
  },
  {
    icon: Blocks,
    title: "3. Los alumnos juegan",
    text: "Con un código corto entran desde cualquier dispositivo, o descargas la micro-app offline-first de menos de 100 KB.",
  },
  {
    icon: Brain,
    title: "4. Tú diagnosticas",
    text: "Recibes el mapa de errores por tipo — conceptual, procedimental, lectura — y sabes exactamente qué reenseñar mañana.",
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <MonitoLogo size={38} />
          <span className="font-display text-lg text-primary">Monito gIA</span>
        </div>
        <Link
          to="/dashboard"
          className="tactile rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
        >
          Entrar al estudio
        </Link>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-10 md:pt-16">
        {STICKERS.map((s) => (
          <span
            key={s.text}
            className={`sticker animate-float-soft absolute hidden text-sm lg:inline-flex ${s.pos}`}
            style={
              {
                backgroundColor: s.color,
                color: "#3F2B5C",
                borderColor: "rgba(63,43,92,.35)",
                "--rot": s.rot,
              } as React.CSSProperties
            }
          >
            {s.text}
          </span>
        ))}
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-bold text-secondary-foreground">
            Micro-SaaS educativo · 3° a 6° de primaria
          </p>
          <h1 className="font-display text-4xl leading-tight text-primary md:text-6xl md:leading-[1.1]">
            De una pregunta semilla a una actividad que{" "}
            <span className="relative inline-block">
              entiende
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 220 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M3 9 C60 3, 160 3, 217 8"
                  stroke="#F28482"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            a tus alumnos
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Monito gIA convierte tus preguntas en micro-actividades con
            andamiaje socrático de 5 peldaños, retroalimentación de mentalidad
            de crecimiento y analítica diagnóstica de errores.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/nueva"
              className="tactile inline-flex items-center gap-2 rounded-2xl bg-primary px-7 py-3.5 font-bold text-primary-foreground"
            >
              Crear mi primera actividad
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="tactile inline-flex items-center gap-2 rounded-2xl border-2 border-primary/30 bg-card px-7 py-3.5 font-bold text-primary"
            >
              Ver mi panel
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="font-display text-center text-2xl text-primary md:text-3xl">
          Un ciclo completo, sin fricción
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <article key={step.title} className="paper-card p-6">
              <step.icon className="h-7 w-7 text-accent" strokeWidth={2.4} />
              <h3 className="mt-4 font-display text-base text-primary">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Taxonomía */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="paper-card bg-secondary/40 p-8 md:p-12">
          <h2 className="font-display text-center text-2xl text-primary md:text-3xl">
            Cada error dice algo
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            Cada distractor que el motor genera está mapeado a un código
            diagnóstico. Cuando un alumno se equivoca, tú sabes{" "}
            <strong className="text-foreground">por qué</strong> se equivocó.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {ERROR_CODES.map((code) => (
              <div
                key={code}
                className="rounded-2xl border-2 px-4 py-3 text-center"
                style={{
                  backgroundColor: TAXONOMY_COLORS[code].soft,
                  borderColor: TAXONOMY_COLORS[code].hex,
                }}
              >
                <p
                  className="font-display text-sm"
                  style={{ color: TAXONOMY_COLORS[code].hex }}
                >
                  {code}
                </p>
                <p className="mt-1 text-xs font-semibold text-foreground/80">
                  {ERROR_CODE_META[code].nombre}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offline */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-primary md:text-3xl">
              Funciona donde tu escuela está
            </h2>
            <p className="mt-4 text-muted-foreground">
              Cada actividad puede descargarse como una{" "}
              <strong className="text-foreground">micro-app autónoma</strong>:
              un solo archivo HTML de menos de 100 KB que corre sin internet,
              guarda el progreso localmente y cabe en cualquier USB, tablet o
              computadora del salón.
            </p>
            <ul className="mt-5 space-y-2 text-sm font-semibold text-foreground/85">
              <li className="flex items-center gap-2">
                <Download className="h-4 w-4 text-accent" /> Un archivo, cero
                instalación
              </li>
              <li className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" /> Andamiaje completo
                empaquetado
              </li>
              <li className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-accent" /> Resultados en el
                dispositivo, listos para sincronizar
              </li>
            </ul>
          </div>
          <div className="paper-card flex items-center justify-center p-10">
            <div className="text-center">
              <MonitoLogo size={110} />
              <p className="mt-4 font-display text-lg text-primary">
                monito-AB3K.html
              </p>
              <p className="text-sm font-bold text-accent">≈ 38 KB · offline</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 pb-10 pt-6 text-center text-sm text-muted-foreground">
        <p>
          Monito gIA v3.0 — Andamiaje cognitivo, estructuras cooperativas y
          mentalidad de crecimiento para la primaria mexicana.
        </p>
      </footer>
    </div>
  );
}
