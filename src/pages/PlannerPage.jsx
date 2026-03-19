import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';
import TaskCard from '../components/TaskCard';
import SortBar from '../components/SortBar';
import BulkActionBar from '../components/BulkActionBar';
import StaleTaskBanner from '../components/StaleTaskBanner';
import { sortTasks } from '../utils/sortTasks';
import { CheckCircle2, Clock, AlertTriangle, CalendarDays, Inbox } from 'lucide-react';

const todayStr    = () => new Date().toISOString().split('T')[0];
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; };
const ENERGY_FILTERS = ['all','low','medium','high'];

function Section({ icon: Icon, label, color, tasks, folders }) {
  if (!tasks.length) return null;
  return (
    <section className="anim-fadeup">
      <div className="section-head">
        <Icon size={13} style={{ color, flexShrink: 0 }} />
        <span className="section-head-title">{label}</span>
        <span className="section-head-count">{tasks.length}</span>
      </div>
      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {tasks.map(t => <TaskCard key={t.id} task={t} folders={folders} />)}
      </div>
    </section>
  );
}

export default function PlannerPage() {
  const { folders, taskSort, selectedTaskIds } = useAppStore();
  const [energyFilter, setEnergyFilter] = useState('all');

  const pending = useLiveQuery(() => db.tasks.where('completed').equals(0).toArray(), []);
  const done    = useLiveQuery(() => db.tasks.where('completed').equals(1).toArray(), []);

  if (!pending) return null;

  const filtered = energyFilter === 'all' ? pending : pending.filter(t => t.energy_level === energyFilter);
  const t = todayStr(), tm = tomorrowStr();
  const applySort = arr => sortTasks(arr, taskSort);

  const overdue  = applySort(filtered.filter(x => x.due_date && x.due_date < t));
  const today    = applySort(filtered.filter(x => x.due_date === t));
  const tomorrow = applySort(filtered.filter(x => x.due_date === tm));
  const upcoming = applySort(filtered.filter(x => x.due_date && x.due_date > tm));
  const noDue    = applySort(filtered.filter(x => !x.due_date));

  const total = pending.length + (done?.length || 0);
  const doneN = done?.length || 0;
  const pct   = total === 0 ? 0 : Math.round(doneN / total * 100);

  return (
    <div className="page">
      {/* Stale task banner — appears if 14+ day old tasks exist */}
      <StaleTaskBanner />

      {/* Progress overview */}
      <div className="overview-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.7px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px' }}>
              TODAY'S PROGRESS
            </div>
            <div style={{ fontSize: '13px', opacity: 0.75 }}>
              {doneN} completed · {pending.length} remaining
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1 }}>{pct}</span>
            <span style={{ fontSize: '18px', fontWeight: 600, opacity: 0.6 }}>%</span>
          </div>
        </div>
        <div className="progress-track" style={{ height: '4px', background: 'rgba(255,255,255,0.12)' }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: 'rgba(255,255,255,0.75)' }} />
        </div>
      </div>

      {/* Energy filter */}
      <div className="filter-bar">
        {ENERGY_FILTERS.map(f => (
          <button key={f} className={`filter-pill ${energyFilter === f ? 'active' : ''}`}
            onClick={() => setEnergyFilter(f)}>
            {f === 'all' ? '⚡ All' : f === 'low' ? '🔋 Low energy' : f === 'medium' ? '⚡ Medium' : '🔥 High energy'}
          </button>
        ))}
      </div>

      <SortBar taskCount={filtered.length} />

      <Section icon={AlertTriangle} label="Overdue"      color="var(--red)"           tasks={overdue}  folders={folders} />
      <Section icon={CheckCircle2}  label="Today"        color="var(--accent)"        tasks={today}    folders={folders} />
      <Section icon={Clock}         label="Tomorrow"     color="var(--yellow)"        tasks={tomorrow} folders={folders} />
      <Section icon={CalendarDays}  label="Upcoming"     color="var(--green)"         tasks={upcoming} folders={folders} />
      <Section icon={Inbox}         label="No Due Date"  color="var(--text-tertiary)" tasks={noDue}    folders={folders} />

      {filtered.length === 0 && (
        <div className="empty-state">
          <CheckCircle2 size={44} className="empty-icon" />
          <div className="empty-title">{energyFilter !== 'all' ? 'No matching tasks' : 'All clear!'}</div>
          <div className="empty-desc">
            {energyFilter !== 'all' ? `No ${energyFilter}-energy tasks pending.` : 'No pending tasks. Hit "New Task" to get started.'}
          </div>
        </div>
      )}

      {selectedTaskIds.size > 0 && <BulkActionBar />}
    </div>
  );
}
