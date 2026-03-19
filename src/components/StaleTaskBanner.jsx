import { useState, useEffect } from 'react';
import { Archive, Trash2, X, Clock } from 'lucide-react';
import { getStaleTaskIds, moveStaleToVault, deleteStale } from '../services/staleTaskService';
import { db } from '../db/database';

export default function StaleTaskBanner() {
  const [staleIds, setStaleIds] = useState([]);
  const [staleTasks, setStaleTasks] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      const ids = await getStaleTaskIds(14);
      setStaleIds(ids);
      if (ids.length > 0) {
        const tasks = await Promise.all(ids.map(id => db.tasks.get(id)));
        setStaleTasks(tasks.filter(Boolean));
      }
    })();
  }, []);

  if (staleIds.length === 0 || dismissed) return null;

  const handleVault = async () => {
    await moveStaleToVault(staleIds);
    setDismissed(true);
  };

  const handleDelete = async () => {
    if (confirm(`Permanently delete ${staleIds.length} stale task${staleIds.length > 1 ? 's' : ''}?`)) {
      await deleteStale(staleIds);
      setDismissed(true);
    }
  };

  return (
    <div style={{
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--yellow-dim)',
      background: 'var(--bg-elevated)',
      overflow: 'hidden',
      animation: 'fadeUp 300ms var(--ease-out) both',
    }}>
      {/* Banner row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 16px',
        background: 'var(--yellow-dim)',
      }}>
        <Clock size={15} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {staleIds.length} stale task{staleIds.length > 1 ? 's' : ''} found
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
            Inactive for 14+ days
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ fontSize: '11px', color: 'var(--yellow)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          {expanded ? 'Hide' : 'View'}
        </button>
        <button className="btn-icon" style={{ padding: '2px', color: 'var(--text-tertiary)' }} onClick={() => setDismissed(true)}>
          <X size={14} />
        </button>
      </div>

      {/* Expanded list */}
      {expanded && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
            {staleTasks.map(t => (
              <div key={t.id} style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '5px 8px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`chip chip-${t.priority}`} style={{ fontSize: '10px', padding: '1px 5px' }}>{t.priority}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={handleVault}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '8px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-dim)', color: 'var(--accent)',
                border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              }}
            >
              <Archive size={13} /> Move to Vault
            </button>
            <button
              onClick={handleDelete}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '8px', borderRadius: 'var(--radius-sm)',
                background: 'var(--red-dim)', color: 'var(--red)',
                border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              }}
            >
              <Trash2 size={13} /> Delete All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
