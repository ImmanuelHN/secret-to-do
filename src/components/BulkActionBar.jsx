import { Trash2, CheckCheck, X, FolderInput } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { db } from '../db/database';

export default function BulkActionBar() {
  const { selectedTaskIds, clearSelection, folders } = useAppStore();
  const count = selectedTaskIds.size;

  if (count === 0) return null;

  const markAllDone = async () => {
    await Promise.all([...selectedTaskIds].map(id => db.tasks.update(id, { completed: 1 })));
    clearSelection();
  };

  const markAllUndone = async () => {
    await Promise.all([...selectedTaskIds].map(id => db.tasks.update(id, { completed: 0 })));
    clearSelection();
  };

  const deleteAll = async () => {
    if (confirm(`Delete ${count} task${count > 1 ? 's' : ''}?`)) {
      await Promise.all([...selectedTaskIds].map(id => db.tasks.delete(id)));
      clearSelection();
    }
  };

  const moveToFolder = async (folderId) => {
    await Promise.all([...selectedTaskIds].map(id =>
      db.tasks.update(id, { folder_id: folderId ? Number(folderId) : null })
    ));
    clearSelection();
  };

  return (
    <div style={{
      position: 'fixed', bottom: '24px', left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 80,
      animation: 'quickSlideUp 220ms cubic-bezier(0.16,1,0.3,1) both',
    }}>
      <style>{`
        @keyframes quickSlideUp {
          from { opacity:0; transform:translateX(-50%) translateY(16px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-xl)',
        padding: '8px 12px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Count badge */}
        <div style={{
          background: 'var(--accent)', color: 'white',
          borderRadius: 99, padding: '3px 10px',
          fontSize: '12px', fontWeight: 700, marginRight: '4px',
        }}>
          {count} selected
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-default)', margin: '0 2px' }} />

        <button
          onClick={markAllDone}
          title="Mark all done"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '7px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--green-dim)', color: 'var(--green)',
            border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            transition: 'all 140ms',
          }}
        >
          <CheckCheck size={14} /> Complete
        </button>

        <button
          onClick={markAllUndone}
          title="Mark all undone"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '7px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-overlay)', color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)', cursor: 'pointer',
            fontSize: '12px', fontWeight: 500, transition: 'all 140ms',
          }}
        >
          Undo
        </button>

        {/* Move to folder */}
        {folders.length > 0 && (
          <select
            onChange={e => { if (e.target.value !== '__none') moveToFolder(e.target.value === '' ? null : e.target.value); }}
            defaultValue="__none"
            style={{
              background: 'var(--bg-overlay)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '12px', padding: '7px 10px',
              cursor: 'pointer', outline: 'none',
              fontFamily: 'var(--font-body)',
            }}
          >
            <option value="__none" disabled>Move to…</option>
            <option value="">No folder</option>
            {folders.map(f => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
          </select>
        )}

        <button
          onClick={deleteAll}
          title="Delete selected"
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '7px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--red-dim)', color: 'var(--red)',
            border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
            transition: 'all 140ms',
          }}
        >
          <Trash2 size={14} /> Delete
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border-default)', margin: '0 2px' }} />

        <button className="btn-icon" onClick={clearSelection} style={{ padding: '4px' }} title="Clear selection">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
