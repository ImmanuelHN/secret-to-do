/**
 * Recurring Task Service
 * 
 * BUG FIXES:
 * 1. Deduplication — don't spawn a new task if one already exists
 *    with same title+recur for the next date (prevents multi-click spam)
 * 2. Overdue fix — always advance from TODAY, not from old due_date,
 *    so an overdue daily task jumps to tomorrow not yesterday+1
 */
import { db } from '../db/database';

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split('T')[0];
}

function nextDate(baseDate, recur) {
  const today = new Date().toISOString().split('T')[0];

  // If task is overdue (due_date is in the past), advance from TODAY not from old date
  // This prevents stacking up multiple overdue copies
  const effectiveBase = baseDate && baseDate < today ? today : (baseDate || today);

  if (recur === 'daily')   return addDays(effectiveBase, 1);
  if (recur === 'weekly')  return addDays(effectiveBase, 7);
  if (recur === 'monthly') return addMonths(effectiveBase, 1);
  return addDays(effectiveBase, 1);
}

export async function handleRecurOnComplete(task) {
  if (!task.recur) return;

  const next = nextDate(task.due_date, task.recur);

  // DEDUPLICATION: check if a pending task with same title+recur already exists for that date
  const existing = await db.tasks
    .where('completed').equals(0)
    .and(t =>
      t.title === task.title &&
      t.recur  === task.recur &&
      t.id     !== task.id
    )
    .first();

  if (existing) {
    // Already exists — just make sure it has the correct next date
    if (existing.due_date !== next) {
      await db.tasks.update(existing.id, { due_date: next });
    }
    return; // Don't create another duplicate
  }

  // Safe to spawn the next occurrence
  await db.tasks.add({
    title:         task.title,
    description:   task.description || '',
    folder_id:     task.folder_id ?? null,
    priority:      task.priority,
    energy_level:  task.energy_level,
    due_date:      next,
    reminder_time: task.reminder_time || '',
    completed:     0,
    recur:         task.recur,
    created_at:    new Date().toISOString(),
  });
}
