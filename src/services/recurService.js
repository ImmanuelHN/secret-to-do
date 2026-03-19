/**
 * Recurring Task Service
 * When a recurring task is completed, auto-spawns the next occurrence.
 * recur values: 'daily' | 'weekly' | 'monthly' | null
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
  if (!baseDate) {
    // No due date — use today as base
    const today = new Date().toISOString().split('T')[0];
    return recur === 'daily' ? addDays(today, 1)
         : recur === 'weekly' ? addDays(today, 7)
         : addMonths(today, 1);
  }
  return recur === 'daily'   ? addDays(baseDate, 1)
       : recur === 'weekly'  ? addDays(baseDate, 7)
       : addMonths(baseDate, 1);
}

export async function handleRecurOnComplete(task) {
  if (!task.recur) return;
  const next = nextDate(task.due_date, task.recur);
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
