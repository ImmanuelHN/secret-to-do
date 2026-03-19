/**
 * Reminder Service — water, meals, tasks
 * Uses Service Worker showNotification for action buttons (Snooze / Done / +)
 */
import { getSetting } from '../db/database';
import { showActionNotification, showNotification } from './swService';

const timers = { water: null, meals: [], tasks: {} };

/** ── WATER ────────────────────────────────────────── */
export async function startWaterReminder() {
  stopWaterReminder();
  const perm = Notification?.permission;
  if (perm !== 'granted') return;

  const interval  = (await getSetting('water_reminder_interval')) || 60;
  const snoozeMin = (await getSetting('snooze_minutes')) || 10;
  const ms        = interval * 60 * 1000;

  timers.water = setInterval(async () => {
    await showActionNotification({
      title:    '💧 Drink water!',
      body:     `Time to hydrate — ${interval}min since last reminder`,
      tag:      'water-reminder',
      data:     { type: 'water' },
      snoozeMin,
    });
  }, ms);
}

export function stopWaterReminder() {
  if (timers.water) { clearInterval(timers.water); timers.water = null; }
}

/** ── MEALS ────────────────────────────────────────── */
export async function scheduleMealReminders() {
  timers.meals.forEach(id => clearTimeout(id));
  timers.meals = [];
  if (Notification?.permission !== 'granted') return;

  const raw       = await getSetting('meal_times');
  const meals     = raw ? JSON.parse(raw) : { breakfast:'08:00', lunch:'13:00', dinner:'20:00' };
  const snoozeMin = (await getSetting('snooze_minutes')) || 10;
  const emoji     = { breakfast:'🌅', lunch:'☀️', dinner:'🌙' };
  const label     = { breakfast:'Breakfast', lunch:'Lunch', dinner:'Dinner' };

  Object.entries(meals).forEach(([meal, time]) => {
    const [h, m] = time.split(':').map(Number);
    const now    = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) return;

    const delay = target - now;
    const id = setTimeout(async () => {
      await showActionNotification({
        title:    `${emoji[meal]} ${label[meal]} time!`,
        body:     `Time for ${meal}`,
        tag:      `meal-${meal}`,
        data:     { type: 'meal', meal },
        snoozeMin,
      });
    }, delay);
    timers.meals.push(id);
  });
}

/** ── TASKS ────────────────────────────────────────── */
export async function scheduleTaskReminder(task) {
  if (!task.reminder_time || Notification?.permission !== 'granted') return;
  cancelTaskReminder(task.id);

  const [h, m] = task.reminder_time.split(':').map(Number);
  const now    = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) return;

  const snoozeMin = (await getSetting('snooze_minutes')) || 10;
  const delay     = target - now;

  timers.tasks[task.id] = setTimeout(async () => {
    await showActionNotification({
      title:    `⏰ ${task.title}`,
      body:     task.description || 'Task reminder',
      tag:      `task-${task.id}`,
      data:     { type: 'task', taskId: task.id },
      snoozeMin,
    });
  }, delay);
}

export function cancelTaskReminder(taskId) {
  if (timers.tasks[taskId]) { clearTimeout(timers.tasks[taskId]); delete timers.tasks[taskId]; }
}

/** ── HABITS ───────────────────────────────────────── */
export async function scheduleHabitReminder(habit) {
  if (!habit.time || Notification?.permission !== 'granted') return;

  const [h, m] = habit.time.split(':').map(Number);
  const now    = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) return;

  const snoozeMin = (await getSetting('snooze_minutes')) || 10;
  const delay     = target - now;

  setTimeout(async () => {
    await showActionNotification({
      title:    `🔥 Habit: ${habit.name}`,
      body:     `Don't break your ${habit.streak_count || 0}-day streak!`,
      tag:      `habit-${habit.id}`,
      data:     { type: 'habit', habitId: habit.id },
      snoozeMin,
    });
  }, delay);
}

/** ── INIT ALL ─────────────────────────────────────── */
export async function initReminders(tasks = [], habits = []) {
  if (Notification?.permission !== 'granted') return;

  const waterEnabled = await getSetting('water_enabled');
  const mealEnabled  = await getSetting('meal_enabled');

  if (waterEnabled) await startWaterReminder();
  if (mealEnabled)  await scheduleMealReminders();

  const today = new Date().toISOString().split('T')[0];
  tasks.forEach(t => {
    if (t.reminder_time && t.due_date === today && !t.completed) scheduleTaskReminder(t);
  });
  habits.forEach(h => {
    if (h.time) scheduleHabitReminder(h);
  });
}
