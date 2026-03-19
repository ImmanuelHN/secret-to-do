import Dexie from 'dexie';

export const db = new Dexie('SecretTodoDB');

db.version(1).stores({
  folders: '++id, name, color, icon, created_at',
  tasks: '++id, title, description, folder_id, priority, due_date, reminder_time, completed, energy_level, created_at',
  habits: '++id, name, time, streak_count, last_completed_date',
  settings: 'key, value',
});

db.version(2).stores({
  folders: '++id, name, color, icon, created_at',
  tasks: '++id, title, description, folder_id, priority, due_date, reminder_time, completed, energy_level, recur, created_at',
  habits: '++id, name, time, streak_count, last_completed_date',
  settings: 'key, value',
}).upgrade(tx => tx.table('tasks').toCollection().modify(t => { if (t.recur === undefined) t.recur = null; }));

// Version 3: add attachments table
db.version(3).stores({
  folders: '++id, name, color, icon, created_at',
  tasks: '++id, title, description, folder_id, priority, due_date, reminder_time, completed, energy_level, recur, created_at',
  habits: '++id, name, time, streak_count, last_completed_date',
  settings: 'key, value',
  attachments: '++id, task_id, name, type, created_at', // data stored as blob
});

db.on('populate', async () => {
  await db.settings.bulkPut([
    { key: 'theme',                   value: 'dark' },
    { key: 'water_reminder_interval', value: 60 },
    { key: 'meal_times',              value: JSON.stringify({ breakfast: '08:00', lunch: '13:00', dinner: '20:00' }) },
    { key: 'pin_enabled',             value: false },
    { key: 'pin',                     value: null },
    { key: 'water_enabled',           value: false },
    { key: 'meal_enabled',            value: false },
    { key: 'snooze_minutes',          value: 10 },
    { key: 'pin_timeout',             value: 0 }, // 0 = never
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
