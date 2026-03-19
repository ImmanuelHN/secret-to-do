/**
 * Reminder Service
 * Manages water reminders, meal reminders, and task reminders.
 * All scheduled via setTimeout/setInterval using browser Notification API.
 */
import { NotifService } from './notificationService';
import { getSetting } from '../db/database';

// Store active timer IDs so we can clear them on re-schedule
const timers = {
  water: null,
  meals: [],
  tasks: {},
};

/** ── WATER REMINDER ─────────────────────────────────────────── */
export async function startWaterReminder() {
  stopWaterReminder();
  if (NotifService.permission !== 'granted') return;

  const interval = (await getSetting('water_reminder_interval')) || 60;
  const ms = interval * 60 * 1000;

  timers.water = NotifService.scheduleInterval(
    ms,
    '💧 Drink water!',
    `Time to hydrate — it's been ${interval} minutes`,
    'water-reminder'
  );
}

export function stopWaterReminder() {
  if (timers.water) { clearInterval(timers.water); timers.water = null; }
}

/** ── MEAL REMINDERS ─────────────────────────────────────────── */
export async function scheduleMealReminders() {
  // Clear old ones
  timers.meals.forEach(id => clearTimeout(id));
  timers.meals = [];
  if (NotifService.permission !== 'granted') return;

  const raw = await getSetting('meal_times');
  const meals = raw ? JSON.parse(raw) : { breakfast: '08:00', lunch: '13:00', dinner: '20:00' };

  const mealEmoji = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' };
  const mealLabel = { breakfast: 'Breakfast time!', lunch: 'Lunch time!', dinner: 'Dinner time!' };

  Object.entries(meals).forEach(([meal, time]) => {
    const id = NotifService.scheduleAtTime(
      time,
      `${mealEmoji[meal]} ${mealLabel[meal]}`,
      `Time for ${meal}`,
      `meal-${meal}`
    );
    if (id) timers.meals.push(id);
  });
}

/** ── TASK REMINDERS ─────────────────────────────────────────── */
export function scheduleTaskReminder(task) {
  if (!task.reminder_time || NotifService.permission !== 'granted') return;
  cancelTaskReminder(task.id);

  const id = NotifService.scheduleAtTime(
    task.reminder_time,
    `⏰ ${task.title}`,
    task.description || 'Task reminder',
    `task-${task.id}`
  );
  if (id) timers.tasks[task.id] = id;
}

export function cancelTaskReminder(taskId) {
  if (timers.tasks[taskId]) {
    clearTimeout(timers.tasks[taskId]);
    delete timers.tasks[taskId];
  }
}

/** ── INIT ALL (call on app start) ───────────────────────────── */
export async function initReminders(tasks = []) {
  if (NotifService.permission !== 'granted') return;
  await startWaterReminder();
  await scheduleMealReminders();

  const today = new Date().toISOString().split('T')[0];
  tasks.forEach(t => {
    if (t.reminder_time && t.due_date === today && !t.completed) {
      scheduleTaskReminder(t);
    }
  });
}
