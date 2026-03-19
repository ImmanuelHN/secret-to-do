import { useState, useRef, useEffect } from 'react';
import { Plus, X, Zap } from 'lucide-react';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';

export default function QuickAdd() {
  const { folders, activeFolderId, quickAddOpen, setQuickAddOpen } = useAppStore();
  const [title, setTitle]   = useState('');
  const [priority, setPri]  = useState('medium');
  const [folderId, setFolId] = useState('');
  const [saved, setSaved]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (quickAddOpen) {
      setFolId(activeFolderId || folders[0]?.id || '');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [quickAddOpen, activeFolderId, folders]);

  // Keyboard shortcut: N to open
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey &&
          !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        setQuickAddOpen(true);
      }
      if (e.key === 'Escape') setQuickAddOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const submit = async () => {
    if (!title.trim()) return;
    await db.tasks.add({
      title: title.trim(),
      description: '',
      folder_id: folderId ? Number(folderId) : null,
      priority,
      energy_level: 'medium',
      due_date: '',
      reminder_time: '',
      completed: 0,
      created_at: new Date().toISOString(),
    });
    setSaved(true);
    setTitle('');
    setTimeout(() => { setSaved(false); inputRef.current?.focus(); }, 900);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') setQuickAddOpen(false);
  };

  if (!quickAddOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', bottom: '24px', left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(560px, calc(100vw - 48px))',
        zIndex: 90,
        animation: 'quickSlideUp 220ms cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      <style>{`
        @keyframes quickSlideUp {
          from { opacity:0; transform:translateX(-50%) translateY(16px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 'var(--radius-sm)',
            background: saved ? 'var(--green)' : 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 200ms',
          }}>
            {saved
              ? <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
              : <Plus size={15} color="white" />
            }
          </div>

          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Quick add task… (Enter to save)"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              font: '500 14px var(--font-body)',
              color: 'var(--text-primary)',
            }}
          />

          <button className="btn-icon" onClick={() => setQuickAddOpen(false)} style={{ padding: '4px' }}>
            <X size={15} />
          </button>
        </div>

        {/* Options row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '38px' }}>
          {/* Priority pills */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['low','medium','high'].map(p => (
              <button key={p} onClick={() => setPri(p)} style={{
                padding: '3px 9px', borderRadius: 99,
                background: priority === p
                  ? p === 'high' ? 'var(--red-dim)' : p === 'medium' ? 'var(--yellow-dim)' : 'var(--green-dim)'
                  : 'var(--bg-overlay)',
                color: priority === p
                  ? p === 'high' ? 'var(--red)' : p === 'medium' ? 'var(--yellow)' : 'var(--green)'
                  : 'var(--text-tertiary)',
                border: `1px solid ${priority === p ? 'currentColor' : 'var(--border-subtle)'}`,
                cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                textTransform: 'capitalize', transition: 'all 120ms',
              }}>{p}</button>
            ))}
          </div>

          {/* Folder select */}
          {folders.length > 0 && (
            <select value={folderId} onChange={e => setFolId(e.target.value)}
              style={{
                background: 'var(--bg-overlay)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 99,
                color: 'var(--text-secondary)',
                fontSize: '11px',
                padding: '3px 8px',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'var(--font-body)',
              }}>
              <option value="">No folder</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
            </select>
          )}

          <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-tertiary)' }}>
            Press <kbd style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-default)', borderRadius: 4, padding: '1px 5px', fontSize: '10px', fontFamily: 'var(--font-body)' }}>Enter</kbd> to save
          </span>
        </div>
      </div>
    </div>
  );
}
