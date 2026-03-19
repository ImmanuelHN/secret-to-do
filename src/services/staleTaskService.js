/**
 * Stale Task Service
 * Finds tasks that haven't been touched in 14+ days and are still pending.
 */
import { db } from '../db/database';

export async function getStaleTaskIds(days = 14) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();

  const pending = await db.tasks.where('completed').equals(0).toArray();
  return pending
    .filter(t => t.created_at && t.created_at < cutoffStr)
    .map(t => t.id);
}

export async function moveStaleToVault(ids) {
  // Mark as completed so they show up in Vault (completed tasks 7+ days old)
  await Promise.all(ids.map(id => db.tasks.update(id, { completed: 1 })));
}

export async function deleteStale(ids) {
  await Promise.all(ids.map(id => db.tasks.delete(id)));
}
