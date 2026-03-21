import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Calendar, LayoutDashboard, Search, Activity, BarChart2,
  Archive, Settings, Plus, Moon, Sun, Sparkles,
  Trash2, X, Pencil,
} from 'lucide-react';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';

const NAV = [
  { id: 'planner',   label: 'Daily Planner', icon: Calendar },
  { id: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'charts',    label: 'Charts',        icon: BarChart2 },
  { id: 'search',    label: 'Search',        icon: Search },
  { id: 'habits',    label: 'Habits',        icon: Activity },
  { id: 'vault',     label: 'Vault',         icon: Archive },
  { id: 'settings',  label: 'Settings',      icon: Settings },
];

const THEMES = [
  { id: 'dark',      label: 'Dark',      icon: Moon },
  { id: 'light',     label: 'Light',     icon: Sun },
  { id: 'aesthetic', label: 'Aesthetic', icon: Sparkles },
];

export default function Sidebar() {
  const {
    activeView, setActiveView, activeFolderId, setActiveFolderId,
    theme, setTheme, sidebarOpen, closeSidebar,
    setAddFolderModal, setEditFolderId, folders, setFolders,
  } = useAppStore();

  const liveFolders = useLiveQuery(() => db.folders.toArray(), []);
  useEffect(() => { if (liveFolders) setFolders(liveFolders); }, [liveFolders]);

  const taskCounts = useLiveQuery(async () => {
    const tasks = await db.tasks.where('completed').equals(0).toArray();
    const counts = {};
    tasks.forEach(t => { if (t.folder_id) counts[t.folder_id] = (counts[t.folder_id]||0)+1; });
    return counts;
  }, []);

  const todayCount = useLiveQuery(async () => {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await db.tasks.where('completed').equals(0).toArray();
    return tasks.filter(t => t.due_date === today).length;
  }, []);

  const nav = (id) => { setActiveView(id); closeSidebar(); };
  const openFolder = (f) => { setActiveFolderId(f.id); closeSidebar(); };
  const delFolder = async (e, id) => {
    e.stopPropagation();
    if (confirm('Delete folder and all its tasks?')) {
      await db.tasks.where('folder_id').equals(id).delete();
      await db.folders.delete(id);
    }
  };
  const editFolder = (e, id) => { e.stopPropagation(); setEditFolderId(id); closeSidebar(); };

  return (
    <>
      {sidebarOpen && <div className="sidebar-backdrop active" onClick={closeSidebar} />}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>

        <div className="sidebar-logo">
          <img src="/secret-to-do/logo.png" alt="SToDo" style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
          <div>
            <div className="sidebar-logo-text">SToDo</div>
            <div className="sidebar-logo-sub">local · private · offline</div>
          </div>
          <button className="btn-icon" style={{ marginLeft: 'auto' }} onClick={closeSidebar}>
            <X size={16} />
          </button>
        </div>

        <div className="sidebar-scroll" style={{ paddingBottom: '16px' }}>
          <div className="sidebar-section-label">Menu</div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {NAV.map(({ id, label, icon: Icon }) => (
              <button key={id}
                className={`nav-item ${activeView === id && !activeFolderId ? 'active' : ''}`}
                onClick={() => nav(id)}
              >
                <Icon size={16} style={{ opacity: 0.8 }} />
                {label}
                {id === 'planner' && todayCount > 0 && <span className="nav-badge">{todayCount}</span>}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px' }}>
            <div className="sidebar-section-label" style={{ flex: 1 }}>Folders</div>
            <button className="btn-icon" style={{ padding: '4px', marginRight: '4px' }}
              onClick={() => setAddFolderModal(true)} title="New folder">
              <Plus size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {(folders||[]).length === 0 && (
              <div style={{ padding: '8px 10px', fontSize: '12px', color: 'var(--text-tertiary)' }}>No folders yet</div>
            )}
            {(folders||[]).map(f => (
              <button key={f.id}
                className={`folder-item ${activeFolderId === f.id ? 'active' : ''}`}
                onClick={() => openFolder(f)}
              >
                <span className="folder-dot" style={{ background: f.color||'var(--accent)' }} />
                <span className="folder-name">
                  {f.icon && <span style={{ marginRight: '5px' }}>{f.icon}</span>}{f.name}
                </span>
                {taskCounts?.[f.id] > 0 && (
                  <span className="nav-badge" style={{ marginRight: '2px' }}>{taskCounts[f.id]}</span>
                )}
                <button className="folder-edit-btn" onClick={e => editFolder(e, f.id)} title="Edit">
                  <Pencil size={11} />
                </button>
                <button className="folder-delete" onClick={e => delFolder(e, f.id)} title="Delete">
                  <Trash2 size={11} />
                </button>
              </button>
            ))}
          </div>
          <div style={{ height: '20px' }} />
        </div>

        <div className="theme-bar" style={{ marginBottom: '0px' }}>
          <div className="theme-bar-label">Theme</div>
          <div className="theme-pills">
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button key={id}
                className={`theme-pill ${theme === id ? 'active' : ''}`}
                onClick={() => setTheme(id)} title={label}>
                <Icon size={13} />{label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
