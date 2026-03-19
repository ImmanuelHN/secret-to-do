import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';
import TaskCard from '../components/TaskCard';
import SortBar from '../components/SortBar';
import BulkActionBar from '../components/BulkActionBar';
import { sortTasks } from '../utils/sortTasks';
import { Circle, CheckCircle2, Plus, ShoppingCart, List, X, Pencil } from 'lucide-react';

// ── Shopping List Item ──────────────────────────────────────────────────────
function ShopItem({ task, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(task.title);

  const saveEdit = async () => {
    if (val.trim()) await db.tasks.update(task.id, { title: val.trim() });
    setEditing(false);
  };

  return (
    <div className={`shop-item ${task.completed ? 'checked' : ''}`}>
      <button
        className={`checkbox ${task.completed ? 'checked' : ''}`}
        style={{ width: 20, height: 20, borderRadius: 6 }}
        onClick={onToggle}
      >
        {task.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false); }}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            font: '500 14px var(--font-body)', color: 'var(--text-primary)',
          }}
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          style={{
            flex: 1, fontSize: '14px', fontWeight: 500,
            color: task.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
            textDecoration: task.completed ? 'line-through' : 'none',
            cursor: 'default',
          }}
        >
          {task.title}
        </span>
      )}

      {task.description && !editing && (
        <span style={{
          fontSize: '11px', color: 'var(--text-tertiary)',
          background: 'var(--bg-overlay)', padding: '2px 7px',
          borderRadius: 99, flexShrink: 0,
        }}>{task.description}</span>
      )}

      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
        <button className="btn-icon" style={{ padding: '3px', opacity: 0.5 }}
          onClick={() => setEditing(true)} title="Edit item">
          <Pencil size={12} />
        </button>
        <button className="btn-icon danger" style={{ padding: '3px', opacity: 0.5 }}
          onClick={onDelete} title="Remove">
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Inline Add Row ──────────────────────────────────────────────────────────
function InlineAdd({ folderId, isShopMode }) {
  const [title, setTitle] = useState('');
  const [qty, setQty]     = useState('');

  const add = async () => {
    if (!title.trim()) return;
    await db.tasks.add({
      title: title.trim(),
      description: isShopMode ? qty : '',
      folder_id: folderId,
      priority: 'medium',
      energy_level: 'medium',
      due_date: '',
      reminder_time: '',
      completed: 0,
      created_at: new Date().toISOString(),
    });
    setTitle('');
    setQty('');
  };

  return (
    <div className="inline-add">
      <Plus size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && add()}
        placeholder={isShopMode ? 'Add item…' : 'Add task…'}
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          font: '400 13.5px var(--font-body)', color: 'var(--text-primary)',
        }}
      />
      {isShopMode && (
        <input
          value={qty}
          onChange={e => setQty(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="Qty"
          style={{
            width: 52, background: 'none', border: 'none', outline: 'none',
            font: '400 12px var(--font-body)', color: 'var(--text-tertiary)',
            textAlign: 'center',
          }}
        />
      )}
      <button
        onClick={add}
        disabled={!title.trim()}
        style={{
          background: title.trim() ? 'var(--accent)' : 'var(--bg-overlay)',
          color: title.trim() ? 'white' : 'var(--text-tertiary)',
          border: 'none', borderRadius: 'var(--radius-sm)',
          padding: '5px 10px', fontSize: '12px', fontWeight: 600,
          cursor: title.trim() ? 'pointer' : 'default',
          transition: 'all 150ms', flexShrink: 0,
        }}
      >Add</button>
    </div>
  );
}

// ── Main FolderPage ──────────────────────────────────────────────────────────
export default function FolderPage() {
  const { activeFolderId, folders, taskSort, selectedTaskIds, clearSelection } = useAppStore();
  const folder = folders.find(f => f.id === activeFolderId);
  const [shopMode, setShopMode] = useState(false);

  const tasks = useLiveQuery(
    () => activeFolderId ? db.tasks.where('folder_id').equals(activeFolderId).toArray() : [],
    [activeFolderId]
  );

  if (!tasks) return null;

  const pending   = sortTasks(tasks.filter(t => !t.completed), taskSort);
  const completed = tasks.filter(t => t.completed);
  const pct       = tasks.length === 0 ? 0 : Math.round(completed.length / tasks.length * 100);

  const toggleShopItem = async (task) => {
    await db.tasks.update(task.id, { completed: task.completed ? 0 : 1 });
  };

  const deleteTask = async (id) => {
    await db.tasks.delete(id);
  };

  return (
    <div className="page">
      {/* Folder header */}
      <div className="folder-header-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: 58, height: 58, borderRadius: 'var(--radius-lg)',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, flexShrink: 0,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
          }}>
            {folder?.icon || '📁'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px' }}>
              {folder?.name || 'Folder'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.65, marginTop: '3px' }}>
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {completed.length} done
            </div>
            <div className="progress-track" style={{ marginTop: '12px', height: '4px', background: 'rgba(255,255,255,0.15)' }}>
              <div className="progress-fill" style={{ width: `${pct}%`, background: 'rgba(255,255,255,0.80)' }} />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px', letterSpacing: '-1px' }}>
              {pct}<span style={{ fontSize: '14px', opacity: 0.7 }}>%</span>
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
          <button
            onClick={() => setShopMode(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              background: !shopMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'inherit', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
              transition: 'all 150ms',
            }}
          >
            <List size={13} /> Task view
          </button>
          <button
            onClick={() => setShopMode(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              background: shopMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'inherit', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
              transition: 'all 150ms',
            }}
          >
            <ShoppingCart size={13} /> Shopping list
          </button>
        </div>
      </div>

      {/* Inline add */}
      <InlineAdd folderId={activeFolderId} isShopMode={shopMode} />

      {/* ── SHOPPING MODE ── */}
      {shopMode ? (
        <div>
          {tasks.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={44} className="empty-icon" />
              <div className="empty-title">List is empty</div>
              <div className="empty-desc">Add items above to start your shopping list</div>
            </div>
          ) : (
            <>
              {/* Unchecked */}
              {pending.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div className="section-head">
                    <Circle size={12} style={{ color: 'var(--text-tertiary)' }} />
                    <span className="section-head-title">To get</span>
                    <span className="section-head-count">{pending.length}</span>
                  </div>
                  <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {pending.map(t => (
                      <ShopItem
                        key={t.id} task={t}
                        onToggle={() => toggleShopItem(t)}
                        onDelete={() => deleteTask(t.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Checked */}
              {completed.length > 0 && (
                <div>
                  <div className="section-head">
                    <CheckCircle2 size={12} style={{ color: 'var(--green)' }} />
                    <span className="section-head-title">Got it</span>
                    <span className="section-head-count">{completed.length}</span>
                    <button
                      style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={async () => {
                        const ids = completed.map(t => t.id);
                        await Promise.all(ids.map(id => db.tasks.delete(id)));
                      }}
                    >
                      Clear checked
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {completed.map(t => (
                      <ShopItem
                        key={t.id} task={t}
                        onToggle={() => toggleShopItem(t)}
                        onDelete={() => deleteTask(t.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ── TASK MODE ── */
        <>
          <SortBar taskCount={pending.length + completed.length} />

          {pending.length > 0 && (
            <section>
              <div className="section-head">
                <Circle size={12} style={{ color: 'var(--text-tertiary)' }} />
                <span className="section-head-title">Pending</span>
                <span className="section-head-count">{pending.length}</span>
              </div>
              <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {pending.map(t => <TaskCard key={t.id} task={t} folders={folders} showFolder={false} />)}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <div className="section-head">
                <CheckCircle2 size={12} style={{ color: 'var(--green)' }} />
                <span className="section-head-title">Completed</span>
                <span className="section-head-count">{completed.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {completed.map(t => <TaskCard key={t.id} task={t} folders={folders} showFolder={false} />)}
              </div>
            </section>
          )}

          {tasks.length === 0 && (
            <div className="empty-state">
              <Plus size={40} className="empty-icon" />
              <div className="empty-title">Empty folder</div>
              <div className="empty-desc">Add your first task using the row above or "New Task".</div>
            </div>
          )}
        </>
      )}

      {selectedTaskIds.size > 0 && <BulkActionBar />}
    </div>
  );
}
