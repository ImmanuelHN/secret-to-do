import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db } from '../db/database';

const COLORS = ['#c6a27a','#6dbb8a','#e0b86a','#d97070','#7aaed4','#b088e8','#e8a0c0','#70c8b0','#e8c070','#a0c0e8'];
const ICONS  = ['📁','🏠','💼','🛒','📚','💪','✈️','🎯','🎨','🎵','👤','🍽️','💊','🐶','🌱','🔧'];

export default function EditFolderModal({ folderId, onClose }) {
  const [name,  setName]  = useState('');
  const [color, setColor] = useState('#c6a27a');
  const [icon,  setIcon]  = useState('📁');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.folders.get(folderId).then(f => {
      if (f) { setName(f.name); setColor(f.color || '#c6a27a'); setIcon(f.icon || '📁'); }
    });
  }, [folderId]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await db.folders.update(folderId, { name: name.trim(), color, icon });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <span className="modal-title">Edit Folder</span>
          <button className="btn-icon" onClick={onClose}><X size={17} /></button>
        </div>

        <div className="modal-body">
          {/* Preview */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 'var(--radius-lg)',
              background: color + '20', border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, boxShadow: `0 4px 20px ${color}30`, transition: 'all 250ms',
            }}>{icon}</div>
          </div>

          <div className="field">
            <label className="field-label">Folder name *</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)}
              autoFocus onKeyDown={e => e.key === 'Enter' && save()}
              style={{ fontSize: '15px', padding: '11px 14px' }} />
          </div>

          <div className="field">
            <label className="field-label">Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: 8, background: c, border: 'none',
                  cursor: 'pointer', outline: color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '2px',
                  transform: color === c ? 'scale(1.18)' : 'scale(1)',
                  boxShadow: color === c ? `0 2px 10px ${c}60` : 'none',
                  transition: 'all 150ms',
                }} />
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ICONS.map(i => (
                <button key={i} onClick={() => setIcon(i)} style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: icon === i ? 'var(--accent-dim)' : 'var(--bg-overlay)',
                  border: `1px solid ${icon === i ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer', fontSize: 17, transition: 'all 150ms',
                }}>{i}</button>
              ))}
            </div>
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
