import { useState } from "react";
import {
  Blocks,
  CheckCircle2,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

const EMPTY_FORM = {
  formatId: "",
  name: "",
  icon: "blocks",
  description: "",
  pedagogicFit: "",
  exampleJson: "",
  qaRules: "",
};

/** Repositorio compartido de formatos: registro y curaduría de plantillas (solo admin) */
export default function Formats() {
  const utils = trpc.useUtils();
  const listAll = trpc.templates.listAll.useQuery(undefined, { retry: false });
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const create = trpc.templates.create.useMutation({
    onSuccess: async () => {
      await utils.templates.listAll.invalidate();
      await utils.templates.list.invalidate();
      setForm(EMPTY_FORM);
      setShowForm(false);
      setFormError(null);
    },
    onError: (e) => setFormError(e.message),
  });
  const setActive = trpc.templates.setActive.useMutation({
    onSuccess: () => utils.templates.listAll.invalidate(),
  });
  const del = trpc.templates.delete.useMutation({
    onSuccess: () => utils.templates.listAll.invalidate(),
  });

  if (listAll.error) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="paper-card flex flex-col items-center gap-3 p-10 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
          <h1 className="font-display text-xl text-primary">
            Zona de administración
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            El repositorio de formatos lo curan las cuentas administradoras. Si
            tu equipo necesita registrar un nuevo formato, pide acceso al
            administrador del sitio.
          </p>
        </div>
      </div>
    );
  }

  const templates = listAll.data ?? [];

  function submit() {
    setFormError(null);
    create.mutate(form);
  }

  const valid =
    /^[a-z][a-z0-9_]{2,39}$/.test(form.formatId) &&
    form.name.trim().length >= 3 &&
    form.description.trim().length >= 10 &&
    form.pedagogicFit.trim().length >= 10 &&
    form.exampleJson.trim().length >= 20 &&
    form.qaRules.trim().length >= 10;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-primary md:text-3xl">
            Repositorio de formatos
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Catálogo de arquetipos que el motor MGAA puede elegir al
            clasificar una semilla. Cada plantilla aporta su ejemplo few-shot y
            sus reglas de calidad: el motor las inyecta al prompt sin tocar
            código.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="tactile inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Registrar formato
        </button>
      </div>

      {/* Formulario de registro */}
      {showForm && (
        <div className="paper-card mt-6 space-y-4 p-6">
          <h2 className="font-display text-base text-primary">
            Nuevo arquetipo utilitario
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-primary">
                Identificador único
              </label>
              <input
                value={form.formatId}
                onChange={(e) =>
                  setForm({ ...form, formatId: e.target.value })
                }
                placeholder="simulator, memory_game…"
                className="w-full rounded-2xl border-2 border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                minúsculas, números y guion bajo · empieza con letra
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-primary">
                Nombre visible
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Simulador de fenómenos"
                className="w-full rounded-2xl border-2 border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-primary">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              placeholder="Qué hace este formato y cómo se juega…"
              className="w-full rounded-2xl border-2 border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-primary">
              Idoneidad pedagógica (el clasificador la usa para elegir)
            </label>
            <textarea
              value={form.pedagogicFit}
              onChange={(e) =>
                setForm({ ...form, pedagogicFit: e.target.value })
              }
              rows={2}
              placeholder="Ideal para fenómenos físicos o procesos con variables manipulables…"
              className="w-full rounded-2xl border-2 border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-primary">
              Ejemplo few-shot (JSON de una actividad completa en este formato)
            </label>
            <textarea
              value={form.exampleJson}
              onChange={(e) =>
                setForm({ ...form, exampleJson: e.target.value })
              }
              rows={6}
              placeholder='{"schemaVersion":"monito/v2","formatId":"…",…}'
              className="w-full rounded-2xl border-2 border-input bg-background px-4 py-2.5 font-mono text-xs outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-primary">
              Reglas de calidad (QA que el motor autoexige antes de entregar)
            </label>
            <textarea
              value={form.qaRules}
              onChange={(e) => setForm({ ...form, qaRules: e.target.value })}
              rows={3}
              placeholder="Ej. Cada paso debe ser observable; ninguna pista puede revelar la posición…"
              className="w-full rounded-2xl border-2 border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          {formError && (
            <p className="rounded-2xl border-2 border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
              {formError}
            </p>
          )}
          <button
            onClick={submit}
            disabled={!valid || create.isPending}
            className="tactile inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-40"
          >
            {create.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Registrar en el catálogo
          </button>
        </div>
      )}

      {/* Catálogo */}
      <div className="mt-6 space-y-4">
        {listAll.isLoading && (
          <div className="paper-card h-40 animate-pulse bg-muted" />
        )}
        {templates.map((t) => (
          <article key={t.id} className="paper-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                  <Blocks className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <p className="font-display text-base text-primary">
                    {t.name}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {t.formatId}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.description}
                  </p>
                  <p className="mt-2 rounded-2xl bg-accent/10 px-3 py-2 text-xs leading-relaxed">
                    <strong>Idoneidad:</strong> {t.pedagogicFit}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    t.isBuiltin
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-[#B9A7D9]/40 text-primary"
                  }`}
                >
                  {t.isBuiltin ? "Integrado" : "Comunitario"}
                </span>
                <button
                  onClick={() =>
                    setActive.mutate({ id: t.id, active: !t.isActive })
                  }
                  disabled={setActive.isPending}
                  className={`tactile rounded-2xl border-2 px-3 py-1.5 text-xs font-bold ${
                    t.isActive
                      ? "border-accent bg-accent/15 text-accent-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {t.isActive ? "Activo" : "Inactivo"}
                </button>
                {!t.isBuiltin && (
                  <button
                    onClick={() => del.mutate({ id: t.id })}
                    disabled={del.isPending}
                    className="tactile rounded-2xl border-2 border-border bg-card p-2 text-destructive"
                    aria-label={`Eliminar ${t.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-6 rounded-2xl bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        Los formatos con runtime integrado (opción múltiple, flashcards,
        secuencia) se despliegan como micro-apps interactivas web y offline.
        Los formatos comunitarios nuevos ya participan en la clasificación y
        generación few-shot del motor; su runtime interactivo se incorpora en
        una iteración posterior.
      </p>
    </div>
  );
}
