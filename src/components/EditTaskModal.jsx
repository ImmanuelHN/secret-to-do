import { useState, useEffect } from 'react';
import TaskAttachments from './TaskAttachments';
import { X, Flag, Zap, Calendar, Clock, FolderOpen, Trash2 } from 'lucide-react';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';

export default function EditTaskModal({ taskId, onClose }) {
  const { folders } = useAppStore();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    db.tasks.get(taskId).then(t => {
      if (t) setForm({ ...t, folder_id: t.folder_id ?? '' });
    });
  }, [taskId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) { setErr('Title is required'); return; }
    setSaving(true);
    try {
      await db.tasks.update(taskId, {
        title:        form.title.trim(),
        description:  form.description,
        folder_id:    form.folder_id ? Number(form.folder_id) : null,
        priority:     form.priority,
        energy_level: form.energy_level,
        due_date:     form.due_date,
        reminder_time:form.reminder_time,
      });
      onClose();
    } catch { setErr('Failed to save'); setSaving(false); }
  };

  const deleteTask = async () => {
    if (confirm('Delete this task permanently?')) {
      await db.tasks.delete(taskId);
      onClose();
    }
  };

  if (!form) return null;

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="modal-header">
          <span className="modal-title">Edit Task</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn-icon danger" onClick={deleteTask} title="Delete task">
              <Trash2 size={16} />
            </button>
            <button className="btn-icon" onClick={onClose}><X size={17} /></button>
          </div>
        </div>

        <div className="modal-body">
          {err && (
            <div style={{ padding: '10px 12px', background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
              {err}
            </div>
          )}

          <div className="field">
            <label className="field-label">Task title *</label>
            <input className="input" value={form.title}
              onChange={e => set('title', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus style={{ fontSize: '15px', padding: '11px 14px' }} />
          </div>

          <div className="field">
            <label className="field-label">Description</label>
            <textarea className="input" rows={2} value={form.description || ''}
              onChange={e => set('description', e.target.value)} placeholder="Add notes…" />
          </div>

          <div className="field">
            <label className="field-label"><FolderOpen size={12} /> Folder</label>
            <select className="input" value={form.folder_id ?? ''} onChange={e => set('folder_id', e.target.value)}>
              <option value="">No folder</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
            </select>
          </div>

          <div className="field">
            <label className="field-label"><Flag size={12} /> Priority</label>
            <div className="seg-control">
              {['low', 'medium', 'high'].map(p => (
                <button key={p} className={`seg-btn ${form.priority === p ? `active-${p}` : ''}`}
                  onClick={() => set('priority', p)}>{p}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label"><Zap size={12} /> Energy</label>
            <div className="seg-control">
              {['low', 'medium', 'high'].map(e => (
                <button key={e} className={`seg-btn ${form.energy_level === e ? 'active-energy' : ''}`}
                  onClick={() => set('energy_level', e)}>{e}</button>
              ))}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label"><Calendar size={12} /> Due date</label>
              <input type="date" className="input" value={form.due_date || ''}
                onChange={e => set('due_date', e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label"><Clock size={12} /> Reminder</label>
              <input type="time" className="input" value={form.reminder_time || ''}
                onChange={e => set('reminder_time', e.target.value)} />
            </div>
          </div>

          {/* Attachments */}
          <div className="field">
            <label className="field-label">📎 Attachments</label>
            {form?.id && <TaskAttachments taskId={form.id} />}
          </div>

          {/* Completion toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Mark as completed
            </span>
            <button
              onClick={() => set('completed', form.completed ? 0 : 1)}
              style={{
                width: 40, height: 22, borderRadius: 99,
                background: form.completed ? 'var(--green)' : 'var(--border-default)',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background 200ms',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, borderRadius: '50%',
                width: 16, height: 16, background: 'white',
                left: form.completed ? 21 : 3,
                transition: 'left 200ms',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
