import "server-only";
import { db } from "./db";

export async function audit(actorEmail: string, action: string, entity: string, entityId: string, before?: unknown, after?: unknown) {
  await db.auditLog.create({
    data: {
      actorEmail,
      action,
      entity,
      entityId,
      before: before === undefined ? undefined : JSON.parse(JSON.stringify(before)),
      after: after === undefined ? undefined : JSON.parse(JSON.stringify(after)),
    },
  });
}
