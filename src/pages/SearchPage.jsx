import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, X } from 'lucide-react';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';
import TaskCard from '../components/TaskCard';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const { folders } = useAppStore();

  const results = useLiveQuery(async () => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    const all = await db.tasks.toArray();
    return all.filter(t => t.title.toLowerCase().includes(lower) || (t.description || '').toLowerCase().includes(lower));
  }, [q]);

  return (
    <div className="page">
      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
        <input
          className="input"
          style={{ paddingLeft: '42px', paddingRight: q ? '40px' : '14px', fontSize: '15px', padding: '13px 14px 13px 42px' }}
          placeholder="Search tasks…"
          value={q} onChange={e => setQ(e.target.value)}
          autoFocus
        />
        {q && (
          <button className="btn-icon" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '5px' }} onClick={() => setQ('')}>
            <X size={15} />
          </button>
        )}
      </div>

      {q.trim() && results && (
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '14px', letterSpacing: '0.2px' }}>
            {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
          </div>
          {results.length > 0
            ? <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {results.map(t => <TaskCard key={t.id} task={t} folders={folders} />)}
              </div>
            : <div className="empty-state">
                <Search size={40} className="empty-icon" />
                <div className="empty-title">No results</div>
                <div className="empty-desc">Try different keywords</div>
              </div>
          }
        </div>
      )}

      {!q.trim() && (
        <div className="empty-state">
          <Search size={40} className="empty-icon" />
          <div className="empty-title">Search your tasks</div>
          <div className="empty-desc">Find any task instantly across all folders and descriptions</div>
        </div>
      )}
    </div>
  );
}
