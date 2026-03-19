import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';
import { useState } from 'react';
import { TrendingUp, BarChart2, Calendar, Zap } from 'lucide-react';

/* ── helpers ──────────────────────────────────────────────────── */
function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function getLast4Weeks() {
  return Array.from({ length: 4 }, (_, i) => {
    const end = new Date(); end.setDate(end.getDate() - i * 7);
    const start = new Date(end); start.setDate(start.getDate() - 6);
    return {
      label: `W${4 - i}`,
      start: start.toISOString().split('T')[0],
      end:   end.toISOString().split('T')[0],
    };
  }).reverse();
}

function dayLabel(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

/* ── Bar chart component ──────────────────────────────────────── */
function BarChart({ bars, maxVal, height = 120, colorVar = 'var(--accent)' }) {
  const maxH = maxVal || Math.max(...bars.map(b => b.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: height + 28 }}>
      {bars.map((bar, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            {bar.value > 0 ? bar.value : ''}
          </div>
          <div style={{
            width: '100%',
            height: Math.max(bar.value / maxH * height, bar.value > 0 ? 4 : 2),
            background: bar.active ? colorVar : 'var(--border-default)',
            borderRadius: '4px 4px 0 0',
            transition: 'height 600ms cubic-bezier(0.16,1,0.3,1)',
            position: 'relative',
            minHeight: 2,
          }}>
            {bar.active && (
              <div style={{
                position: 'absolute', inset: 0,
                background: colorVar,
                borderRadius: '4px 4px 0 0',
                opacity: 0.15,
                animation: 'shimmer 2s ease infinite',
              }} />
            )}
          </div>
          <div style={{ fontSize: '10px', color: bar.active ? 'var(--text-secondary)' : 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
            {bar.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Stat row ─────────────────────────────────────────────────── */
function StatRow({ label, value, sub, color = 'var(--accent)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{sub}</div>}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value}</div>
    </div>
  );
}

/* ── Donut chart ──────────────────────────────────────────────── */
function DonutChart({ slices, size = 100 }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 36, cx = size/2, cy = size/2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = slices.map(s => {
    const pct = s.value / total;
    const dash = pct * circ;
    const arc = { ...s, dash, offset: circ - offset };
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {total === 0
        ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
        : arcs.map((arc, i) => (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={arc.color} strokeWidth="10"
              strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="butt"
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 600ms var(--ease-out)' }}
            />
          ))
      }
      <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, fill: 'var(--text-primary)' }}>
        {total > 0 ? `${Math.round(slices[0]?.value / total * 100)}%` : '0%'}
      </text>
    </svg>
  );
}

/* ── Main Page ────────────────────────────────────────────────── */
export default function ChartsPage() {
  const { folders } = useAppStore();
  const [range, setRange] = useState('week'); // 'week' | 'month'

  const allTasks = useLiveQuery(() => db.tasks.toArray(), []);
  const habits   = useLiveQuery(() => db.habits.toArray(), []);

  if (!allTasks) return null;

  const today   = new Date().toISOString().split('T')[0];
  const done    = allTasks.filter(t => t.completed);
  const pending = allTasks.filter(t => !t.completed);

  /* ─ Daily completed counts (last 7 days) ─ */
  const days = getLast7Days();
  const dailyBars = days.map(d => ({
    label: dayLabel(d),
    value: done.filter(t => t.created_at?.startsWith(d)).length,
    active: d === today,
  }));

  /* ─ Weekly bars (last 4 weeks) ─ */
  const weeks = getLast4Weeks();
  const weeklyBars = weeks.map(w => ({
    label: w.label,
    value: done.filter(t => t.created_at && t.created_at.split('T')[0] >= w.start && t.created_at.split('T')[0] <= w.end).length,
    active: w.end === today || (today >= w.start && today <= w.end),
  }));

  /* ─ Priority distribution ─ */
  const hiCount  = pending.filter(t => t.priority === 'high').length;
  const medCount = pending.filter(t => t.priority === 'medium').length;
  const loCount  = pending.filter(t => t.priority === 'low').length;

  /* ─ Completion rate ─ */
  const total = allTasks.length;
  const pct   = total === 0 ? 0 : Math.round(done.length / total * 100);

  /* ─ Best streak from habits ─ */
  const bestStreak = habits?.length ? Math.max(...habits.map(h => h.streak_count || 0)) : 0;
  const totalHabitDays = habits?.reduce((s, h) => s + (h.streak_count || 0), 0) || 0;

  /* ─ Per-folder completion ─ */
  const folderData = folders.map(f => {
    const ft = allTasks.filter(t => t.folder_id === f.id);
    const fd = ft.filter(t => t.completed);
    return { ...f, total: ft.length, done: fd.length, pct: ft.length ? Math.round(fd.length / ft.length * 100) : 0 };
  }).filter(f => f.total > 0).sort((a, b) => b.pct - a.pct);

  /* ─ Energy of pending tasks ─ */
  const energyBars = [
    { label: 'Low',  value: pending.filter(t => t.energy_level === 'low').length,    active: false },
    { label: 'Med',  value: pending.filter(t => t.energy_level === 'medium').length,  active: true  },
    { label: 'High', value: pending.filter(t => t.energy_level === 'high').length,   active: false },
  ];

  return (
    <div className="page">

      {/* ── Overview cards row ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }} className="stagger">
        {/* Completion ring */}
        <div className="stat-card" style={{ alignItems: 'center', flexDirection: 'row', gap: '14px' }}>
          <DonutChart size={88} slices={[
            { value: done.length,    color: 'var(--green)' },
            { value: pending.length, color: 'var(--border-subtle)' },
          ]} />
          <div>
            <div className="stat-value">{pct}%</div>
            <div className="stat-label">complete</div>
            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.6 }}>{done.length}/{total} tasks</div>
          </div>
        </div>

        {/* Streak */}
        <div className="stat-card">
          <div className="stat-icon-wrap">
            <TrendingUp size={16} />
          </div>
          <div className="stat-value">🔥 {bestStreak}</div>
          <div className="stat-label">best streak</div>
          <div style={{ fontSize: '11px', opacity: 0.6 }}>{totalHabitDays} total habit days</div>
        </div>

        {/* Pending */}
        <div className="stat-card">
          <div className="stat-icon-wrap"><BarChart2 size={16} /></div>
          <div className="stat-value">{pending.length}</div>
          <div className="stat-label">pending tasks</div>
        </div>

        {/* Today completed */}
        <div className="stat-card">
          <div className="stat-icon-wrap"><Calendar size={16} /></div>
          <div className="stat-value">{done.filter(t => t.created_at?.startsWith(today)).length}</div>
          <div className="stat-label">done today</div>
        </div>
      </div>

      {/* ── Completion trend chart ─────────────── */}
      <div className="info-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Completion Trend
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['week','month'].map(r => (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                background: range === r ? 'var(--accent-dim)' : 'transparent',
                color: range === r ? 'var(--accent)' : 'var(--text-tertiary)',
                border: `1px solid ${range === r ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
                cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                textTransform: 'capitalize', transition: 'all 140ms',
              }}>{r}</button>
            ))}
          </div>
        </div>
        <BarChart
          bars={range === 'week' ? dailyBars : weeklyBars}
          maxVal={Math.max(...(range === 'week' ? dailyBars : weeklyBars).map(b => b.value), 1)}
          height={100}
          colorVar="var(--accent)"
        />
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px', textAlign: 'center' }}>
          Tasks completed per {range === 'week' ? 'day' : 'week'} (based on creation date)
        </div>
      </div>

      {/* ── Priority distribution ──────────────── */}
      <div className="info-card">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '16px' }}>
          Pending by Priority
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <DonutChart size={96} slices={[
            { value: hiCount,  color: 'var(--red)' },
            { value: medCount, color: 'var(--yellow)' },
            { value: loCount,  color: 'var(--green)' },
          ]} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'High',   count: hiCount,  color: 'var(--red)' },
              { label: 'Medium', count: medCount, color: 'var(--yellow)' },
              { label: 'Low',    count: loCount,  color: 'var(--green)' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: 700, color }}>{count}</div>
                <div style={{ width: 60 }}>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${(count / (pending.length || 1)) * 100}%`, background: color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Energy distribution ────────────────── */}
      <div className="info-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Zap size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Energy Distribution (Pending)
          </span>
        </div>
        <BarChart bars={energyBars} height={80} colorVar="var(--accent)" />
      </div>

      {/* ── Folder leaderboard ─────────────────── */}
      {folderData.length > 0 && (
        <div className="info-card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '16px' }}>
            Folder Leaderboard
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {folderData.map((f, i) => (
              <div key={f.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '13px', color: 'var(--text-tertiary)', width: '16px' }}>
                      {i+1}
                    </span>
                    <span style={{ fontSize: '14px' }}>{f.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{f.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{f.done}/{f.total}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: f.color || 'var(--accent)' }}>
                      {f.pct}%
                    </span>
                  </div>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${f.pct}%`, background: f.color || 'var(--accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Habit stats ────────────────────────── */}
      {habits && habits.length > 0 && (
        <div className="info-card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '14px' }}>
            Habit Streaks
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {habits.sort((a, b) => (b.streak_count || 0) - (a.streak_count || 0)).map((h, i) => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < habits.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{h.name}</div>
                  {h.time && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>⏰ {h.time}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--yellow)' }}>
                    {h.streak_count > 0 ? `🔥 ${h.streak_count}` : '—'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>day streak</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
