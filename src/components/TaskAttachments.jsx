import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, X, Image, Video, FileText, Download, Expand } from 'lucide-react';
import { db } from '../db/database';

function fileIcon(type) {
  if (type?.startsWith('image/')) return Image;
  if (type?.startsWith('video/')) return Video;
  return FileText;
}

function AttachmentPreview({ att, onDelete }) {
  const [fullscreen, setFullscreen] = useState(false);
  const url = att.url;
  const Icon = fileIcon(att.type);

  return (
    <>
      {fullscreen && (
        <div onClick={() => setFullscreen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {att.type?.startsWith('image/') && <img src={url} alt={att.name} style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }} />}
          {att.type?.startsWith('video/') && <video src={url} controls style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: '12px' }} />}
          <button onClick={() => setFullscreen(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <X size={18} />
          </button>
        </div>
      )}

      <div style={{ position: 'relative', display: 'inline-block' }}>
        {att.type?.startsWith('image/') ? (
          <div onClick={() => setFullscreen(true)} style={{ cursor: 'pointer', borderRadius: 'var(--radius-sm)', overflow: 'hidden', width: 80, height: 80, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)' }}>
            <img src={url} alt={att.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : att.type?.startsWith('video/') ? (
          <div onClick={() => setFullscreen(true)} style={{ cursor: 'pointer', borderRadius: 'var(--radius-sm)', overflow: 'hidden', width: 80, height: 80, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={28} style={{ color: 'var(--accent)' }} />
          </div>
        ) : (
          <div style={{ borderRadius: 'var(--radius-sm)', width: 80, height: 80, background: 'var(--bg-overlay)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'default' }}>
            <Icon size={22} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px' }}>{att.name}</span>
          </div>
        )}

        {/* Delete button */}
        <button onClick={() => onDelete(att.id)} style={{
          position: 'absolute', top: -6, right: -6,
          width: 20, height: 20, borderRadius: '50%',
          background: 'var(--red)', border: '2px solid var(--bg-elevated)',
          color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}>
          <X size={10} />
        </button>
      </div>
    </>
  );
}

export default function TaskAttachments({ taskId }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const attachments = useLiveQuery(
    () => taskId ? db.attachments.where('task_id').equals(taskId).toArray() : [],
    [taskId]
  );

  const handleFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        // Read as data URL for local storage
        const url = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
        await db.attachments.add({
          task_id:    taskId,
          name:       file.name,
          type:       file.type,
          url,
          size:       file.size,
          created_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Upload failed', err);
    }
    setUploading(false);
    e.target.value = '';
  };

  const deleteAttachment = async (id) => {
    await db.attachments.delete(id);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: (attachments?.length || 0) > 0 ? '10px' : 0 }}>
        {(attachments || []).map(att => (
          <AttachmentPreview key={att.id} att={att} onDelete={deleteAttachment} />
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 12px', borderRadius: 'var(--radius-sm)',
          border: '1px dashed var(--border-default)',
          background: 'var(--bg-overlay)',
          color: 'var(--text-tertiary)',
          cursor: 'pointer', fontSize: '12px', fontWeight: 500,
          transition: 'all 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
      >
        <Plus size={13} />
        {uploading ? 'Adding…' : 'Add photo / video'}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  );
}
