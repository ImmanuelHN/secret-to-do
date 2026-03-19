import { ArrowUpDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { setSetting } from '../db/database';

const SORTS = [
  { id: 'default',   label: 'Default order' },
  { id: 'priority',  label: 'By priority' },
  { id: 'due_date',  label: 'By due date' },
  { id: 'energy',    label: 'By energy level' },
  { id: 'alpha',     label: 'Alphabetical' },
];

export default function SortBar({ taskCount }) {
  const { taskSort, setTaskSort } = useAppStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const choose = async (id) => {
    setTaskSort(id);
    await setSetting('task_sort', id);
    setOpen(false);
  };

  const current = SORTS.find(s => s.id === taskSort);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
      {taskCount > 0 && (
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          {taskCount} task{taskCount !== 1 ? 's' : ''}
        </span>
      )}
      <div ref={ref} style={{ marginLeft: 'auto', position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 10px', borderRadius: 'var(--radius-sm)',
            background: open ? 'var(--accent-dim)' : 'var(--bg-overlay)',
            border: `1px solid ${open ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
            color: open ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '12px', fontWeight: 500,
            transition: 'all 140ms',
          }}
        >
          <ArrowUpDown size={12} />
          {current?.label}
        </button>

        {open && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: 180,
            zIndex: 40,
            overflow: 'hidden',
            animation: 'scaleUp 150ms var(--ease-out) both',
          }}>
            {SORTS.map(s => (
              <button key={s.id} onClick={() => choose(s.id)} style={{
                width: '100%', padding: '9px 14px',
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: taskSort === s.id ? 600 : 400,
                color: taskSort === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                textAlign: 'left', transition: 'background 120ms',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ flex: 1 }}>{s.label}</span>
                {taskSort === s.id && <Check size={13} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
