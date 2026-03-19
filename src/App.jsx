import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppStore } from './store/appStore';
import { db, getSetting } from './db/database';
import { NotifService } from './services/notificationService';
import { initReminders } from './services/reminderService';
import { registerSW, onSWMessage } from './services/swService';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import FloatingBar from './components/FloatingBar';
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
    addTaskModal,   setAddTaskModal,
    addFolderModal, setAddFolderModal,
    editTaskId,     setEditTaskId,
    editFolderId,   setEditFolderId,
  } = useAppStore();

  const [pinUnlocked,  setPinUnlocked]  = useState(false);
  const [pinRequired,  setPinRequired]  = useState(false);
  const [showReschedule, setShowReschedule] = useState(null);
  const autoLockTimerRef = useRef(null);

  // ── Auto-lock on inactivity ───────────────────────────────
  const resetAutoLock = useCallback(async () => {
    clearTimeout(autoLockTimerRef.current);
    const pinStored = localStorage.getItem('app_pin');
    if (!pinStored || !pinUnlocked) return;
    const timeoutMin = (await getSetting('pin_timeout')) || 0;
    if (timeoutMin === 0) return;
    autoLockTimerRef.current = setTimeout(() => {
      setPinUnlocked(false);
    }, timeoutMin * 60 * 1000);
  }, [pinUnlocked]);

  useEffect(() => {
    const events = ['mousemove','keydown','touchstart','click','scroll'];
    events.forEach(ev => window.addEventListener(ev, resetAutoLock, { passive: true }));
    return () => events.forEach(ev => window.removeEventListener(ev, resetAutoLock));
  }, [resetAutoLock]);

  useEffect(() => { if (pinUnlocked) resetAutoLock(); }, [pinUnlocked]);

  // ── Init ─────────────────────────────────────────────────
  useEffect(() => {
    init();

    // Check PIN
    const storedPin = localStorage.getItem('app_pin');
    if (storedPin && /^\d{4}$/.test(storedPin)) {
      setPinRequired(true);
    } else {
      setPinUnlocked(true);
    }

    // Register SW
    registerSW();

    // Init reminders
    if (NotifService.permission === 'granted') {
      Promise.all([db.tasks.toArray(), db.habits.toArray()])
        .then(([tasks, habits]) => initReminders(tasks, habits));
    }

    // Listen for SW action messages (done, reschedule)
    onSWMessage(async (msg) => {
      if (msg?.type === 'NOTIF_DONE' && msg.data?.taskId) {
        await db.tasks.update(msg.data.taskId, { completed: 1 });
      }
      if (msg?.type === 'NOTIF_RESCHEDULE') {
        setShowReschedule(msg);
      }
    });
  }, []);

  if (pinRequired && !pinUnlocked) {
    return <PinLock onUnlock={() => { setPinUnlocked(true); resetAutoLock(); }} />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header />
        {/* Extra padding bottom for floating bar */}
        <main className="app-content" style={{ paddingBottom: '90px' }}>
          <PageRouter />
        </main>
      </div>

      {/* Modals */}
      {addTaskModal   && <AddTaskModal   onClose={() => setAddTaskModal(false)} />}
      {addFolderModal && <AddFolderModal onClose={() => setAddFolderModal(false)} />}
      {editTaskId     && <EditTaskModal  taskId={editTaskId}     onClose={() => setEditTaskId(null)} />}
      {editFolderId   && <EditFolderModal folderId={editFolderId} onClose={() => setEditFolderId(null)} />}

      {/* Reschedule modal */}
      {showReschedule && (
        <div className="modal-backdrop" onClick={() => setShowReschedule(null)}>
          <div className="modal-panel" style={{ maxWidth: '340px' }}>
            <div className="modal-header">
              <span className="modal-title">Reschedule</span>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Pick a new time for this reminder:
              </p>
              <input type="time" className="input" id="reschedule-time"
                defaultValue={new Date().toTimeString().slice(0,5)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary flex-1" onClick={() => setShowReschedule(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={async () => {
                const time = document.getElementById('reschedule-time')?.value;
                if (time && showReschedule?.data?.taskId) {
                  await db.tasks.update(showReschedule.data.taskId, { reminder_time: time });
                }
                setShowReschedule(null);
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating UI */}
      <FloatingBar />
      <QuickAdd />
      <PredictivePlan />
    </div>
  );
}
