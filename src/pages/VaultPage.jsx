import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';

export default function VaultPage() {
  const { folders } = useAppStore();
  const vaultTasks = useLiveQuery(async () => {
    const all = await db.tasks.where('completed').equals(1).toArray();
    const cut = new Date(); cut.setDate(cut.getDate() - 7);
    return all.filter(t => t.created_at && new Date(t.created_at) < cut);
  }, []);

  const restore = (id) => db.tasks.update(id, { completed: 0 });
  const remove  = async (id) => { if (confirm('Permanently delete?')) await db.tasks.delete(id); };
  const clearAll = async () => {
    if (confirm('Delete all vault tasks permanently?'))
      await Promise.all((vaultTasks||[]).map(t => db.tasks.delete(t.id)));
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Vault</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '3px' }}>Completed tasks older than 7 days</div>
        </div>
        {vaultTasks?.length > 0 && (
          <button className="btn btn-ghost" style={{ color: 'var(--red)', fontSize: '12px' }} onClick={clearAll}>
            <Trash2 size={13} /> Clear all
          </button>
        )}
      </div>

      {vaultTasks?.length > 0 ? (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {vaultTasks.map(t => {
            const folder = folders.find(f => f.id === t.folder_id);
            return (
              <div key={t.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Archive size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', textDecoration: 'line-through', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title}
                  </div>
                  {folder && (
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{folder.icon} {folder.name}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button className="btn-icon" title="Restore" onClick={() => restore(t.id)} style={{ color: 'var(--green)' }}><RotateCcw size={14} /></button>
                  <button className="btn-icon danger" title="Delete" onClick={() => remove(t.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Archive size={44} className="empty-icon" />
          <div className="empty-title">Vault is empty</div>
          <div className="empty-desc">Completed tasks older than 7 days will appear here</div>
        </div>
      )}
    </div>
  );
}
