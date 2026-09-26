/**
 * Copy for the category pages.
 *
 * Without this a category page is a grid and a heading: no text of its own, so
 * nothing tells a search engine what the section is about. The wording leans on
 * how people actually search — "curiosidades de…", "datos curiosos de…".
 */

export const CATEGORY_INTROS: Record<string, string> = {
  noticias:
    "Noticias y acontecimientos con una vuelta de tuerca: lo que pasó, lo que casi pasa y lo que se contó mal durante años. Historias reales, verificadas antes de publicarlas.",
  entretenimiento:
    "Curiosidades de cine, música, televisión y cultura pop. Rodajes que salieron mal, canciones con historia detrás y datos que cambian cómo ves lo que ya creías conocer.",
  geek:
    "Datos curiosos de ciencia, espacio, videojuegos y tecnología para mentes inquietas. Experimentos raros, descubrimientos accidentales y el detalle que casi nadie cuenta.",
  salud:
    "Curiosidades del cuerpo humano, la medicina y la mente. Qué se creía antes, qué sabemos ahora y por qué tu organismo hace cosas que parecen imposibles.",
  tecnologia:
    "Historias y datos curiosos de la tecnología: inventos que nacieron por error, decisiones que cambiaron el mundo y el porqué de las cosas que usas todos los días.",
};

const FALLBACK = "Historias y datos curiosos que quizá no conocías, verificados antes de publicarlos.";

export function categoryIntro(slug: string, name: string): string {
  return CATEGORY_INTROS[slug] || `Curiosidades y datos sorprendentes sobre ${name}. ${FALLBACK}`;
}
