import { jwtVerify } from "jose";
import type { Request } from "express";
import * as db from "../db";
import { COOKIE_NAME } from "@shared/const";
import type { User } from "../../drizzle/schema";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

function getJwtSecret() {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function authenticateRequest(req: Request): Promise<User> {
  const cookieHeader = req.headers.cookie ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(c => {
      const [k, ...v] = c.trim().split("=");
      return [k?.trim(), v.join("=")];
    })
  );
  const sessionCookie = cookies[COOKIE_NAME];

  if (!sessionCookie) {
    throw new Error("Missing session cookie");
  }

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }

  let openId: string;
  try {
    const secretKey = getJwtSecret();
    const { payload } = await jwtVerify(sessionCookie, secretKey, {
      algorithms: ["HS256"],
    });
    openId = payload.openId as string;
    if (!openId) throw new Error("Missing openId in token");
  } catch (error) {
    throw new Error(`Invalid session: ${String(error)}`);
  }

  const user = await db.getUserByOpenId(openId);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
