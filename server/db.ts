import { eq, desc, and, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, articles, categories, media, InsertArticle, InsertMedia, datosCuriosos, articleTrivia } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let secureAdminRolesMigration: Promise<void> | null = null;

const SECURE_ADMIN_EMAILS = ["shuraand@gmail.com", "mechanicmurry23@gmail.com"];

async function ensureSecureAdminRolesSchema() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  secureAdminRolesMigration ??= (async () => {
    const conn = await mysql.createConnection(databaseUrl);
    try {
      const [columns] = await conn.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'
           AND COLUMN_NAME = 'accessStatus'
         LIMIT 1`
      );

      if (Array.isArray(columns) && columns.length === 0) {
        await conn.execute(
          "ALTER TABLE `users` ADD `accessStatus` enum('active','blocked') NOT NULL DEFAULT 'active'"
        );
        console.log("[Database] ✅ Columna users.accessStatus creada automáticamente");
      }

      await conn.execute(
        `UPDATE \`users\`
         SET \`role\` = 'user'
         WHERE \`role\` = 'admin'
           AND LOWER(COALESCE(\`email\`, '')) NOT IN (?, ?)`,
        SECURE_ADMIN_EMAILS
      );

      await conn.execute(
        `UPDATE \`users\`
         SET \`role\` = 'admin', \`accessStatus\` = 'active'
         WHERE LOWER(COALESCE(\`email\`, '')) IN (?, ?)`,
        SECURE_ADMIN_EMAILS
      );
    } catch (error) {
      secureAdminRolesMigration = null;
      console.error("[Database] ❌ Error aplicando migración de roles seguros:", error);
      throw error;
    } finally {
      await conn.end();
    }
  })();

  await secureAdminRolesMigration;
}

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
  await ensureSecureAdminRolesSchema();
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
  }
  if (user.accessStatus !== undefined) {
    values.accessStatus = user.accessStatus;
    updateSet.accessStatus = user.accessStatus;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  await ensureSecureAdminRolesSchema();
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

function publishedAtHasArrivedCondition() {
  return sql`(${articles.publishedAt} IS NULL OR ${articles.publishedAt} <= CURRENT_TIMESTAMP)`;
}

function publicArticleCondition() {
  return and(eq(articles.status, "published"), publishedAtHasArrivedCondition());
}

export function isArticleCurrentlyPublished(article: { status?: string | null; publishedAt?: Date | string | null }) {
  if (article.status !== "published") return false;
  if (!article.publishedAt) return true;
  return new Date(article.publishedAt).getTime() <= Date.now();
}

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
      .where(and(publicArticleCondition(), eq(categories.slug, opts.categorySlug)))
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
    .where(publicArticleCondition())
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
    .where(and(publicArticleCondition(), eq(articles.featured, true)))
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
      featuredImage: articles.featuredImage,
      ogImage: articles.ogImage,
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

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  await ensureSecureAdminRolesSchema();
  const result = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    accessStatus: users.accessStatus,
    loginMethod: users.loginMethod,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(users.createdAt);
  return result;
}

export async function updateUserRole(id: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function updateUserAccessStatus(id: number, accessStatus: "active" | "blocked") {
  const db = await getDb();
  if (!db) return;
  await ensureSecureAdminRolesSchema();
  await db.update(users).set({ accessStatus }).where(eq(users.id, id));
}

// ─── Site Config ─────────────────────────────────────────────────────────────

export async function getSiteConfigValue(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const { siteConfig } = await import("../drizzle/schema");
    const result = await db.select().from(siteConfig).where(eq(siteConfig.key, key)).limit(1);
    return result[0]?.value ?? null;
  } catch {
    return null;
  }
}

export async function setSiteConfigValue(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const { siteConfig } = await import("../drizzle/schema");
  await db.insert(siteConfig).values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

export async function getArticlesByIds(ids: number[]) {
  if (!ids.length) return [];
  const db = await getDb();
  if (!db) return [];
  const results = [];
  for (const id of ids) {
    const rows = await db
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
      .where(and(eq(articles.id, id), publicArticleCondition()))
      .limit(1);
    if (rows[0]) results.push(rows[0]);
  }
  return results;
}

export async function createCategory(name: string, slug: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(categories).values({ name, slug });
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

export async function updateCategory(id: number, name: string, slug: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(categories).set({ name, slug }).where(eq(categories.id, id));
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0];
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(categories).where(eq(categories.id, id));
}

// ─── Search Articles ────────────────────────────────────────────────────────

export async function searchArticles(query: string) {
  const db = await getDb();
  if (!db) return [];
  const term = `%${query}%`;
  return db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      featuredImage: articles.featuredImage,
      ogImage: articles.ogImage,
      publishedAt: articles.publishedAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(and(publicArticleCondition(), like(articles.title, term)))
    .orderBy(desc(articles.publishedAt))
    .limit(10);
}

// ─── Featured Article of the Week ────────────────────────────────────────────────────

export async function setFeaturedArticle(articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Clear all featured flags first, then set the chosen article
  await db.update(articles).set({ featured: false });
  await db.update(articles).set({ featured: true }).where(eq(articles.id, articleId));
}

export async function clearFeaturedArticle() {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(articles).set({ featured: false });
}

// ─── Datos Curiosos ─────────────────────────────────────────────────────────────────────────────

export async function getAllDatosCuriosos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(datosCuriosos).orderBy(desc(datosCuriosos.createdAt));
}

export async function getActiveDatosCuriosos(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(datosCuriosos)
    .where(eq(datosCuriosos.activo, true))
    .orderBy(sql`RAND()`)
    .limit(limit);
}

function toMysqlDatetime(d: Date): string {
  // Format: YYYY-MM-DD HH:MM:SS in UTC — compatible with MariaDB 10.4 and TiDB
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export async function createDatoCurioso(data: { titulo: string; contenido: string; icono?: string; color?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = toMysqlDatetime(new Date());
  const icono = data.icono || "Lightbulb";
  const color = data.color || "#7C3AED";
  // Use raw SQL to avoid Drizzle generating DEFAULT keyword for id (incompatible with MariaDB 10.4)
  await db.execute(
    sql`INSERT INTO datos_curiosos (titulo, contenido, icono, color, activo, createdAt, updatedAt)
        VALUES (${data.titulo}, ${data.contenido}, ${icono}, ${color}, true, ${now}, ${now})`
  );
  const rows = await db.select().from(datosCuriosos).orderBy(desc(datosCuriosos.createdAt)).limit(1);
  return rows[0];
}

export async function updateDatoCurioso(id: number, data: Partial<{ titulo: string; contenido: string; icono: string; color: string; activo: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(datosCuriosos).set({ ...data, updatedAt: toMysqlDatetime(new Date()) as unknown as Date }).where(eq(datosCuriosos.id, id));
  const rows = await db.select().from(datosCuriosos).where(eq(datosCuriosos.id, id)).limit(1);
  return rows[0];
}

export async function deleteDatoCurioso(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(datosCuriosos).where(eq(datosCuriosos.id, id));
}

// ─── Article Trivia ───────────────────────────────────────────────────────────

export async function getTriviaByArticle(articleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(articleTrivia).where(eq(articleTrivia.articleId, articleId)).orderBy(articleTrivia.createdAt);
}

type TriviaWriteData = {
  articleId: number;
  pregunta: string;
  respuesta: string;
  opcionCorrecta: string;
  opcionIncorrecta: string;
  opciones?: string;
  opcionCorrectaIndex?: number;
  icono?: string;
  color?: string;
};

type TriviaUpdateData = Partial<Omit<TriviaWriteData, "articleId">>;

export async function createTrivia(data: TriviaWriteData) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const now = toMysqlDatetime(new Date());
  const icono = data.icono || "HelpCircle";
  const color = data.color || "#7C3AED";
  // Use raw SQL to avoid Drizzle generating DEFAULT keyword for id (incompatible with MariaDB 10.4)
  await db.execute(
    sql`INSERT INTO article_trivia (articleId, pregunta, respuesta, opcionCorrecta, opcionIncorrecta, opciones, opcionCorrectaIndex, icono, color, createdAt, updatedAt)
        VALUES (${data.articleId}, ${data.pregunta}, ${data.respuesta}, ${data.opcionCorrecta}, ${data.opcionIncorrecta}, ${data.opciones ?? null}, ${data.opcionCorrectaIndex ?? 0}, ${icono}, ${color}, ${now}, ${now})`
  );
  const rows = await db.select().from(articleTrivia)
    .where(eq(articleTrivia.articleId, data.articleId))
    .orderBy(desc(articleTrivia.createdAt))
    .limit(1);
  return rows[0];
}

export async function updateTrivia(id: number, data: TriviaUpdateData) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(articleTrivia).set({ ...data, updatedAt: toMysqlDatetime(new Date()) as unknown as Date }).where(eq(articleTrivia.id, id));
  const rows = await db.select().from(articleTrivia).where(eq(articleTrivia.id, id)).limit(1);
  return rows[0];
}

export async function deleteTrivia(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(articleTrivia).where(eq(articleTrivia.id, id));
}

export async function deleteTriviaByArticle(articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(articleTrivia).where(eq(articleTrivia.articleId, articleId));
}

// ─── Admin: Recent Users ─────────────────────────────────────────────────────

export async function getRecentUsers(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  await ensureSecureAdminRolesSchema();
  const rows = await db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      role: users.role,
      accessStatus: users.accessStatus,
      loginMethod: users.loginMethod,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);
  return rows;
}
