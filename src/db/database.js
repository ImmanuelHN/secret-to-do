import Dexie from 'dexie';

export const db = new Dexie('SecretTodoDB');

db.version(1).stores({
  folders: '++id, name, color, icon, created_at',
  tasks: '++id, title, description, folder_id, priority, due_date, reminder_time, completed, energy_level, created_at',
  habits: '++id, name, time, streak_count, last_completed_date',
  settings: 'key, value',
});

// Version 2: add recur field to tasks
db.version(2).stores({
  folders: '++id, name, color, icon, created_at',
  tasks: '++id, title, description, folder_id, priority, due_date, reminder_time, completed, energy_level, recur, created_at',
  habits: '++id, name, time, streak_count, last_completed_date',
  settings: 'key, value',
}).upgrade(tx => {
  return tx.table('tasks').toCollection().modify(task => {
    if (task.recur === undefined) task.recur = null;
  });
});

db.on('populate', async () => {
  await db.settings.bulkPut([
    { key: 'theme',                    value: 'dark' },
    { key: 'water_reminder_interval',  value: 60 },
    { key: 'meal_times',               value: JSON.stringify({ breakfast: '08:00', lunch: '13:00', dinner: '20:00' }) },
    { key: 'pin_enabled',              value: false },
    { key: 'pin',                      value: null },
    { key: 'water_enabled',            value: false },
    { key: 'meal_enabled',             value: false },
  ]);
  await db.folders.add({ name: 'Personal', color: '#c6a27a', icon: '👤', created_at: new Date().toISOString() });
});

export async function getSetting(key) {
  const row = await db.settings.get(key);
  return row ? row.value : null;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}
