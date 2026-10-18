import { useId, useState } from "react";
import {
  MONITO_PALETTE,
  type MonitoColor,
} from "@contracts/curriculum";

/**
 * Monito gIA — guía holográfico translúcido (Brand Book §1).
 * Construido con esferas y cilindros de cristal vectoriales (SVG puro,
 * cero assets, <4 KB), núcleo interno luminoso pulsante y poses
 * expresivas sin rostro humano.
 *
 * Poses: saludo · alegria · idea · movimiento · estudio · exito · duda · explicacion
 */
export type MonitoPose =
  | "saludo"
  | "alegria"
  | "idea"
  | "movimiento"
  | "estudio"
  | "exito"
  | "duda"
  | "explicacion";

interface ArmSpec {
  /** rotación en grados alrededor del hombro (0 = brazo caído) */
  left: number;
  right: number;
  /** ondular el brazo derecho (saludo) */
  wave?: boolean;
  headTilt?: number;
  bodyTilt?: number;
}

const POSE_ARMS: Record<MonitoPose, ArmSpec> = {
  saludo: { left: 18, right: -150, wave: true },
  alegria: { left: 150, right: -150 },
  idea: { left: 22, right: -128 },
  movimiento: { left: 48, right: -48, bodyTilt: 7 },
  estudio: { left: 34, right: -34 },
  exito: { left: 152, right: -152 },
  duda: { left: 14, right: -118, headTilt: 9 },
  explicacion: { left: 16, right: -78 },
};

function Sparkle({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <path
      d={`M${x} ${y - s} l${s * 0.32} ${s * 0.68} ${s * 0.68} ${s * 0.32} -${s * 0.68} ${s * 0.32} -${s * 0.32} ${s * 0.68} -${s * 0.32} -${s * 0.68} -${s * 0.68} -${s * 0.32} ${s * 0.68} -${s * 0.32} z`}
      fill={fill}
    />
  );
}

export function MonitoAvatar({
  pose = "saludo",
  color = "azul",
  size = 96,
  className,
  animated = true,
}: {
  pose?: MonitoPose;
  color?: MonitoColor;
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  const uid = useId().replace(/[:]/g, "");
  const pal = MONITO_PALETTE[color] ?? MONITO_PALETTE.azul;
  const arms = POSE_ARMS[pose] ?? POSE_ARMS.saludo;

  const glass = `url(#g-${uid})`;
  const coreGrad = `url(#c-${uid})`;

  /** Brazo completo: cápsula superior, codo esférico, antebrazo, mano esfera */
  function arm(side: "left" | "right") {
    const sx = side === "left" ? 41 : 79;
    const angle = side === "left" ? arms.left : arms.right;
    const waving = side === "right" && arms.wave;
    return (
      <g
        transform={waving ? undefined : `rotate(${angle} ${sx} 76)`}
        style={waving ? { transformOrigin: `${sx}px 76px` } : undefined}
        className={waving && animated ? "monito-wave" : undefined}
      >
        <rect x={sx - 4} y={76} width={8} height={17} rx={4} fill={glass} stroke="rgba(255,255,255,.55)" strokeWidth={0.8} />
        <circle cx={sx} cy={95} r={4.2} fill={glass} stroke="rgba(255,255,255,.5)" strokeWidth={0.7} />
        <rect x={sx - 3.6} y={95} width={7.2} height={15} rx={3.6} fill={glass} stroke="rgba(255,255,255,.55)" strokeWidth={0.8} />
        <circle cx={sx} cy={114} r={6.6} fill={glass} stroke="rgba(255,255,255,.6)" strokeWidth={0.9} />
        <circle cx={sx} cy={114} r={2.6} fill={pal.core} opacity={0.85} />
      </g>
    );
  }

  return (
    <svg
      viewBox="0 0 120 176"
      width={size}
      height={(size * 176) / 120}
      className={`${animated ? "monito-float " : ""}${className ?? ""}`}
      role="img"
      aria-label={`Monito gIA, asistente holográfico, pose ${pose}`}
    >
      <defs>
        <radialGradient id={`g-${uid}`} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.92} />
          <stop offset="42%" stopColor={pal.glass} stopOpacity={0.5} />
          <stop offset="100%" stopColor={pal.deep} stopOpacity={0.55} />
        </radialGradient>
        <radialGradient id={`c-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="35%" stopColor={pal.core} stopOpacity={0.95} />
          <stop offset="100%" stopColor={pal.core} stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* sombra de levitación */}
      <ellipse cx={60} cy={168} rx={26} ry={4.5} fill={pal.deep} opacity={0.16} />

      {/* líneas de velocidad (movimiento) */}
      {pose === "movimiento" && (
        <g stroke={pal.core} strokeWidth={3} strokeLinecap="round" opacity={0.55}>
          <line x1={8} y1={70} x2={24} y2={70} />
          <line x1={4} y1={84} x2={26} y2={84} />
          <line x1={10} y1={98} x2={24} y2={98} />
        </g>
      )}

      <g transform={arms.bodyTilt ? `rotate(${arms.bodyTilt} 60 110)` : undefined}>
        {/* piernas y pies */}
        <rect x={47.5} y={112} width={9} height={30} rx={4.5} fill={glass} stroke="rgba(255,255,255,.55)" strokeWidth={0.8} />
        <rect x={63.5} y={112} width={9} height={30} rx={4.5} fill={glass} stroke="rgba(255,255,255,.55)" strokeWidth={0.8} />
        <circle cx={52} cy={148} r={8.5} fill={glass} stroke="rgba(255,255,255,.6)" strokeWidth={0.9} />
        <circle cx={68} cy={148} r={8.5} fill={glass} stroke="rgba(255,255,255,.6)" strokeWidth={0.9} />
        <circle cx={52} cy={149} r={3} fill={pal.core} opacity={0.7} />
        <circle cx={68} cy={149} r={3} fill={pal.core} opacity={0.7} />

        {arm("left")}
        {arm("right")}

        {/* torso esférico con núcleo luminoso */}
        <circle cx={60} cy={90} r={19.5} fill={glass} stroke="rgba(255,255,255,.6)" strokeWidth={1} />
        <circle cx={60} cy={90} r={13} fill={coreGrad} className={animated ? "monito-core" : undefined} />
        <ellipse cx={53} cy={82} rx={6} ry={4} fill="#FFF" opacity={0.65} />

        {/* cuello */}
        <rect x={55.5} y={60} width={9} height={12} rx={4} fill={glass} stroke="rgba(255,255,255,.5)" strokeWidth={0.7} />

        {/* cabeza: esfera de cristal sin rostro, con núcleo */}
        <g transform={arms.headTilt ? `rotate(${arms.headTilt} 60 58)` : undefined}>
          <circle cx={60} cy={44} r={16.5} fill={glass} stroke="rgba(255,255,255,.65)" strokeWidth={1} />
          <circle cx={60} cy={44} r={9.5} fill={coreGrad} className={animated ? "monito-core" : undefined} />
          <ellipse cx={54} cy={37} rx={5.5} ry={3.6} fill="#FFF" opacity={0.7} />
        </g>
      </g>

      {/* ---- accesorios por pose ---- */}
      {pose === "idea" && (
        <g>
          <circle cx={60} cy={12} r={7} fill="#FFCE4A" stroke="#E0A93F" strokeWidth={1.4} />
          <rect x={57.5} y={19} width={5} height={4} rx={1.6} fill="#E0A93F" />
          <g stroke="#FFCE4A" strokeWidth={2} strokeLinecap="round">
            <line x1={60} y1={1} x2={60} y2={4} />
            <line x1={48} y1={6} x2={51} y2={8.5} />
            <line x1={72} y1={6} x2={69} y2={8.5} />
          </g>
        </g>
      )}
      {pose === "duda" && (
        <text x={88} y={30} fontSize={26} fontWeight={800} fill={pal.core} fontFamily="ui-rounded, system-ui, sans-serif">
          ?
        </text>
      )}
      {pose === "explicacion" && (
        <g transform="rotate(8 96 72)">
          <rect x={86} y={64} width={15} height={12} rx={2.5} fill="#FFF" stroke={pal.core} strokeWidth={1.4} />
          <rect x={99} y={64} width={15} height={12} rx={2.5} fill="#FFF" stroke={pal.core} strokeWidth={1.4} />
          <line x1={100} y1={64} x2={100} y2={76} stroke={pal.core} strokeWidth={1.4} />
          <line x1={89} y1={68} x2={97} y2={68} stroke={pal.glass} strokeWidth={1.4} />
          <line x1={103} y1={68} x2={111} y2={68} stroke={pal.glass} strokeWidth={1.4} />
        </g>
      )}
      {pose === "estudio" && (
        <g>
          <rect x={42} y={128} width={36} height={22} rx={3.5} fill="#3F2B5C" />
          <rect x={45} y={131} width={30} height={14} rx={2} fill={pal.core} opacity={0.85} />
          <rect x={38} y={150} width={44} height={4.5} rx={2.2} fill="#563E79" />
        </g>
      )}
      {(pose === "exito" || pose === "alegria") && (
        <g>
          <Sparkle x={22} y={30} s={9} fill="#FFCE4A" />
          <Sparkle x={98} y={22} s={7} fill={pal.core} />
          <Sparkle x={104} y={52} s={5.5} fill="#F5CAC3" />
        </g>
      )}
    </svg>
  );
}

/**
 * Compañero de esquina para el runtime del alumno: Monito flotante con
 * globo de diálogo. Tocar al Monito muestra/oculta el globo.
 */
export function MonitoCompanion({
  pose,
  color = "azul",
  message,
  size = 68,
}: {
  pose: MonitoPose;
  color?: MonitoColor;
  message?: string | null;
  size?: number;
}) {
  const [hidden, setHidden] = useState(false);
  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-40 flex max-w-[min(78vw,260px)] flex-col items-end gap-1.5">
      {message && !hidden && (
        <div
          className="animate-pop-in rounded-2xl rounded-br-md border-2 border-primary/15 bg-card px-3.5 py-2.5 text-[13px] font-semibold leading-snug text-foreground shadow-[0_8px_24px_-10px_rgba(63,43,92,.4)]"
          role="status"
        >
          {message}
        </div>
      )}
      <button
        type="button"
        onClick={() => setHidden((h) => !h)}
        aria-label={hidden ? "Mostrar mensaje de Monito" : "Ocultar mensaje de Monito"}
        title="Monito gIA"
        className="pointer-events-auto tactile rounded-full"
      >
        <MonitoAvatar pose={pose} color={color} size={size} />
      </button>
    </div>
  );
}
