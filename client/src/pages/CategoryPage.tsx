import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { categoryIntro } from "@shared/categories";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const { data: categories } = trpc.categories.list.useQuery(undefined, { staleTime: 60_000 });
  const { data: articles, isLoading } = trpc.articles.list.useQuery({ categorySlug: slug, limit: 20 });

  // The name comes from the database, so a new category needs no code change.
  const label = categories?.find((c) => c.slug === slug)?.name || slug;
  const count = articles?.length ?? 0;
  const intro = categoryIntro(slug, label);

  useSeoMeta({
    title: label,
    description: intro,
    url: `${window.location.origin}/categoria/${slug}`,
  });

  return (
    <div className="ca-category-page min-h-screen flex flex-col">
      <Navbar />

      <section className="ca-category-hero">
        <div className="container">
          <span className="ca-eyebrow">Categoría</span>
          <h1 className="ca-category-hero__title">{label}</h1>
          <p className="ca-category-hero__intro">{intro}</p>
          {!isLoading && count > 0 && (
            <p className="ca-category-hero__count">
              {count} {count === 1 ? "historia" : "historias"}
            </p>
          )}
        </div>
      </section>

      <main className="flex-1">
        <div className="container py-8 md:py-10">
          {isLoading ? (
            <div className="ca-category-grid grid gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="ca-category-skeleton rounded-xl animate-pulse" />
              ))}
            </div>
          ) : count > 0 ? (
            <div className="ca-category-grid grid gap-5">
              {articles!.map((article) => (
                <ArticleCard key={article.id} {...article} />
              ))}
            </div>
          ) : (
            <div className="ca-category-empty rounded-xl p-12 text-center">
              <p className="text-lg font-semibold mb-2">Sin artículos aún</p>
              <p>Pronto habrá contenido en esta categoría.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
