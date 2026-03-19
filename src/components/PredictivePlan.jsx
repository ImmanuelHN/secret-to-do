import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';
import { X, Moon, ChevronRight, Sparkles } from 'lucide-react';

export default function PredictivePlan() {
  const { folders, setActiveView, setActiveFolderId } = useAppStore();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; })();
  const hour     = new Date().getHours();

  // Show between 20:00–23:59 and not dismissed this session
  useEffect(() => {
    setVisible(hour >= 20 && !dismissed);
  }, [hour, dismissed]);

  const unfinishedToday = useLiveQuery(async () => {
    const tasks = await db.tasks.where('completed').equals(0).toArray();
    return tasks.filter(t => t.due_date === today).slice(0, 5);
  }, [today]);

  const tomorrowTasks = useLiveQuery(async () => {
    const tasks = await db.tasks.where('completed').equals(0).toArray();
    return tasks.filter(t => t.due_date === tomorrow).slice(0, 5);
  }, [tomorrow]);

  if (!visible) return null;
  if (!unfinishedToday || !tomorrowTasks) return null;
  if (unfinishedToday.length === 0 && tomorrowTasks.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      width: 'min(360px, calc(100vw - 48px))',
      zIndex: 85,
      animation: 'slideFromRight 320ms cubic-bezier(0.16,1,0.3,1) both',
    }}>
      <style>{`
        @keyframes slideFromRight {
          from { opacity:0; transform:translateX(20px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>

      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '16px 18px 14px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Moon size={16} style={{ opacity: 0.8, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', letterSpacing: '-0.3px' }}>
              Evening Planner
            </div>
            <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '1px' }}>
              Night review — let's wrap up the day
            </div>
          </div>
          <button className="btn-icon" style={{ padding: '4px', color: 'inherit', opacity: 0.6 }}
            onClick={() => setDismissed(true)}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Unfinished today */}
          {unfinishedToday.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                Unfinished today · {unfinishedToday.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {unfinishedToday.map(t => {
                  const folder = folders.find(f => f.id === t.folder_id);
                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-overlay)',
                    }}>
                      <span style={{
                        width: 3, height: 20, borderRadius: 3, flexShrink: 0,
                        background: t.priority === 'high' ? 'var(--red)' : t.priority === 'medium' ? 'var(--yellow)' : 'var(--green)',
                      }} />
                      <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </span>
                      {folder && (
                        <span style={{ fontSize: '10px', color: folder.color || 'var(--accent)', flexShrink: 0 }}>
                          {folder.icon}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tomorrow preview */}
          {tomorrowTasks.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={10} /> Tomorrow's agenda · {tomorrowTasks.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {tomorrowTasks.map(t => (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-dim)',
                  }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </span>
                    {t.reminder_time && (
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                        ⏰ {t.reminder_time}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setActiveView('planner'); setDismissed(true); }}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', fontSize: '12px', padding: '8px' }}
            >
              Open Planner <ChevronRight size={13} />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12px' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
