import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

// Database sessions: the browser holds a random token in an httpOnly cookie,
// the database stores only its SHA-256 hash, so a leaked database row cannot be replayed.
export const SESSION_COOKIE = "e360_session";
const IDLE_MINUTES = 30; // signed out after 30 minutes without activity
const ABSOLUTE_HOURS = 12; // and always after 12 hours

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt: new Date(Date.now() + IDLE_MINUTES * 60_000) } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ABSOLUTE_HOURS * 3600,
  });
}

/** Returns the signed-in user id, or null. Slides the idle timeout forward. */
export async function readSession(): Promise<{ userId: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const id = hashToken(token);
  const s = await db.session.findUnique({ where: { id } });
  const now = Date.now();
  if (!s || s.expiresAt.getTime() < now || now - s.createdAt.getTime() > ABSOLUTE_HOURS * 3600_000) {
    if (s) await db.session.delete({ where: { id } }).catch(() => {});
    return null;
  }
  // Refresh the idle window at most once a minute
  if (s.expiresAt.getTime() - now < (IDLE_MINUTES - 1) * 60_000) {
    await db.session.update({ where: { id }, data: { expiresAt: new Date(now + IDLE_MINUTES * 60_000) } });
  }
  return { userId: s.userId };
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}
