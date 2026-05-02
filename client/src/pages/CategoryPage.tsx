import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";

const CATEGORY_LABELS: Record<string, string> = {
  noticias: "Noticias",
  entretenimiento: "Entretenimiento",
  geek: "Geek",
  tecnologia: "Tecnología",
};

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const label = CATEGORY_LABELS[slug] || slug;

  const { data: articles, isLoading } = trpc.articles.list.useQuery({ categorySlug: slug, limit: 20 });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8F7F4" }}>
      <Navbar />

      {/* Category Hero */}
      <section className="ca-gradient-hero py-12">
        <div className="container">
          <span className="ca-badge mb-3">Categoría</span>
          <h1 className="font-bold text-4xl mt-2" style={{ fontFamily: "Poppins, sans-serif" }}>
            {label}
          </h1>
        </div>
      </section>

      <main className="flex-1">
        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl animate-pulse" style={{ height: 280, backgroundColor: "#FFFFFF" }} />
                  ))}
                </div>
              ) : articles && articles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} {...article} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl p-12 text-center" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E3DE" }}>
                  <p className="text-lg font-semibold mb-2">Sin artículos aún</p>
                  <p style={{ color: "#6B6B6B" }}>Pronto habrá contenido en esta categoría.</p>
                </div>
              )}
            </div>
            <aside className="lg:col-span-1">
              <div className="sticky top-24">
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
