import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { Plus, Flame, Trash2, X } from 'lucide-react';

function AddHabitModal({ onClose }) {
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const save = async () => {
    if (!name.trim()) return;
    await db.habits.add({ name:name.trim(), time, streak_count:0, last_completed_date:null });
    onClose();
  };
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-panel" style={{ maxWidth:'380px' }}>
        <div className="modal-header">
          <span className="modal-title">New Habit</span>
          <button className="btn-icon" onClick={onClose}><X size={17}/></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label className="field-label">Habit name *</label>
            <input className="input" placeholder="e.g. Morning run, Read 20 pages…" value={name}
              onChange={e=>setName(e.target.value)} autoFocus onKeyDown={e=>e.key==='Enter'&&save()}
              style={{ fontSize:'15px', padding:'11px 14px' }}/>
          </div>
          <div className="field">
            <label className="field-label">Reminder time (optional)</label>
            <input type="time" className="input" value={time} onChange={e=>setTime(e.target.value)}/>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" style={{flex:1}} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{flex:2}} onClick={save}>Add Habit</button>
        </div>
      </div>
    </div>
  );
}

export default function HabitsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const habits = useLiveQuery(() => db.habits.toArray(), []);
  const today  = new Date().toISOString().split('T')[0];

  const toggle = async (h) => {
    const doneToday = h.last_completed_date===today;
    if (doneToday) {
      await db.habits.update(h.id, { last_completed_date:null, streak_count:Math.max(0,(h.streak_count||1)-1) });
    } else {
      const yest=new Date(); yest.setDate(yest.getDate()-1);
      const yStr=yest.toISOString().split('T')[0];
      const cont=h.last_completed_date===yStr;
      await db.habits.update(h.id, { last_completed_date:today, streak_count:cont?(h.streak_count||0)+1:1 });
    }
  };

  const del = async (id) => { if(confirm('Delete this habit?')) await db.habits.delete(id); };
  const todayDone = (habits||[]).filter(h=>h.last_completed_date===today).length;
  const total = (habits||[]).length;

  return (
    <div className="page">
      {showAdd && <AddHabitModal onClose={()=>setShowAdd(false)}/>}

      {/* Header card */}
      <div className="overview-card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'20px', letterSpacing:'-0.5px' }}>
            Daily Habits
          </div>
          <div style={{ fontSize:'13px', opacity:0.65, marginTop:'4px' }}>
            {todayDone}/{total} done today
          </div>
          {total>0 && (
            <div className="progress-track" style={{ marginTop:'12px', width:'160px', height:'3px', background:'rgba(255,255,255,0.15)' }}>
              <div className="progress-fill" style={{ width:`${total?Math.round(todayDone/total*100):0}%`, background:'rgba(255,255,255,0.80)' }}/>
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>
          <Plus size={15}/> New Habit
        </button>
      </div>

      {habits&&habits.length>0 ? (
        <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {habits.map(h => {
            const doneToday = h.last_completed_date===today;
            return (
              <div key={h.id} className="habit-card" style={{ opacity:doneToday?0.72:1 }}>
                <button
                  className={`checkbox ${doneToday?'checked':''}`}
                  style={{ width:22, height:22, borderRadius:7, borderColor: doneToday ? 'var(--green)' : 'rgba(255,255,255,0.25)', flexShrink:0 }}
                  onClick={()=>toggle(h)}
                >
                  {doneToday&&(
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'14px', fontWeight:500, textDecoration:doneToday?'line-through':'none', opacity:doneToday?0.6:1 }}>
                    {h.name}
                  </div>
                  {h.time&&<div style={{ fontSize:'11px', opacity:0.55, marginTop:'2px' }}>⏰ {h.time}</div>}
                </div>

                <div style={{ textAlign:'center', marginRight:'4px' }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:'16px', fontWeight:800 }}>
                    {h.streak_count>0?'🔥':'—'} {h.streak_count||0}
                  </div>
                  <div style={{ fontSize:'10px', opacity:0.5 }}>streak</div>
                </div>

                <button className="btn-icon" style={{ padding:'4px', color:'rgba(255,255,255,0.35)' }}
                  onMouseEnter={e=>{e.currentTarget.style.color='var(--red)';e.currentTarget.style.background='var(--red-dim)';}}
                  onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,255,255,0.35)';e.currentTarget.style.background='none';}}
                  onClick={()=>del(h.id)}>
                  <Trash2 size={13}/>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Flame size={44} className="empty-icon"/>
          <div className="empty-title">No habits yet</div>
          <div className="empty-desc">Build daily habits and track your streaks</div>
        </div>
      )}
    </div>
  );
}
