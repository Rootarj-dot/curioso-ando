import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { SignJWT } from "jose";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const JWT_SECRET = process.env.JWT_SECRET ?? "";
const OWNER_OPEN_ID = process.env.OWNER_OPEN_ID ?? "";

function getJwtSecret() {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function createSessionToken(openId: string, name: string): Promise<string> {
  const secretKey = getJwtSecret();
  return new SignJWT({ openId, name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
    .sign(secretKey);
}

export function setupGoogleAuth(app: Express) {
  // Log de diagnóstico al iniciar
  console.log("[GoogleAuth] Iniciando configuración...");
  console.log("[GoogleAuth] GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : "❌ NO CONFIGURADO");
  console.log("[GoogleAuth] GOOGLE_CLIENT_SECRET:", GOOGLE_CLIENT_SECRET ? "✅ configurado" : "❌ NO CONFIGURADO");
  console.log("[GoogleAuth] JWT_SECRET:", JWT_SECRET ? "✅ configurado" : "❌ NO CONFIGURADO");
  console.log("[GoogleAuth] DATABASE_URL:", process.env.DATABASE_URL ? "✅ configurado" : "❌ NO CONFIGURADO");

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("[GoogleAuth] ❌ GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no configurados. El login con Google no funcionará.");
    app.get("/api/auth/google", (_req: Request, res: Response) => {
      res.redirect("/?error=google_not_configured");
    });
    return;
  }

  if (!JWT_SECRET) {
    console.warn("[GoogleAuth] ❌ JWT_SECRET no configurado. El login con Google no funcionará.");
    app.get("/api/auth/google", (_req: Request, res: Response) => {
      res.redirect("/?error=jwt_not_configured");
    });
    return;
  }

  app.use(passport.initialize());

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        passReqToCallback: false,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          console.log("[GoogleAuth] Perfil recibido de Google:", {
            id: profile.id,
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value,
          });

          const openId = `google_${profile.id}`;
          const email = profile.emails?.[0]?.value ?? null;
          const name = profile.displayName ?? null;

          // Verificar si el usuario ya existe en la DB
          let existingUser = null;
          let existingUsers = 0;
          try {
            existingUser = await db.getUserByOpenId(openId);
            existingUsers = await db.countUsers();
            console.log("[GoogleAuth] Usuarios existentes en DB:", existingUsers, "| Usuario ya existe:", !!existingUser, "| Rol actual:", existingUser?.role);
          } catch (dbErr) {
            console.error("[GoogleAuth] ❌ Error al consultar DB (¿DB no configurada?):", dbErr);
            return done(new Error(`Error de base de datos: ${String(dbErr)}`));
          }

          // Si el usuario ya existe, NO cambiar su rol (preservar el rol asignado manualmente)
          // Si es nuevo, asignar admin si es el primero o si coincide con OWNER_OPEN_ID
          let roleToAssign: "admin" | "user" | undefined;
          if (existingUser) {
            // Usuario ya existe: no tocar el rol
            roleToAssign = undefined;
            console.log("[GoogleAuth] Usuario existente, preservando rol:", existingUser.role);
          } else {
            // Usuario nuevo: es admin si es el primero o si coincide con OWNER_OPEN_ID
            const isOwner = openId === OWNER_OPEN_ID || existingUsers === 0;
            roleToAssign = isOwner ? "admin" : "user";
            console.log("[GoogleAuth] Usuario nuevo, asignando rol:", roleToAssign);
          }

          try {
            await db.upsertUser({
              openId,
              name,
              email,
              loginMethod: "google",
              lastSignedIn: new Date(),
              ...(roleToAssign !== undefined ? { role: roleToAssign } : {}),
            });
            console.log("[GoogleAuth] ✅ Usuario guardado en DB");
          } catch (upsertErr) {
            console.error("[GoogleAuth] ❌ Error al guardar usuario en DB:", upsertErr);
            return done(new Error(`Error al guardar usuario: ${String(upsertErr)}`));
          }

          const user = await db.getUserByOpenId(openId);
          if (!user) {
            console.error("[GoogleAuth] ❌ Usuario no encontrado después de upsert");
            return done(new Error("Usuario no encontrado después de guardar"));
          }

          console.log("[GoogleAuth] ✅ Usuario autenticado:", user.email);
          return done(null, user);
        } catch (error) {
          console.error("[GoogleAuth] ❌ Error inesperado en estrategia:", error);
          return done(error as Error);
        }
      }
    )
  );

  // Ruta de inicio de login con Google
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
    })
  );

  // Callback de Google OAuth
  app.get(
    "/api/auth/google/callback",
    (req: Request, res: Response, next) => {
      console.log("[GoogleAuth] Callback recibido. Query params:", req.query);
      if (req.query.error) {
        console.error("[GoogleAuth] ❌ Google devolvió error:", req.query.error);
        res.redirect(`/?error=google_denied&detail=${req.query.error}`);
        return;
      }
      next();
    },
    passport.authenticate("google", {
      session: false,
      failureRedirect: "/?error=auth_failed",
    }),
    async (req: Request, res: Response) => {
      try {
        console.log("[GoogleAuth] ✅ Passport autenticó al usuario. req.user:", req.user ? "presente" : "ausente");
        const user = req.user as { openId: string; name: string | null } | undefined;
        if (!user) {
          console.error("[GoogleAuth] ❌ req.user está vacío después de passport.authenticate");
          res.redirect("/?error=auth_failed&detail=no_user");
          return;
        }

        const token = await createSessionToken(user.openId, user.name ?? "");
        console.log("[GoogleAuth] ✅ Token JWT creado para:", user.openId);

        const cookieOptions = getSessionCookieOptions(req);
        console.log("[GoogleAuth] Opciones de cookie:", cookieOptions);
        console.log("[GoogleAuth] req.hostname:", req.hostname, "| req.protocol:", req.protocol);

        res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        console.log("[GoogleAuth] ✅ Cookie establecida. Enviando página de redirección.");
        // Usar una página HTML intermedia en lugar de redirect 302
        // Esto garantiza que el navegador guarda la cookie antes de navegar
        res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Iniciando sesión...</title>
  <script>
    // Redirigir después de que el navegador procese la cookie
    window.location.replace('/');
  </script>
</head>
<body>
  <p>Iniciando sesión, por favor espera...</p>
</body>
</html>`);
      } catch (error) {
        console.error("[GoogleAuth] ❌ Error en callback final:", error);
        res.redirect(`/?error=auth_failed&detail=callback_error`);
      }
    }
  );
}
