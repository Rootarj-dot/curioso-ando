import { z } from "zod/v4";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getAllCategories,
  getPublishedArticles,
  getFeaturedArticle,
  getArticleBySlug,
  getArticleById,
  getAllArticlesAdmin,
  createArticle,
  updateArticle,
  deleteArticle,
  getAllMedia,
  createMedia,
  deleteMedia,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Helper: admin-only guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores pueden realizar esta acción" });
  }
  return next({ ctx });
});

// Helper: editor or admin
const editorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "user") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acceso denegado" });
  }
  return next({ ctx });
});

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

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await getArticleBySlug(input.slug);
        if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "Artículo no encontrado" });
        return article;
      }),

    // ─── Admin procedures ──────────────────────────────────────────────────
    adminList: protectedProcedure.query(async () => {
      return getAllArticlesAdmin();
    }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().default("{}"),
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
        return { slug };
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
  }),

  // ─── Media ──────────────────────────────────────────────────────────────────
  media: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAllMedia();
    }),

    upload: protectedProcedure
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
        const key = `media/${ctx.user.id}/${Date.now()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await createMedia({
          filename: input.filename,
          originalName: input.originalName,
          url,
          storageKey: key,
          mimeType: input.mimeType,
          size: input.size,
          width: input.width,
          height: input.height,
          uploadedBy: ctx.user.id,
        });
        return { url, key };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteMedia(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
