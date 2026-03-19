import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../store/appStore';
import { db } from '../db/database';
import { FolderOpen, ChevronRight, CheckCircle2, Circle } from 'lucide-react';

/**
 * SmartFolderHint — shown in AddTaskModal when task title matches a folder name.
 * Displays that folder's pending tasks as a quick checklist preview.
 */
export default function SmartFolderHint({ title }) {
  const { folders, setActiveFolderId } = useAppStore();
  const [matchedFolder, setMatchedFolder] = useState(null);

  useEffect(() => {
    if (!title || title.trim().length < 3) { setMatchedFolder(null); return; }
    const lower = title.toLowerCase();
    const match = folders.find(f => {
      const fn = f.name.toLowerCase();
      return lower.includes(fn) || fn.includes(lower.split(' ')[0]);
    });
    setMatchedFolder(match || null);
  }, [title, folders]);

  const folderTasks = useLiveQuery(async () => {
    if (!matchedFolder) return [];
    return db.tasks.where('folder_id').equals(matchedFolder.id).toArray();
  }, [matchedFolder?.id]);

  if (!matchedFolder || !folderTasks) return null;

  const pending   = folderTasks.filter(t => !t.completed).slice(0, 4);
  const completed = folderTasks.filter(t => t.completed).length;

  if (folderTasks.length === 0) return null;

  return (
    <div style={{
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-focus)',
      background: 'var(--accent-dim)',
      overflow: 'hidden',
      animation: 'fadeUp 200ms var(--ease-out) both',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: '16px' }}>{matchedFolder.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>
            Matches folder: {matchedFolder.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {folderTasks.length} items · {completed} done
          </div>
        </div>
        <button
          onClick={() => setActiveFolderId(matchedFolder.id)}
          style={{ fontSize: '11px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}
        >
          Open <ChevronRight size={11} />
        </button>
      </div>

      {/* Pending items */}
      {pending.length > 0 && (
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {pending.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px' }}>
              {t.completed
                ? <CheckCircle2 size={12} style={{ color: 'var(--green)', flexShrink: 0 }} />
                : <Circle size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              }
              <span style={{ color: t.completed ? 'var(--text-tertiary)' : 'var(--text-secondary)', textDecoration: t.completed ? 'line-through' : 'none' }}>
                {t.title}
              </span>
            </div>
          ))}
          {folderTasks.length > 4 && (
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', paddingLeft: '19px' }}>
              +{folderTasks.length - 4} more in folder…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
