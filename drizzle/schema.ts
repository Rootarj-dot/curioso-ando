import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  accessStatus: mysqlEnum("accessStatus", ["active", "blocked"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ──────────────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Articles ────────────────────────────────────────────────────────────────
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content"),
  featuredImage: text("featuredImage"),
  ogTitle: varchar("ogTitle", { length: 255 }),
  ogDescription: text("ogDescription"),
  ogImage: text("ogImage"),
  status: mysqlEnum("status", ["draft", "published"]).notNull().default("draft"),
  featured: boolean("featured").notNull().default(false),
  categoryId: int("categoryId"),
  authorId: int("authorId").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

// ─── Media ───────────────────────────────────────────────────────────────────
export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  url: text("url").notNull(),
  storageKey: text("storageKey").notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  size: int("size"),
  width: int("width"),
  height: int("height"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;

// ─── Site Config ─────────────────────────────────────────────────────────────
export const siteConfig = mysqlTable("site_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SiteConfig = typeof siteConfig.$inferSelect;

// ─── Article Trivia ─────────────────────────────────────────────────────────────────────────────
export const articleTrivia = mysqlTable("article_trivia", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  pregunta: varchar("pregunta", { length: 500 }).notNull(),
  respuesta: text("respuesta").notNull(),
  opcionCorrecta: varchar("opcionCorrecta", { length: 255 }).notNull(),
  opcionIncorrecta: varchar("opcionIncorrecta", { length: 255 }).notNull(),
  icono: varchar("icono", { length: 50 }).default("HelpCircle"),
  color: varchar("color", { length: 30 }).default("#7C3AED"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ArticleTrivia = typeof articleTrivia.$inferSelect;
export type InsertArticleTrivia = typeof articleTrivia.$inferInsert;

// ─── Datos Curiosos ─────────────────────────────────────────────────────────────────────────────
export const datosCuriosos = mysqlTable("datos_curiosos", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  contenido: text("contenido").notNull(),
  icono: varchar("icono", { length: 50 }).default("Lightbulb"),
  color: varchar("color", { length: 30 }).default("#7C3AED"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DatoCurioso = typeof datosCuriosos.$inferSelect;
export type InsertDatoCurioso = typeof datosCuriosos.$inferInsert;
