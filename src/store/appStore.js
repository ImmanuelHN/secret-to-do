import { create } from 'zustand';
import { getSetting, setSetting } from '../db/database';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (theme === 'aesthetic') {
    document.body.style.background = 'linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 33%, #ffe4e6 66%, #fff1c1 100%)';
    document.body.style.backgroundAttachment = 'fixed';
  } else {
    document.body.style.background = '';
    document.body.style.backgroundAttachment = '';
  }
}

export const useAppStore = create((set, get) => ({
  theme: 'dark',
  setTheme: async (theme) => {
    set({ theme });
    applyTheme(theme);
    await setSetting('theme', theme);
  },

  activeView: 'planner',
  setActiveView: (view) => set({ activeView: view, activeFolderId: null }),

  sidebarOpen: false,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar:  () => set({ sidebarOpen: false }),

  activeFolderId: null,
  setActiveFolderId: (id) => set({ activeFolderId: id, activeView: 'folder' }),

  // Modals
  addTaskModal:    false, setAddTaskModal:   v => set({ addTaskModal: v }),
  addFolderModal:  false, setAddFolderModal: v => set({ addFolderModal: v }),
  editTaskId:      null,  setEditTaskId:     id => set({ editTaskId: id }),
  editFolderId:    null,  setEditFolderId:   id => set({ editFolderId: id }),
  pinSetupModal:   null,  setPinSetupModal:  v => set({ pinSetupModal: v }), // 'set'|'change'|'disable'|null

  // Bulk
  selectedTaskIds: new Set(),
  toggleSelectTask: (id) => set(s => {
    const next = new Set(s.selectedTaskIds);
    next.has(id) ? next.delete(id) : next.add(id);
    return { selectedTaskIds: next };
  }),
  clearSelection:  () => set({ selectedTaskIds: new Set() }),
  selectAllTasks:  (ids) => set({ selectedTaskIds: new Set(ids) }),

  // Sort
  taskSort: 'default',
  setTaskSort: v => set({ taskSort: v }),

  folders: [],
  setFolders: folders => set({ folders }),

  // Quick-add
  quickAddOpen: false,
  setQuickAddOpen: v => set({ quickAddOpen: v }),

  // PIN state
  pinEnabled: false,
  setPinEnabled: v => set({ pinEnabled: v }),

  init: async () => {
    const theme      = await getSetting('theme') || 'dark';
    const sort       = await getSetting('task_sort') || 'default';
    const pinEnabled = await getSetting('pin_enabled') || false;
    applyTheme(theme);
    set({ theme, taskSort: sort, pinEnabled });
  },
}));
