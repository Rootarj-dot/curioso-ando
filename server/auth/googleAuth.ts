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
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("[GoogleAuth] GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no configurados.");
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
          const openId = `google_${profile.id}`;
          const email = profile.emails?.[0]?.value ?? null;
          const name = profile.displayName ?? null;

          // El primer usuario registrado (o el que coincide con OWNER_OPEN_ID) es admin
          const existingUsers = await db.countUsers();
          const isOwner = openId === OWNER_OPEN_ID || existingUsers === 0;

          await db.upsertUser({
            openId,
            name,
            email,
            loginMethod: "google",
            lastSignedIn: new Date(),
            role: isOwner ? "admin" : "user",
          });

          const user = await db.getUserByOpenId(openId);
          return done(null, user ?? false);
        } catch (error) {
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
    passport.authenticate("google", { session: false, failureRedirect: "/?error=auth_failed" }),
    async (req: Request, res: Response) => {
      try {
        const user = req.user as { openId: string; name: string | null } | undefined;
        if (!user) {
          res.redirect("/?error=auth_failed");
          return;
        }
        const token = await createSessionToken(user.openId, user.name ?? "");
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect("/");
      } catch (error) {
        console.error("[GoogleAuth] Callback error:", error);
        res.redirect("/?error=auth_failed");
      }
    }
  );
}
