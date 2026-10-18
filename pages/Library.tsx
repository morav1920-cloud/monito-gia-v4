import { useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Copy, Loader2, Search, Shuffle, Users } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { CampoBadge } from "@/components/CampoBadge";
import { ZDP_LABEL } from "@/lib/taxonomy";
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

/**
 * Biblioteca Global Comunitaria: actividades validadas por otros docentes.
 * Clonar = gratis (cero tokens). Variante con IA = costo reducido.
 */
export default function Library() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const [cloningId, setCloningId] = useState<number | null>(null);

  const browse = trpc.library.browse.useQuery({
    q: q.trim() || undefined,
    grade,
  });
  const utils = trpc.useUtils();
  const clone = trpc.library.clone.useMutation({
    onSuccess: async (activity) => {
      await utils.activities.list.invalidate();
      navigate(`/actividad/${activity.id}`);
    },
  });

  function handleClone(sourceId: number) {
    setCloningId(sourceId);
    clone.mutate(
      { sourceId },
      { onSettled: () => setCloningId(null) },
    );
  }

  function handleVariant(item: {
    id: number;
    seedQuestion: string;
    grade: number;
  }) {
    navigate("/nueva", {
      state: {
        seed: item.seedQuestion,
        grade: item.grade,
        mode: "variant",
        sourceActivityId: item.id,
      },
    });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl text-primary md:text-3xl">
        Biblioteca global
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Actividades que otros docentes ya generaron, validaron con sus grupos y
        compartieron. Clonar no gasta créditos: es el camino ultra-rentable.
      </p>

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por tema, semilla o aprendizaje…"
            className="w-full rounded-2xl border-2 border-input bg-background py-3 pl-11 pr-4 text-base outline-none focus:border-primary"
          />
        </div>
        <select
          value={grade ?? ""}
          onChange={(e) =>
            setGrade(e.target.value ? Number(e.target.value) : undefined)
          }
          className="rounded-2xl border-2 border-input bg-background px-4 py-3 font-semibold outline-none focus:border-primary"
        >
          <option value="">Todos los grados</option>
          {[3, 4, 5, 6].map((g) => (
            <option key={g} value={g}>
              {g}° de primaria
            </option>
          ))}
        </select>
      </div>

      {browse.isLoading && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="paper-card h-44 animate-pulse bg-muted" />
          ))}
        </div>
      )}

      {browse.data?.length === 0 && (
        <div className="paper-card mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
          <p className="font-display text-lg text-primary">
            La biblioteca está esperando la primera actividad
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Cuando publiques una actividad, puedes compartirla aquí desde su
            página de detalle. Lo que compartas le ahorra créditos a toda la
            comunidad.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {browse.data?.map((a) => (
          <article key={a.id} className="paper-card flex flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-base leading-snug text-primary">
                {a.title}
              </h3>
              {a.isMine && (
                <span className="shrink-0 rounded-full bg-accent/25 px-3 py-1 text-xs font-bold text-accent-foreground">
                  Mía
                </span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {a.seedQuestion}
            </p>
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
              {a.campoFormativo && <CampoBadge campo={a.campoFormativo} />}
              {a.libraryClones > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                  <Users className="h-3 w-3" /> {a.libraryClones}{" "}
                  {a.libraryClones === 1 ? "clon" : "clones"}
                </span>
              )}
            </div>
            {!a.isMine && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleClone(a.id)}
                  disabled={cloningId === a.id}
                  className="tactile inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
                >
                  {cloningId === a.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Clonar · Gratis
                </button>
                <button
                  onClick={() => handleVariant(a)}
                  className="tactile inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-primary/30 bg-card px-3 py-2.5 text-sm font-bold text-primary"
                >
                  <Shuffle className="h-4 w-4" />
                  Variante IA · {CREDIT_COSTS.variant}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {clone.error && (
        <p className="mt-4 text-center text-sm font-bold text-destructive">
          No se pudo clonar. Reintenta en un momento.
        </p>
      )}
    </div>
  );
}
