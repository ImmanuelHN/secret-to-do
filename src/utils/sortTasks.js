const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const ENERGY_ORDER   = { high: 0, medium: 1, low: 2 };

export function sortTasks(tasks, mode) {
  const arr = [...tasks];
  switch (mode) {
    case 'priority':
      return arr.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1));
    case 'due_date':
      return arr.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
    case 'energy':
      return arr.sort((a, b) => (ENERGY_ORDER[a.energy_level] ?? 1) - (ENERGY_ORDER[b.energy_level] ?? 1));
    case 'alpha':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return arr;
  }
}
