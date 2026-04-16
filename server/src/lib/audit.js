import { prisma } from '../db.js';

export async function recordAudit(req, { company_id, action, entity_type, entity_id, metadata }) {
  try {
    await prisma.auditLog.create({
      data: {
        company_id,
        actor_user_id: req?.user?.id || null,
        actor_email: req?.user?.email || null,
        action,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
        metadata: metadata || null,
      },
    });
  } catch (err) {
    console.error('[audit] failed:', err.message);
  }
}
