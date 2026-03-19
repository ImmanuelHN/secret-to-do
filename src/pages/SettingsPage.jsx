import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { getSetting, setSetting, db } from '../db/database';
import { NotifService } from '../services/notificationService';
import {
  startWaterReminder, stopWaterReminder, scheduleMealReminders
} from '../services/reminderService';
import {
  Moon, Sun, Sparkles, Droplets, UtensilsCrossed,
  Trash2, Shield, Bell, BellOff, BellRing,
  Download, Upload, Check, Lock, LockOpen
} from 'lucide-react';
import PinSetupModal from '../components/PinSetupModal';

const THEMES = [
  { id: 'dark',      label: 'Dark',      icon: Moon,     desc: 'Warm charcoal with caramel gold' },
  { id: 'light',     label: 'Light',     icon: Sun,      desc: 'Warm cream with espresso tones' },
  { id: 'aesthetic', label: 'Aesthetic', icon: Sparkles, desc: 'Dreamy pastel gradient landscape' },
];

function Toggle({ value, onChange, color = 'var(--green)' }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 42, height: 24, borderRadius: 99,
      background: value ? color : 'var(--border-default)',
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background 200ms', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 3,
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        left: value ? 21 : 3,
        transition: 'left 200ms',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

function SectionCard({ title, icon: Icon, iconColor = 'var(--accent)', children }) {
  return (
    <div className="info-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Icon size={15} style={{ color: iconColor }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, pinSetupModal, setPinSetupModal } = useAppStore();
  const [pinEnabled, setPinEnabledLocal] = useState(() => !!localStorage.getItem('app_pin') && localStorage.getItem('app_pin') !== 'false');

  const [notifPermission, setNotifPermission] = useState(NotifService.permission);
  const [waterEnabled, setWaterEnabled]   = useState(false);
  const [waterInterval, setWaterInterval] = useState(60);
  const [mealEnabled, setMealEnabled]     = useState(false);
  const [snoozeMin, setSnoozeMin]         = useState(10);
  const [pinTimeout, setPinTimeoutLocal]  = useState(0);
  const [meals, setMeals] = useState({ breakfast: '08:00', lunch: '13:00', dinner: '20:00' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const wi  = await getSetting('water_reminder_interval');
      const we  = await getSetting('water_enabled');
      const me  = await getSetting('meal_enabled');
      const mt  = await getSetting('meal_times');
      if (wi)  setWaterInterval(wi);
      const sm = await getSetting('snooze_minutes'); if (sm != null) setSnoozeMin(sm);
      const pt = await getSetting('pin_timeout');    if (pt != null) setPinTimeoutLocal(pt);
      if (we)  setWaterEnabled(we);
      if (me)  setMealEnabled(me);
      if (mt)  setMeals(JSON.parse(mt));
    })();
  }, []);

  const requestNotifPermission = async () => {
    const result = await NotifService.requestPermission();
    setNotifPermission(result);
    if (result === 'granted') {
      NotifService.fire('🎉 Notifications enabled!', 'Secret To-Do can now remind you.', '/favicon.svg', 'test');
    }
  };

  const handleWaterToggle = async (val) => {
    setWaterEnabled(val);
    await setSetting('water_enabled', val);
    if (val && notifPermission === 'granted') await startWaterReminder();
    else stopWaterReminder();
  };

  const handleMealToggle = async (val) => {
    setMealEnabled(val);
    await setSetting('meal_enabled', val);
    if (val && notifPermission === 'granted') await scheduleMealReminders();
  };

  const save = async () => {
    await setSetting('water_reminder_interval', waterInterval);
    await setSetting('snooze_minutes', snoozeMin);
    await setSetting('pin_timeout', pinTimeout);
    await setSetting('meal_times', JSON.stringify(meals));
    if (waterEnabled && notifPermission === 'granted') await startWaterReminder();
    if (mealEnabled  && notifPermission === 'granted') await scheduleMealReminders();
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  // Export data as JSON
  const exportData = async () => {
    const [folders, tasks, habits] = await Promise.all([
      db.folders.toArray(),
      db.tasks.toArray(),
      db.habits.toArray(),
    ]);
    const blob = new Blob([JSON.stringify({ folders, tasks, habits, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `secret-todo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Import data from JSON
  const importData = async () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (!data.tasks || !data.folders) { alert('Invalid backup file.'); return; }
        if (!confirm(`Import ${data.tasks.length} tasks and ${data.folders.length} folders? This will add to existing data.`)) return;
        // Strip IDs so Dexie auto-assigns new ones
        const foldersToAdd = data.folders.map(({ id, ...f }) => f);
        const newFolderIds = await db.folders.bulkAdd(foldersToAdd, { allKeys: true });
        // Remap folder_id for tasks
        const folderMap = {};
        data.folders.forEach((f, i) => { folderMap[f.id] = newFolderIds[i]; });
        const tasksToAdd = data.tasks.map(({ id, folder_id, ...t }) => ({
          ...t,
          folder_id: folder_id != null ? (folderMap[folder_id] ?? null) : null,
        }));
        await db.tasks.bulkAdd(tasksToAdd);
        if (data.habits?.length) {
          await db.habits.bulkAdd(data.habits.map(({ id, ...h }) => h));
        }
        alert('Import complete!');
      } catch { alert('Failed to parse backup file.'); }
    };
    input.click();
  };

  const clearData = async () => {
    if (confirm('⚠️ Delete ALL tasks, folders, and habits? This cannot be undone.')) {
      await db.tasks.clear(); await db.folders.clear(); await db.habits.clear();
      window.location.reload();
    }
  };

  const notifIcon = notifPermission === 'granted' ? BellRing : notifPermission === 'denied' ? BellOff : Bell;
  const notifColor = notifPermission === 'granted' ? 'var(--green)' : notifPermission === 'denied' ? 'var(--red)' : 'var(--yellow)';
  const notifLabel = notifPermission === 'granted' ? 'Notifications enabled' : notifPermission === 'denied' ? 'Notifications blocked — enable in browser settings' : 'Notifications not enabled yet';

  return (
    <div className="page">

      {/* ── Appearance ─────────────────────────── */}
      <SectionCard title="Appearance" icon={Sun} iconColor="var(--yellow)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {THEMES.map(({ id, label, icon: Icon, desc }) => (
            <button key={id} onClick={() => setTheme(id)} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '12px 14px', borderRadius: 'var(--radius-sm)',
              background: theme === id ? 'var(--accent-dim)' : 'transparent',
              border: `1px solid ${theme === id ? 'var(--border-focus)' : 'transparent'}`,
              cursor: 'pointer', textAlign: 'left', transition: 'all 150ms', width: '100%',
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: theme === id ? 'var(--accent)' : 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} style={{ color: theme === id ? 'white' : 'var(--text-tertiary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: theme === id ? 'var(--accent)' : 'var(--text-primary)' }}>{label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{desc}</div>
              </div>
              {theme === id && <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* ── Notifications ──────────────────────── */}
      <SectionCard title="Notifications" icon={notifIcon} iconColor={notifColor}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px', padding: '12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-overlay)', border: `1px solid ${notifColor}30` }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: notifColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {notifPermission === 'granted'
              ? <BellRing size={16} style={{ color: notifColor }} />
              : <Bell size={16} style={{ color: notifColor }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Browser Notifications</div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px', lineHeight: '1.5' }}>{notifLabel}</div>
          </div>
          {notifPermission !== 'granted' && notifPermission !== 'denied' && (
            <button className="btn btn-primary" style={{ padding: '7px 12px', fontSize: '12px', flexShrink: 0 }} onClick={requestNotifPermission}>
              Enable
            </button>
          )}
          {notifPermission === 'granted' && (
            <button
              onClick={() => NotifService.fire('🔔 Test notification', 'Notifications are working!', '/favicon.svg', 'test')}
              className="btn btn-secondary" style={{ padding: '7px 12px', fontSize: '12px', flexShrink: 0 }}
            >
              Test
            </button>
          )}
        </div>

        {/* Water reminder */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Droplets size={15} style={{ color: 'var(--blue)' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Water Reminder</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Every {waterInterval} minutes</div>
            </div>
          </div>
          <Toggle value={waterEnabled} onChange={handleWaterToggle} color="var(--blue)" />
        </div>

        {/* Water interval */}
        {waterEnabled && (
          <div style={{ padding: '10px 0 4px', paddingLeft: '25px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Remind every</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[30, 60, 90, 120].map(v => (
                <button key={v} onClick={() => setWaterInterval(v)} style={{
                  flex: 1, padding: '7px', borderRadius: 'var(--radius-sm)',
                  background: waterInterval === v ? 'var(--blue-dim)' : 'var(--bg-overlay)',
                  color: waterInterval === v ? 'var(--blue)' : 'var(--text-tertiary)',
                  border: `1px solid ${waterInterval === v ? 'var(--blue-dim)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: 'all 140ms',
                }}>{v}m</button>
              ))}
            </div>
          </div>
        )}

        {/* Meal reminders */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UtensilsCrossed size={15} style={{ color: 'var(--yellow)' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>Meal Reminders</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Breakfast · Lunch · Dinner</div>
            </div>
          </div>
          <Toggle value={mealEnabled} onChange={handleMealToggle} color="var(--yellow)" />
        </div>

        {mealEnabled && (
          <div style={{ paddingLeft: '25px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            {[{ k: 'breakfast', label: '🌅 Breakfast' }, { k: 'lunch', label: '☀️ Lunch' }, { k: 'dinner', label: '🌙 Dinner' }].map(({ k, label }) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 400 }}>{label}</span>
                <input type="time" className="input" style={{ width: '110px', textAlign: 'center', padding: '6px 10px' }}
                  value={meals[k]} onChange={e => setMeals(m => ({ ...m, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Data Management ────────────────────── */}
      <SectionCard title="Data" icon={Download} iconColor="var(--green)">
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={exportData} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            padding: '10px', borderRadius: 'var(--radius-sm)',
            background: 'var(--green-dim)', color: 'var(--green)',
            border: '1px solid var(--green-dim)', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, transition: 'all 140ms',
          }}>
            <Download size={14} /> Export JSON
          </button>
          <button onClick={importData} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            padding: '10px', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-dim)', color: 'var(--accent)',
            border: '1px solid var(--accent-dim)', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, transition: 'all 140ms',
          }}>
            <Upload size={14} /> Import JSON
          </button>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px', textAlign: 'center' }}>
          Export creates a full backup. Import adds to existing data.
        </div>
      </SectionCard>

      {/* ── Save ───────────────────────────────── */}
      <button className="btn btn-primary" style={{ width: '100%', padding: '13px', justifyContent: 'center', fontSize: '14px' }} onClick={save}>
        {saved ? <><Check size={15} /> Saved!</> : 'Save Settings'}
      </button>

      {/* ── About ──────────────────────────────── */}
      <SectionCard title="About" icon={Shield} iconColor="var(--text-tertiary)">
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Version</span><span style={{ color: 'var(--text-secondary)' }}>Phase 3</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Storage</span><span style={{ color: 'var(--text-secondary)' }}>Local device only</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Internet required</span><span style={{ color: 'var(--green)' }}>Never</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Account required</span><span style={{ color: 'var(--green)' }}>Never</span>
          </div>
        </div>
      </SectionCard>


      {/* ── Snooze Duration ────────────────────── */}
      <SectionCard title="Snooze Duration" icon={Bell} iconColor="var(--accent)">
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
          Snooze reminders for
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[5, 10, 15, 30].map(v => (
            <button key={v} onClick={() => setSnoozeMin(v)} style={{
              flex: 1, padding: '9px', borderRadius: 'var(--radius-sm)',
              background: snoozeMin === v ? 'var(--accent-dim)' : 'var(--bg-overlay)',
              color: snoozeMin === v ? 'var(--accent)' : 'var(--text-tertiary)',
              border: `1px solid ${snoozeMin === v ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
              cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: 'all 140ms',
            }}>{v}m</button>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
          Applied to water, meal, habit, and task reminders
        </div>
      </SectionCard>

      {/* ── Auto-Lock Timeout ──────────────────── */}
      <SectionCard title="Auto-Lock Timeout" icon={Lock} iconColor="var(--text-tertiary)">
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
          Lock app after inactivity (requires PIN to be set)
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[{v:0,l:'Never'},{v:1,l:'1 min'},{v:5,l:'5 min'},{v:15,l:'15 min'},{v:30,l:'30 min'}].map(({v,l}) => (
            <button key={v} onClick={() => setPinTimeoutLocal(v)} style={{
              padding: '7px 12px', borderRadius: 'var(--radius-sm)',
              background: pinTimeout === v ? 'var(--accent-dim)' : 'var(--bg-overlay)',
              color: pinTimeout === v ? 'var(--accent)' : 'var(--text-tertiary)',
              border: `1px solid ${pinTimeout === v ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
              cursor: 'pointer', fontSize: '12px', fontWeight: 600, transition: 'all 140ms',
            }}>{l}</button>
          ))}
        </div>
      </SectionCard>

      {/* ── PIN Lock ───────────────────────────── */}
      <SectionCard title="PIN Lock" icon={pinEnabled ? Lock : LockOpen} iconColor={pinEnabled ? "var(--green)" : "var(--text-tertiary)"}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              {pinEnabled ? 'PIN protection enabled' : 'PIN protection disabled'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {pinEnabled ? 'App opens with a PIN screen' : 'Anyone can open the app'}
            </div>
          </div>
          <Toggle
            value={pinEnabled}
            onChange={(val) => {
              if (val) setPinSetupModal('set');
              else setPinSetupModal('disable');
            }}
            color="var(--green)"
          />
        </div>
        {pinEnabled && (
          <button onClick={() => setPinSetupModal('change')} className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '8px 14px', gap: '6px' }}>
            <Lock size={13} /> Change PIN
          </button>
        )}
      </SectionCard>

      {pinSetupModal && (
        <PinSetupModal
          mode={pinSetupModal}
          onClose={() => setPinSetupModal(null)}
          onDone={() => {
            const enabled = !!localStorage.getItem('app_pin');
            setPinEnabledLocal(enabled);
            setSetting('pin_enabled', enabled);
          }}
        />
      )}
      {/* ── Danger Zone ────────────────────────── */}
      <div className="info-card" style={{ borderColor: 'var(--red-dim)' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--red)', marginBottom: '12px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
          Danger Zone
        </div>
        <button onClick={clearData} style={{
          width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)',
          background: 'var(--red-dim)', color: 'var(--red)',
          border: '1px solid var(--red-dim)', cursor: 'pointer',
          fontSize: '13px', fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
          transition: 'all 150ms',
        }}>
          <Trash2 size={14} /> Clear All Data
        </button>
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '8px' }}>
          Permanently deletes all tasks, folders, and habits
        </div>
      </div>
    </div>
  );
}

// Re-export with PIN section added at bottom of existing export — done inline below
