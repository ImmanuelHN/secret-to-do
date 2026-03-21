import { useState } from 'react';
import { X, Flag, Zap, Calendar, Clock, FolderOpen, Repeat, Paperclip } from 'lucide-react';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';
import { scheduleTaskReminder } from '../services/reminderService';
import SmartFolderHint from './SmartFolderHint';
import VoiceInput from './VoiceInput';
import TaskAttachments from './TaskAttachments';

const RECUR_OPTS = [
  { value: null,      label: 'None' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function AddTaskModal({ onClose }) {
  const { folders, activeFolderId } = useAppStore();
  const [form, setForm] = useState({
    title: '', description: '',
    folder_id: activeFolderId || folders[0]?.id || '',
    priority: 'medium', energy_level: 'medium',
    due_date: '', reminder_time: '', recur: null,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [savedTaskId, setSavedTaskId] = useState(null); // After save, show attachments

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) { setErr('Please enter a task title.'); return; }
    setSaving(true);
    try {
      const id = await db.tasks.add({
        ...form,
        folder_id: form.folder_id ? Number(form.folder_id) : null,
        completed: 0,
        created_at: new Date().toISOString(),
      });
      const today = new Date().toISOString().split('T')[0];
      if (form.reminder_time && form.due_date === today) {
        scheduleTaskReminder({ id, ...form });
      }
      // Instead of closing immediately, show attachment step
      setSavedTaskId(id);
      setSaving(false);
    } catch { setErr('Failed to save.'); setSaving(false); }
  };

  // Step 2: attachment screen shown after task is saved
  if (savedTaskId) {
    return (
      <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-panel">
          <div className="modal-header">
            <span className="modal-title">Add Attachments</span>
            <button className="btn-icon" onClick={onClose}><X size={17} /></button>
          </div>
          <div className="modal-body">
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
                "{form.title}" saved!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Optionally add photos or videos to this task
              </div>
            </div>
            <div className="field">
              <label className="field-label"><Paperclip size={12} /> Attachments (optional)</label>
              <TaskAttachments taskId={savedTaskId} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="modal-header">
          <span className="modal-title">New Task</span>
          <button className="btn-icon" onClick={onClose}><X size={17} /></button>
        </div>

        <div className="modal-body">
          {err && (
            <div style={{ padding: '10px 12px', background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
              {err}
            </div>
          )}

          {/* Title + Voice */}
          <div className="field">
            <label className="field-label">Task title *</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input className="input" placeholder="What needs to be done?"
                value={form.title} onChange={e => set('title', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && save()}
                autoFocus style={{ fontSize: '15px', padding: '11px 14px' }} />
              <VoiceInput onResult={text => set('title', text)} />
            </div>
          </div>

          {form.title.length >= 3 && <SmartFolderHint title={form.title} />}

          <div className="field">
            <label className="field-label">Description</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <textarea className="input" rows={2} placeholder="Add notes…"
                value={form.description} onChange={e => set('description', e.target.value)} />
              <VoiceInput onResult={text => set('description', p => p ? p + ' ' + text : text)} />
            </div>
          </div>

          <div className="field">
            <label className="field-label"><FolderOpen size={12} /> Folder</label>
            <select className="input" value={form.folder_id} onChange={e => set('folder_id', e.target.value)}>
              <option value="">No folder</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
            </select>
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label"><Flag size={12} /> Priority</label>
              <div className="seg-control">
                {['low','medium','high'].map(p => (
                  <button key={p} className={`seg-btn ${form.priority === p ? `active-${p}` : ''}`} onClick={() => set('priority', p)}>{p}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="field-label"><Zap size={12} /> Energy</label>
              <div className="seg-control">
                {['low','medium','high'].map(e => (
                  <button key={e} className={`seg-btn ${form.energy_level === e ? 'active-energy' : ''}`} onClick={() => set('energy_level', e)}>{e}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field-label"><Calendar size={12} /> Due date</label>
              <input type="date" className="input" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label"><Clock size={12} /> Reminder</label>
              <input type="time" className="input" value={form.reminder_time} onChange={e => set('reminder_time', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="field-label"><Repeat size={12} /> Repeat</label>
            <div className="seg-control">
              {RECUR_OPTS.map(opt => (
                <button key={String(opt.value)}
                  className={`seg-btn ${form.recur === opt.value ? 'active-energy' : ''}`}
                  onClick={() => set('recur', opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.recur && (
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Repeat size={10} />
              Auto-creates next occurrence when this task is completed
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
