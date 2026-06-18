import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPublishedArticles,
  getFeaturedArticle,
  getArticleBySlug,
  getArticleById,
  isArticleCurrentlyPublished,
  getAllArticlesAdmin,
  createArticle,
  updateArticle,
  deleteArticle,
  getAllMedia,
  createMedia,
  deleteMedia,
  getMediaById,
  getAllUsers,
  updateUserRole,
  updateUserAccessStatus,
  getSiteConfigValue,
  setSiteConfigValue,
  getArticlesByIds,
  setFeaturedArticle,
  clearFeaturedArticle,
  searchArticles,
  getAllDatosCuriosos,
  getActiveDatosCuriosos,
  createDatoCurioso,
  updateDatoCurioso,
  deleteDatoCurioso,
  getTriviaByArticle,
  createTrivia,
  updateTrivia,
  deleteTrivia,
  getRecentUsers,
} from "./db";
import { uploadToCloudinary, deleteFromCloudinary } from "./cloudinaryStorage";
import { nanoid } from "nanoid";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

const socialLinksSchema = z.object({
  facebook: z.string().url("URL de Facebook inválida").or(z.literal("")),
  instagram: z.string().url("URL de Instagram inválida").or(z.literal("")),
  tiktok: z.string().url("URL de TikTok inválida").or(z.literal("")),
});

type SocialLinks = z.infer<typeof socialLinksSchema>;

const emptySocialLinks: SocialLinks = {
  facebook: "",
  instagram: "",
  tiktok: "",
};

function parseSocialLinks(raw: string | null): SocialLinks {
  if (!raw) return emptySocialLinks;
  try {
    const parsed = socialLinksSchema.partial().parse(JSON.parse(raw));
    return { ...emptySocialLinks, ...parsed };
  } catch {
    return emptySocialLinks;
  }
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Categories ─────────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(async () => {
      return getAllCategories();
    }),

    create: adminProcedure
      .input(z.object({ name: z.string().min(1).max(100) }))
      .mutation(async ({ input }) => {
        const slug = slugify(input.name);
        if (!slug) throw new TRPCError({ code: "BAD_REQUEST", message: "Nombre inválido para generar slug" });
        return createCategory(input.name.trim(), slug);
      }),

    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1).max(100) }))
      .mutation(async ({ input }) => {
        const slug = slugify(input.name);
        if (!slug) throw new TRPCError({ code: "BAD_REQUEST", message: "Nombre inválido para generar slug" });
        return updateCategory(input.id, input.name.trim(), slug);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCategory(input.id);
        return { success: true };
      }),
  }),

  // ─── Articles (public) ──────────────────────────────────────────────────────
  articles: router({
    list: publicProcedure
      .input(z.object({
        categorySlug: z.string().optional(),
        limit: z.number().min(1).max(50).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ input }) => {
        return getPublishedArticles({
          categorySlug: input?.categorySlug,
          limit: input?.limit ?? 12,
          offset: input?.offset ?? 0,
        });
      }),

    featured: publicProcedure.query(async () => {
      return getFeaturedArticle();
    }),

    search: publicProcedure
      .input(z.object({ q: z.string().min(1).max(100) }))
      .query(async ({ input }) => {
        return searchArticles(input.q);
      }),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        const article = await getArticleBySlug(input.slug);
        const isAdmin = ctx.user?.role === "admin";
        if (!article || (!isAdmin && !isArticleCurrentlyPublished(article))) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Artículo no encontrado" });
        }
        return article;
      }),

    // ─── Admin procedures ──────────────────────────────────────────────────
    adminList: adminProcedure.query(async () => {
      return getAllArticlesAdmin();
    }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        featuredImage: z.string().optional(),
        ogTitle: z.string().optional(),
        ogDescription: z.string().optional(),
        ogImage: z.string().optional(),
        status: z.enum(["draft", "published"]).default("draft"),
        featured: z.boolean().default(false),
        categoryId: z.number().optional(),
        publishedAt: z.string().optional(), // ISO string
      }))
      .mutation(async ({ input, ctx }) => {
        const slug = input.slug || slugify(input.title) + "-" + nanoid(6);
        const publishedAt = input.publishedAt ? new Date(input.publishedAt) : (input.status === "published" ? new Date() : undefined);
        await createArticle({
          title: input.title,
          slug,
          excerpt: input.excerpt,
          content: input.content,
          featuredImage: input.featuredImage,
          ogTitle: input.ogTitle,
          ogDescription: input.ogDescription,
          ogImage: input.ogImage,
          status: input.status,
          featured: input.featured,
          categoryId: input.categoryId,
          authorId: ctx.user.id,
          publishedAt,
        });
        const createdArticle = await getArticleBySlug(slug);
        if (!createdArticle) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo recuperar el artículo creado" });
        }
        return { id: createdArticle.id, slug: createdArticle.slug };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        featuredImage: z.string().optional(),
        ogTitle: z.string().optional(),
        ogDescription: z.string().optional(),
        ogImage: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
        featured: z.boolean().optional(),
        categoryId: z.number().optional(),
        publishedAt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, publishedAt, ...rest } = input;
        const updateData: Record<string, unknown> = { ...rest };
        if (publishedAt !== undefined) {
          updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
        }
        await updateArticle(id, updateData as Parameters<typeof updateArticle>[1]);
        return { success: true };
      }),

     delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteArticle(input.id);
        return { success: true };
      }),

    setFeatured: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await setFeaturedArticle(input.id);
        return { success: true };
      }),

    clearFeatured: adminProcedure
      .mutation(async () => {
        await clearFeaturedArticle();
        return { success: true };
      }),
  }),
  // ─── Media ──────────────────────────────────────────────────────────────────
  media: router({
    list: adminProcedure.query(async () => {
      return getAllMedia();
    }),

    upload: adminProcedure
      .input(z.object({
        filename: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        size: z.number(),
        base64: z.string(), // base64 encoded file
        width: z.number().optional(),
        height: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const { url, publicId, width, height } = await uploadToCloudinary(buffer, {
          folder: `curioso-ando/media/${ctx.user.id}`,
          mimeType: input.mimeType,
        });
        await createMedia({
          filename: input.filename,
          originalName: input.originalName,
          url,
          storageKey: publicId,
          mimeType: input.mimeType,
          size: input.size,
          width: width ?? input.width,
          height: height ?? input.height,
          uploadedBy: ctx.user.id,
        });
        return { url, key: publicId };
      }),

     delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const mediaItem = await getMediaById(input.id);
        if (mediaItem?.storageKey) {
          try {
            await deleteFromCloudinary(mediaItem.storageKey);
          } catch (err) {
            console.warn("[Media] Could not delete from Cloudinary:", err);
          }
        }
        await deleteMedia(input.id);
        return { success: true };
      }),
  }),  // end media

  users: router({
    list: adminProcedure.query(async () => {
      return await getAllUsers();
    }),
    updateRole: adminProcedure
      .input(z.object({ id: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input, ctx }) => {
        if (input.id === ctx.user.id && input.role !== "admin") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes remover tu propio rol de administrador" });
        }
        await updateUserRole(input.id, input.role);
        return { success: true };
      }),
    updateAccessStatus: adminProcedure
      .input(z.object({ id: z.number(), accessStatus: z.enum(["active", "blocked"]) }))
      .mutation(async ({ input, ctx }) => {
        if (input.id === ctx.user.id && input.accessStatus === "blocked") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes bloquear tu propio usuario" });
        }
        await updateUserAccessStatus(input.id, input.accessStatus);
        return { success: true };
      }),
    recentList: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }))
      .query(async ({ input }) => {
        return await getRecentUsers(input.limit ?? 20);
      }),
  }),

  siteConfig: router({
    // Get the global sidebar articles config
    getSidebarArticles: publicProcedure.query(async () => {
      const raw = await getSiteConfigValue("sidebar_articles");
      if (!raw) return { recentIds: [], recommendedIds: [] };
      try {
        return JSON.parse(raw) as { recentIds: number[]; recommendedIds: number[] };
      } catch {
        return { recentIds: [], recommendedIds: [] };
      }
    }),
    // Get the actual article data for sidebar
    getSidebarArticleData: publicProcedure.query(async () => {
      const raw = await getSiteConfigValue("sidebar_articles");
      let ids: { recentIds: number[]; recommendedIds: number[] } = { recentIds: [], recommendedIds: [] };
      if (raw) {
        try { ids = JSON.parse(raw); } catch {}
      }
      const [recentArticles, recommendedArticles] = await Promise.all([
        getArticlesByIds(ids.recentIds),
        getArticlesByIds(ids.recommendedIds),
      ]);
      return { recentArticles, recommendedArticles };
    }),
    // Get banner config
    getBanner: publicProcedure.query(async () => {
      const raw = await getSiteConfigValue("hero_banner");
      if (!raw) return { title: "Curioseando Ando", subtitle: "Datos raros, curiosos y sorprendentes. Noticias, entretenimiento, geek y tecnolog\u00eda en un solo lugar.", bgColor: "" };
      try { return JSON.parse(raw) as { title: string; subtitle: string; bgColor: string }; }
      catch { return { title: "Curioseando Ando", subtitle: "", bgColor: "" }; }
    }),
    // Get social links config
    getSocialLinks: publicProcedure.query(async () => {
      const raw = await getSiteConfigValue("social_links");
      return parseSocialLinks(raw);
    }),
    // Save banner config
    setBanner: adminProcedure
      .input(z.object({
        title: z.string().min(1).max(120),
        subtitle: z.string().max(300).optional(),
        bgColor: z.string().max(100).optional(),
      }))
      .mutation(async ({ input }) => {
        await setSiteConfigValue("hero_banner", JSON.stringify(input));
        return { success: true };
      }),
    // Save social links config
    setSocialLinks: adminProcedure
      .input(socialLinksSchema)
      .mutation(async ({ input }) => {
        await setSiteConfigValue("social_links", JSON.stringify(input));
        return { success: true };
      }),
    // Save the global sidebar articles config
    setSidebarArticles: adminProcedure
      .input(z.object({
        recentIds: z.array(z.number()),
        recommendedIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        await setSiteConfigValue("sidebar_articles", JSON.stringify(input));
        return { success: true };
      }),
  }),
  datosCuriosos: router({
    // Pública: obtener datos curiosos activos (aleatorios) para el sidebar
    listActivos: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(20).optional() }))
      .query(async ({ input }) => {
        return getActiveDatosCuriosos(input.limit ?? 5);
      }),
    // Admin: listar todos
    listAll: adminProcedure.query(async () => {
      return getAllDatosCuriosos();
    }),
    // Admin: crear
    create: adminProcedure
      .input(z.object({
        titulo: z.string().min(1).max(255),
        contenido: z.string().min(1),
        icono: z.string().max(50).optional(),
        color: z.string().max(30).optional(),
      }))
      .mutation(async ({ input }) => {
        return createDatoCurioso(input);
      }),
    // Admin: actualizar
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        titulo: z.string().min(1).max(255).optional(),
        contenido: z.string().min(1).optional(),
        icono: z.string().max(50).optional(),
        color: z.string().max(30).optional(),
        activo: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateDatoCurioso(id, data);
      }),
    // Admin: eliminar
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteDatoCurioso(input.id);
        return { success: true };
      }),
  }),

  // ─── Article Trivia ───────────────────────────────────────────────────────
  trivia: router({
    // Pública: obtener trivia de un artículo
    listByArticle: publicProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input }) => {
        return getTriviaByArticle(input.articleId);
      }),
    // Admin: crear trivia para un artículo
    create: adminProcedure
      .input(z.object({
        articleId: z.number(),
        pregunta: z.string().min(1).max(500),
        respuesta: z.string().min(1),
        opcionCorrecta: z.string().min(1).max(255),
        opcionIncorrecta: z.string().min(1).max(255),
        opciones: z.string().optional(),
        opcionCorrectaIndex: z.number().int().min(0).max(4).optional(),
        icono: z.string().max(50).optional(),
        color: z.string().max(30).optional(),
      }))
      .mutation(async ({ input }) => {
        return createTrivia(input);
      }),
    // Admin: actualizar trivia
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        pregunta: z.string().min(1).max(500).optional(),
        respuesta: z.string().min(1).optional(),
        opcionCorrecta: z.string().min(1).max(255).optional(),
        opcionIncorrecta: z.string().min(1).max(255).optional(),
        opciones: z.string().optional(),
        opcionCorrectaIndex: z.number().int().min(0).max(4).optional(),
        icono: z.string().max(50).optional(),
        color: z.string().max(30).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateTrivia(id, data);
      }),
    // Admin: eliminar trivia
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTrivia(input.id);
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;