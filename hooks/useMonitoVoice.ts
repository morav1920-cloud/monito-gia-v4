import { useMemo } from "react";

/**
 * Banco Dinámico de Frases — Brand Book Conversacional Monito gIA (§2).
 * Selección aleatoria (Math.random) por perfil y momento de interacción
 * para evitar la monotonía. Docentes: tono profesional, cálido y
 * motivador. Alumnos: mentalidad de crecimiento (Dweck).
 */
export const MONITO_VOICE = {
  docente: {
    saludos: [
      "¡Hola, profe! Qué gusto tenerte de vuelta. ¿Qué reto transformaremos en aprendizaje hoy?",
      "¡Bienvenido de nuevo! El aula de hoy está lista para inspirar a tus alumnos.",
      "¡Hola! Listos para crear micro-apps increíbles alineadas al Plan de Estudios. ¿Por dónde empezamos?",
      "¡Qué alegría verte! Tu panel de Smart Analytics tiene nuevas estadísticas esperándote.",
      "¡Hola! Recuerda que hoy es un gran día para descubrir el potencial de cada estudiante.",
    ],
    despedidas: [
      "¡Gran trabajo hoy, profe! Los diagnósticos del grupo han quedado guardados de forma segura.",
      "¡Hasta pronto! Gracias por diseñar experiencias de aprendizaje que transforman vidas.",
      "¡Excelente sesión! Nos vemos en el próximo reto para seguir impulsando el talento de tu grupo.",
    ],
  },
  alumno: {
    saludos: [
      "¡Hola! Qué gusto verte por aquí, ¡listo para aprender algo nuevo y divertido hoy!",
      "¡Rayo de energía activado! ⚡ ¡Bienvenido a tu nueva misión de aprendizaje!",
      "¡Hola, explorador! Prepárate, que hoy vamos a poner a prueba nuestra mente de forma genial.",
      "¡Qué emoción verte! Recuerda que aquí cada intento nos hace más inteligentes.",
      "¡Hola! Tu cerebro está listo para brillar hoy. ¿Empezamos el reto?",
    ],
    /** Intervenciones de andamiaje (poses duda / idea / explicación) */
    andamiaje: {
      duda: "Hmm... esta pregunta requiere un superpoder de observación. ¡Vamos a revisar los detalles juntos!",
      idea: "¡Ajá! Siento una chispa de idea 💡. ¿Qué pasaría si probamos dividir el problema en partes más pequeñas?",
      explicacion:
        "Permíteme mostrarte una pista importante. Recuerda que no hay prisa, el camino es lo divertido.",
    },
    /** Celebración breve al acertar (Dweck: elogio al proceso) */
    celebraciones: [
      "¡Eso! Tu cerebro acaba de crecer un poquito más. 🌱",
      "¡Exacto! Se nota que pensaste como estratega.",
      "¡Lo lograste! Cada acierto es entrenamiento puro.",
      "¡Brillante! El esfuerzo que le pusiste se está viendo.",
    ],
    /** Apoyo tras un error (refuerzo de mentalidad de crecimiento) */
    apoyo: [
      "Los errores son pistas disfrazadas: ¡acabamos de encontrar una!",
      "Casi. Los expertos también fallan; su secreto es intentarlo otra vez.",
      "Este intento no salió, pero tu cerebro ya aprendió algo nuevo. ¡Vamos de nuevo!",
    ],
    despedidas: [
      "¡Lo lograste! Cada paso que diste hoy reforzó tus superpoderes mentales. ¡Nos vemos pronto!",
      "¡Gran esfuerzo! Recuerda: lo importante no fue no equivocarse, ¡sino haberlo intentado hasta lograrlo!",
      "¡Misión cumplida! Desconectando núcleo de energía por ahora... ¡Nos vemos en el próximo reto!",
      "¡Impresionante avance! Te vas a casa con nuevos conocimientos en tu mochila. ¡Hasta la próxima!",
    ],
  },
} as const;

/** Selección aleatoria uniforme de una frase del banco */
export function pickLine<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Hook de voz de Monito: fija las frases de la sesión al montar
 * (estables durante la vida del componente, distintas entre visitas).
 */
export function useMonitoVoice(perfil: "docente" | "alumno") {
  return useMemo(() => {
    const banco = MONITO_VOICE[perfil];
    return {
      saludo: pickLine(banco.saludos),
      despedida: pickLine(banco.despedidas),
    };
    // Se elige una vez por montaje: la variedad es entre sesiones
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil]);
}
