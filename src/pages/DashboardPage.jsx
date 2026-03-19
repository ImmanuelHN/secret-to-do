import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useAppStore } from '../store/appStore';
import { CheckCircle2, Clock, AlertTriangle, Folder, Zap, TrendingUp } from 'lucide-react';

function StatCard({ icon: Icon, value, label, nth }) {
  return (
    <div className="stat-card" style={{ '--nth': nth }}>
      <div className="stat-icon-wrap">
        <Icon size={16} style={{ opacity:0.85 }} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { folders } = useAppStore();
  const tasks  = useLiveQuery(() => db.tasks.toArray(), []);
  const habits = useLiveQuery(() => db.habits.toArray(), []);

  if (!tasks) return null;

  const today   = new Date().toISOString().split('T')[0];
  const done    = tasks.filter(t=>t.completed);
  const pending = tasks.filter(t=>!t.completed);
  const overdue = pending.filter(t=>t.due_date&&t.due_date<today);
  const pct     = tasks.length===0 ? 0 : Math.round(done.length/tasks.length*100);
  const circ    = 2*Math.PI*36;

  const folderStats = folders.map(f => {
    const ft=tasks.filter(t=>t.folder_id===f.id);
    const fd=ft.filter(t=>t.completed);
    return {...f, total:ft.length, done:fd.length, pct:ft.length?Math.round(fd.length/ft.length*100):0};
  }).filter(f=>f.total>0).sort((a,b)=>b.total-a.total);

  const hi  = pending.filter(t=>t.energy_level==='high').length;
  const med = pending.filter(t=>t.energy_level==='medium').length;
  const lo  = pending.filter(t=>t.energy_level==='low').length;

  return (
    <div className="page">
      {/* Main overview — gradient card */}
      <div className="overview-card" style={{ display:'flex', gap:'24px', alignItems:'center' }}>
        {/* SVG ring */}
        <div style={{ position:'relative', width:88, height:88, flexShrink:0 }}>
          <svg viewBox="0 0 88 88" style={{ transform:'rotate(-90deg)', width:88, height:88 }}>
            <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
            <circle cx="44" cy="44" r="36" fill="none"
              stroke="rgba(255,255,255,0.80)" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ*(1-pct/100)}
              style={{ transition:'stroke-dashoffset 800ms var(--ease-out)' }}
            />
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'22px', letterSpacing:'-1px', lineHeight:1 }}>{pct}%</span>
          </div>
        </div>

        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'15px', marginBottom:'12px', letterSpacing:'-0.3px', opacity:0.9 }}>
            Overall Completion
          </div>
          {[
            { label:'Total tasks', v:tasks.length },
            { label:'Completed',   v:done.length },
            { label:'Pending',     v:pending.length },
            { label:'Overdue',     v:overdue.length },
          ].map(({ label, v }) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0' }}>
              <span style={{ fontSize:'12px', opacity:0.6 }}>{label}</span>
              <span style={{ fontSize:'13px', fontWeight:700 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat grid — each card uses gradient from theme */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }} className="stagger">
        <StatCard icon={CheckCircle2}  value={done.length}    label="Completed" nth={1} />
        <StatCard icon={Clock}         value={pending.length} label="Pending"   nth={2} />
        <StatCard icon={AlertTriangle} value={overdue.length} label="Overdue"   nth={3} />
        <StatCard icon={Folder}        value={folders.length} label="Folders"   nth={4} />
      </div>

      {/* Folder breakdown */}
      {folderStats.length>0 && (
        <div className="info-card">
          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'15px', color:'var(--text-primary)', marginBottom:'18px', letterSpacing:'-0.3px' }}>
            Folder Progress
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {folderStats.map(f => (
              <div key={f.id}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'7px' }}>
                  <span style={{ fontSize:'13px', color:'var(--text-primary)', fontWeight:500, display:'flex', alignItems:'center', gap:'7px' }}>
                    <span>{f.icon}</span>{f.name}
                  </span>
                  <span style={{ fontSize:'11px', color:'var(--text-tertiary)' }}>{f.done}/{f.total} · {f.pct}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width:`${f.pct}%`, background:f.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Energy */}
      {pending.length>0 && (
        <div className="info-card">
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
            <Zap size={14} style={{ color:'var(--accent)' }} />
            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'15px', color:'var(--text-primary)', letterSpacing:'-0.3px' }}>Pending by Energy</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
            {[
              { label:'High', count:hi,  color:'var(--red)',    dim:'var(--red-dim)' },
              { label:'Med',  count:med, color:'var(--yellow)', dim:'var(--yellow-dim)' },
              { label:'Low',  count:lo,  color:'var(--green)',  dim:'var(--green-dim)' },
            ].map(({ label, count, color, dim }) => (
              <div key={label} style={{ textAlign:'center', padding:'14px 8px', borderRadius:'var(--radius-sm)', background:dim }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'26px', fontWeight:800, color, lineHeight:1 }}>{count}</div>
                <div style={{ fontSize:'11px', color:'var(--text-tertiary)', marginTop:'4px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habits */}
      {habits?.length>0 && (
        <div className="info-card">
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
            <TrendingUp size={14} style={{ color:'var(--yellow)' }} />
            <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'15px', color:'var(--text-primary)', letterSpacing:'-0.3px' }}>Habit Streaks</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {habits.map(h => (
              <div key={h.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'13px', color:'var(--text-primary)', fontWeight:500 }}>{h.name}</span>
                <span style={{ fontSize:'13px', fontWeight:700, color:'var(--yellow)' }}>🔥 {h.streak_count||0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
