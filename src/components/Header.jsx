import { Menu, Plus, Zap } from 'lucide-react';
import { useAppStore } from '../store/appStore';

const TITLES = {
  planner:   'Daily Planner',
  dashboard: 'Dashboard',
  search:    'Search',
  habits:    'Habits',
  vault:     'Vault',
  settings:  'Settings',
};

export default function Header() {
  const { toggleSidebar, activeView, activeFolderId, folders, setAddTaskModal, setQuickAddOpen } = useAppStore();
  const folder = folders.find(f => f.id === activeFolderId);
  const title = activeFolderId && activeView === 'folder'
    ? folder?.name || 'Folder'
    : TITLES[activeView] || 'Secret To-Do';

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button className="btn-icon" onClick={toggleSidebar} title="Menu">
          <Menu size={18} />
        </button>
        <div>
          <div className="header-title">
            {activeFolderId && activeView === 'folder' && folder?.icon
              ? <span style={{ marginRight: '7px' }}>{folder.icon}</span> : null}
            {title}
          </div>
          {activeView === 'planner' && <div className="header-sub">{today}</div>}
        </div>
      </div>

      <div className="header-actions">
        {/* Quick add button */}
        <button
          className="btn btn-secondary"
          style={{ padding: '7px 12px', gap: '5px' }}
          onClick={() => setQuickAddOpen(true)}
          title="Quick add (N)"
        >
          <Zap size={14} />
          <span className="hidden-mobile" style={{ fontSize: '12px' }}>Quick</span>
        </button>
        <button className="btn btn-primary" onClick={() => setAddTaskModal(true)}>
          <Plus size={15} />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
