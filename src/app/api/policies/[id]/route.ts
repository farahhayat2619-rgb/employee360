import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/** Policy PDF for signed-in staff. ?download=1 saves it; otherwise it opens in the browser. */
export async function GET(req: Request, ctx: RouteContext<"/api/policies/[id]">) {
  const { id } = await ctx.params;
  if (!(await getCurrentUser())) return new Response("Please sign in.", { status: 401 });
  const p = await db.policy.findUnique({ where: { id }, select: { fileData: true, fileName: true } });
  if (!p?.fileData) return new Response("Not found.", { status: 404 });
  const download = new URL(req.url).searchParams.has("download");
  const name = (p.fileName ?? "policy.pdf").replace(/"/g, "");
  return new Response(new Uint8Array(p.fileData), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
