import { useEffect, useState } from 'react';
import { useAppStore } from './store/appStore';
import { db } from './db/database';
import { NotifService } from './services/notificationService';
import { initReminders } from './services/reminderService';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PinLock from './components/PinLock';
import AddTaskModal from './components/AddTaskModal';
import AddFolderModal from './components/AddFolderModal';
import EditTaskModal from './components/EditTaskModal';
import EditFolderModal from './components/EditFolderModal';
import QuickAdd from './components/QuickAdd';
import PredictivePlan from './components/PredictivePlan';
import PlannerPage from './pages/PlannerPage';
import DashboardPage from './pages/DashboardPage';
import ChartsPage from './pages/ChartsPage';
import SearchPage from './pages/SearchPage';
import HabitsPage from './pages/HabitsPage';
import VaultPage from './pages/VaultPage';
import SettingsPage from './pages/SettingsPage';
import FolderPage from './pages/FolderPage';

function PageRouter() {
  const { activeView, activeFolderId } = useAppStore();
  if (activeFolderId && activeView === 'folder') return <FolderPage />;
  switch (activeView) {
    case 'planner':   return <PlannerPage />;
    case 'dashboard': return <DashboardPage />;
    case 'charts':    return <ChartsPage />;
    case 'search':    return <SearchPage />;
    case 'habits':    return <HabitsPage />;
    case 'vault':     return <VaultPage />;
    case 'settings':  return <SettingsPage />;
    default:          return <PlannerPage />;
  }
}

export default function App() {
  const {
    init,
    addTaskModal,    setAddTaskModal,
    addFolderModal,  setAddFolderModal,
    editTaskId,      setEditTaskId,
    editFolderId,    setEditFolderId,
    quickAddOpen,
  } = useAppStore();

  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinRequired, setPinRequired] = useState(false);

  useEffect(() => {
    init();
    // Check if PIN is enabled
    const storedPin = localStorage.getItem('app_pin');
    if (storedPin && storedPin.length === 4 && /^\d{4}$/.test(storedPin)) {
      setPinRequired(true);
    } else {
      setPinUnlocked(true);
    }
    // Init reminders
    if (NotifService.permission === 'granted') {
      db.tasks.toArray().then(tasks => initReminders(tasks));
    }
  }, []);

  // Show PIN screen if needed
  if (pinRequired && !pinUnlocked) {
    return <PinLock onUnlock={() => setPinUnlocked(true)} />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="app-content">
          <PageRouter />
        </main>
      </div>

      {/* Modals */}
      {addTaskModal   && <AddTaskModal   onClose={() => setAddTaskModal(false)} />}
      {addFolderModal && <AddFolderModal onClose={() => setAddFolderModal(false)} />}
      {editTaskId     && <EditTaskModal  taskId={editTaskId}    onClose={() => setEditTaskId(null)} />}
      {editFolderId   && <EditFolderModal folderId={editFolderId} onClose={() => setEditFolderId(null)} />}

      {/* Floating UI */}
      <QuickAdd />
      <PredictivePlan />
    </div>
  );
}
