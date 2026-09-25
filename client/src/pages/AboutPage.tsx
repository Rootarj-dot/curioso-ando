import { useEffect } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BookOpen, Compass, ShieldCheck, ArrowRight } from "lucide-react";
import { useSeoMeta } from "@/hooks/useSeoMeta";

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useSeoMeta({
    title: "Acerca de",
    description:
      "Quién está detrás de Curioseando Ando, por qué existe y cómo se eligen y verifican las historias que se publican.",
    url: `${window.location.origin}/acerca-de`,
  });

  return (
    <div className="ca-about-page min-h-screen flex flex-col">
      <Navbar />

      <section className="ca-about-hero">
        <div className="container">
          <span className="ca-eyebrow">Acerca de</span>
          <h1 className="ca-about-hero__title">Curiosidad con método</h1>
          <p className="ca-about-hero__intro">
            Historias, datos y acontecimientos que casi nadie conoce, o que el tiempo dejó
            olvidados. Contados de forma sencilla, pero verificados antes de publicarlos.
          </p>
        </div>
      </section>

      <main className="flex-1">
        <div className="container py-10 md:py-14">
          <div className="ca-about-grid">
            <article className="ca-about-card">
              <span className="ca-about-card__icon"><Compass className="w-5 h-5" /></span>
              <h2>Quién está detrás</h2>
              <p>
                Me llamo <strong>Alberto S.</strong>, soy ingeniero en sistemas y un apasionado de
                la cultura general y el conocimiento. Siempre me ha gustado investigar, aprender
                cosas nuevas y descubrir historias y datos que muchas veces no conocemos, o que han
                quedado olvidados con el paso del tiempo.
              </p>
              <p>
                Curioseando Ando es un proyecto personal: escribo y edito cada publicación del
                sitio.
              </p>
            </article>

            <article className="ca-about-card">
              <span className="ca-about-card__icon"><BookOpen className="w-5 h-5" /></span>
              <h2>Por qué existe</h2>
              <p>
                Este sitio nace con la intención de compartir datos interesantes, historias y
                curiosidades que quizá no conocías. La idea es acercar la información de una manera
                entretenida y sencilla, despertando la curiosidad y las ganas de seguir aprendiendo.
              </p>
              <p>
                Sin tecnicismos innecesarios y sin dar por hecho que ya sabes de qué va: solo la
                historia, bien contada.
              </p>
            </article>

            <article className="ca-about-card">
              <span className="ca-about-card__icon"><ShieldCheck className="w-5 h-5" /></span>
              <h2>Cómo se verifica</h2>
              <p>
                Para preparar cada historia busco información en distintas fuentes: libros,
                artículos y portales web especializados. Procuro <strong>contrastar los datos entre
                varias fuentes</strong> y verificarlos antes de publicar.
              </p>
              <p>
                El objetivo es compartir contenido interesante, pero también confiable. Si un dato
                no se sostiene, no se publica.
              </p>
            </article>
          </div>

          <section className="ca-about-note">
            <h2>¿Encontraste un error?</h2>
            <p>
              Verificar no es infalible. Si detectas un dato equivocado o tienes una fuente mejor,
              escríbeme: corregir una historia es tan importante como publicarla.
            </p>
            <Link href="/contacto" className="ca-primary-action">
              Escríbeme <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
