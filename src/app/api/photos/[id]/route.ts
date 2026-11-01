import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/** Profile photo. Any signed-in colleague can see it; nobody outside can. */
export async function GET(_req: Request, ctx: RouteContext<"/api/photos/[id]">) {
  const { id } = await ctx.params;
  if (!(await getCurrentUser())) return new Response("Please sign in.", { status: 401 });
  const e = await db.employee.findUnique({ where: { id }, select: { photoUrl: true } });
  const m = e?.photoUrl?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) return new Response("Not found.", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(m[2], "base64")), { headers: { "Content-Type": m[1], "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
}
