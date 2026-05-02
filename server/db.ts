import { eq, desc, and, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, articles, categories, media, InsertArticle, InsertMedia } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

// ─── Articles ────────────────────────────────────────────────────────────────

export async function getPublishedArticles(opts?: { categorySlug?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  if (opts?.categorySlug) {
    return db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        ogImage: articles.ogImage,
        status: articles.status,
        featured: articles.featured,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        categoryId: articles.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        authorId: articles.authorId,
        authorName: users.name,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(eq(articles.status, "published"), eq(categories.slug, opts.categorySlug)))
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  return db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      featuredImage: articles.featuredImage,
      ogImage: articles.ogImage,
      status: articles.status,
      featured: articles.featured,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      categoryId: articles.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      authorId: articles.authorId,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function getFeaturedArticle() {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      featuredImage: articles.featuredImage,
      ogImage: articles.ogImage,
      ogTitle: articles.ogTitle,
      ogDescription: articles.ogDescription,
      status: articles.status,
      featured: articles.featured,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      categoryId: articles.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      authorId: articles.authorId,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articles.status, "published"), eq(articles.featured, true)))
    .orderBy(desc(articles.publishedAt))
    .limit(1);
  return result[0] ?? null;
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      content: articles.content,
      featuredImage: articles.featuredImage,
      ogTitle: articles.ogTitle,
      ogDescription: articles.ogDescription,
      ogImage: articles.ogImage,
      status: articles.status,
      featured: articles.featured,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      categoryId: articles.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      authorId: articles.authorId,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.slug, slug))
    .limit(1);
  return result[0] ?? null;
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getAllArticlesAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      status: articles.status,
      featured: articles.featured,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      categoryId: articles.categoryId,
      categoryName: categories.name,
      authorId: articles.authorId,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(users, eq(articles.authorId, users.id))
    .orderBy(desc(articles.createdAt));
}

export async function createArticle(data: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(articles).values(data);
  return result;
}

export async function updateArticle(id: number, data: Partial<InsertArticle>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(articles).set(data).where(eq(articles.id, id));
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(articles).where(eq(articles.id, id));
}

// ─── Media ───────────────────────────────────────────────────────────────────

export async function getAllMedia(uploadedBy?: number) {
  const db = await getDb();
  if (!db) return [];
  if (uploadedBy) {
    return db.select().from(media).where(eq(media.uploadedBy, uploadedBy)).orderBy(desc(media.createdAt));
  }
  return db.select().from(media).orderBy(desc(media.createdAt));
}

export async function createMedia(data: InsertMedia) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(media).values(data);
  return result;
}

export async function deleteMedia(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(media).where(eq(media.id, id));
}

export async function getMediaById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return result[0] ?? null;
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return Number(result[0]?.count ?? 0);
}
