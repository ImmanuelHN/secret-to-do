import { useState, useRef } from 'react';
import { Trash2, Calendar, Zap, Pencil, Repeat } from 'lucide-react';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';
import { handleRecurOnComplete } from '../services/recurService';

export default function TaskCard({ task, folders = [], showFolder = true }) {
  const { selectedTaskIds, toggleSelectTask, setEditTaskId } = useAppStore();
  const [done, setDone] = useState(!!task.completed);
  const isSelected  = selectedTaskIds.has(task.id);
  const isSelecting = selectedTaskIds.size > 0;

  const folder    = folders.find(f => f.id === task.folder_id);
  const isOverdue = task.due_date && !task.completed
    && new Date(task.due_date) < new Date(new Date().toDateString());

  const pressTimer = useRef(null);
  const onPressStart = () => { pressTimer.current = setTimeout(() => toggleSelectTask(task.id), 500); };
  const onPressEnd   = () => clearTimeout(pressTimer.current);

  const toggle = async (e) => {
    e.stopPropagation();
    if (isSelecting) { toggleSelectTask(task.id); return; }
    const next = !done;
    setDone(next);
    await db.tasks.update(task.id, { completed: next ? 1 : 0 });
    // Handle recurring: spawn next occurrence when marking complete
    if (next && task.recur) {
      await handleRecurOnComplete(task);
    }
  };

  const handleCardClick = () => { if (isSelecting) toggleSelectTask(task.id); };
  const openEdit  = (e) => { e.stopPropagation(); setEditTaskId(task.id); };
  const remove    = async (e) => { e.stopPropagation(); await db.tasks.delete(task.id); };

  return (
    <div
      className={`task-card priority-${task.priority} ${done ? 'completed' : ''}`}
      style={{
        outline: isSelected ? '2px solid var(--accent)' : 'none',
        outlineOffset: '1px',
        cursor: isSelecting ? 'pointer' : 'default',
      }}
      onClick={handleCardClick}
      onMouseDown={onPressStart} onMouseUp={onPressEnd}
      onTouchStart={onPressStart} onTouchEnd={onPressEnd}
    >
      <button
        className={`checkbox ${done ? 'checked' : ''}`}
        style={isSelected ? { background: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
        onClick={toggle}
      >
        {(done || isSelected) && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{
            fontSize: '13.5px', fontWeight: 500, lineHeight: '1.45',
            color: done ? 'var(--text-tertiary)' : 'var(--text-primary)',
            textDecoration: done ? 'line-through' : 'none',
            wordBreak: 'break-word', transition: 'all 200ms',
          }}>
            {task.title}
          </span>
          <div className="task-actions" style={{ display: 'flex', gap: '2px', flexShrink: 0, opacity: 0, transition: 'opacity 140ms' }}>
            <button className="btn-icon" style={{ padding: '3px' }} onClick={openEdit} title="Edit"><Pencil size={12} /></button>
            <button className="btn-icon danger" style={{ padding: '3px' }} onClick={remove} title="Delete"><Trash2 size={12} /></button>
          </div>
        </div>

        {task.description && !done && (
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', lineHeight: '1.55' }}>
            {task.description.length > 120 ? task.description.slice(0,120)+'…' : task.description}
          </p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px', alignItems: 'center' }}>
          <span className={`chip chip-${task.priority}`}>{task.priority}</span>

          {task.recur && (
            <span className="chip chip-accent" style={{ gap: '3px' }}>
              <Repeat size={9} />{task.recur}
            </span>
          )}

          {task.energy_level && (
            <span className="chip chip-subtle" style={{ gap: '3px' }}>
              <Zap size={9} />{task.energy_level}
            </span>
          )}

          {task.due_date && (
            <span className="chip" style={{
              background: isOverdue ? 'var(--red-dim)' : 'var(--bg-overlay)',
              color: isOverdue ? 'var(--red)' : 'var(--text-tertiary)',
              border: isOverdue ? 'none' : '1px solid var(--border-subtle)',
              gap: '4px',
            }}>
              <Calendar size={9} />
              {isOverdue ? 'Overdue · ' : ''}
              {new Date(task.due_date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}
            </span>
          )}

          {showFolder && folder && (
            <span className="chip" style={{ background:(folder.color||'var(--accent)')+'18', color:folder.color||'var(--accent)', border:'none' }}>
              {folder.icon} {folder.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
