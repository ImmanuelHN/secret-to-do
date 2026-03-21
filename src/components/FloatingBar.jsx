import { useState, useRef, useEffect } from 'react';
import { Plus, Zap, Mic, MicOff, Loader2, X, Check, Calendar, Clock, Repeat, Flag } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { db } from '../db/database';
import { parseVoiceToTask } from '../services/aiTaskParser';

/* ── Task Confirmation Modal ────────────────────────────────── */
function TaskConfirmModal({ parsed, transcript, onConfirm, onCancel }) {
  const { folders } = useAppStore();
  const [form, setForm] = useState({
    title:         parsed.title || '',
    due_date:      parsed.due_date || '',
    reminder_time: parsed.reminder_time || '',
    priority:      parsed.priority || 'medium',
    energy_level:  parsed.energy_level || 'medium',
    description:   parsed.description || '',
    recur:         parsed.recur || null,
    folder_id:     folders[0]?.id || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal-panel">
        <div className="modal-header">
          <div>
            <div className="modal-title">Confirm Task</div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              AI parsed: "{transcript.slice(0, 50)}{transcript.length > 50 ? '…' : ''}"
            </div>
          </div>
          <button className="btn-icon" onClick={onCancel}><X size={17} /></button>
        </div>

        <div className="modal-body">
          {/* Confidence hint */}
          {parsed.confidence === 'low' && (
            <div style={{ padding: '10px 12px', background: 'var(--yellow-dim)', color: 'var(--yellow)', borderRadius: 'var(--radius-sm)', fontSize: '12px', display: 'flex', gap: '7px', alignItems: 'center' }}>
              ⚠️ Some details were inferred — please review before saving
            </div>
          )}

          {/* Title */}
          <div className="field">
            <label className="field-label">Task title</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)}
              style={{ fontSize: '15px', fontWeight: 600, padding: '11px 14px' }} autoFocus />
          </div>

          {/* Folder */}
          <div className="field">
            <label className="field-label">Folder</label>
            <select className="input" value={form.folder_id} onChange={e => set('folder_id', e.target.value)}>
              <option value="">No folder</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.icon} {f.name}</option>)}
            </select>
          </div>

          {/* Date + Time */}
          <div className="field-row">
            <div className="field">
              <label className="field-label"><Calendar size={12} /> Due date</label>
              <input type="date" className="input" value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
                style={{ borderColor: !form.due_date ? 'var(--yellow)' : undefined }} />
            </div>
            <div className="field">
              <label className="field-label"><Clock size={12} /> Time</label>
              <input type="time" className="input" value={form.reminder_time}
                onChange={e => set('reminder_time', e.target.value)}
                style={{ borderColor: !form.reminder_time ? 'var(--yellow)' : undefined }} />
            </div>
          </div>

          {/* Priority */}
          <div className="field">
            <label className="field-label"><Flag size={12} /> Priority</label>
            <div className="seg-control">
              {['low','medium','high'].map(p => (
                <button key={p} className={`seg-btn ${form.priority === p ? `active-${p}` : ''}`}
                  onClick={() => set('priority', p)}>{p}</button>
              ))}
            </div>
          </div>

          {/* Recur */}
          {form.recur && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-dim)', border: '1px solid var(--border-focus)' }}>
              <Repeat size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500 }}>
                Repeats {form.recur}
              </span>
              <button onClick={() => set('recur', null)} className="btn-icon" style={{ padding: '2px', marginLeft: 'auto' }}>
                <X size={13} />
              </button>
            </div>
          )}

          {/* Description */}
          {form.description && (
            <div className="field">
              <label className="field-label">Notes</label>
              <textarea className="input" rows={2} value={form.description}
                onChange={e => set('description', e.target.value)} />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ flex: 2, gap: '7px' }}
            onClick={() => onConfirm(form)}
            disabled={!form.title.trim()}
          >
            <Check size={15} /> Save Task
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main FloatingBar ───────────────────────────────────────── */
export default function FloatingBar() {
  const { setAddTaskModal, setQuickAddOpen, activeFolderId, folders } = useAppStore();

  const [micState, setMicState] = useState('idle'); // idle|listening|parsing|confirm|done
  const [pulseRing, setPulseRing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedTask, setParsedTask] = useState(null);
  const [toast, setToast] = useState(null);
  const recognizerRef = useRef(null);

  const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const startListening = () => {
    if (!supported) { alert('Voice input not supported. Use Chrome.'); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart  = () => { setMicState('listening'); setPulseRing(true); };
    rec.onend    = () => { setPulseRing(false); };
    rec.onerror  = () => {
      setMicState('idle'); setPulseRing(false);
      showToast('❌ Could not hear you. Try again.', 'error');
    };

    rec.onresult = async (e) => {
      const text = e.results[0]?.[0]?.transcript || '';
      if (!text) { setMicState('idle'); return; }
      setTranscript(text);
      setMicState('parsing');

      try {
        const task = await parseVoiceToTask(text);
        setParsedTask(task);

        // Always show confirmation screen — user must verify
        setMicState('confirm');
      } catch {
        setMicState('idle');
        showToast('❌ AI parsing failed. Try again.', 'error');
      }
    };

    recognizerRef.current = rec;
    rec.start();
  };

  const stopListening = () => {
    recognizerRef.current?.stop();
    setMicState('idle'); setPulseRing(false);
  };

  const handleMicPress = () => {
    if (micState === 'listening') stopListening();
    else if (micState === 'idle') startListening();
  };

  const handleConfirm = async (formData) => {
    try {
      await db.tasks.add({
        title:         formData.title.trim(),
        description:   formData.description || '',
        folder_id:     formData.folder_id ? Number(formData.folder_id) : (activeFolderId ?? null),
        priority:      formData.priority,
        energy_level:  formData.energy_level,
        due_date:      formData.due_date || '',
        reminder_time: formData.reminder_time || '',
        completed:     0,
        recur:         formData.recur || null,
        created_at:    new Date().toISOString(),
      });
      setMicState('done');
      setParsedTask(null);
      showToast(`✅ "${formData.title}" saved!`, 'success');
      setTimeout(() => setMicState('idle'), 1500);
    } catch {
      showToast('❌ Failed to save task', 'error');
      setMicState('idle');
      setParsedTask(null);
    }
  };

  const handleCancelConfirm = () => {
    setMicState('idle');
    setParsedTask(null);
    setTranscript('');
  };

  const micBg    = micState === 'listening' ? 'var(--red)' : micState === 'done' ? 'var(--green)' : 'var(--accent)';
  const micGlow  = micState === 'listening' ? '0 0 0 4px rgba(239,68,68,0.3)' : '0 4px 20px var(--accent-glow)';

  return (
    <>
      {/* Task confirmation modal */}
      {micState === 'confirm' && parsedTask && (
        <TaskConfirmModal
          parsed={parsedTask}
          transcript={transcript}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '110px', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? 'var(--green-dim)' : 'var(--red-dim)',
          color: toast.type === 'success' ? 'var(--green)' : 'var(--red)',
          border: `1px solid ${toast.type === 'success' ? 'var(--green)' : 'var(--red)'}40`,
          borderRadius: 'var(--radius-xl)', padding: '10px 18px',
          fontSize: '13px', fontWeight: 600, boxShadow: 'var(--shadow-lg)',
          zIndex: 95, animation: 'fadeUp 220ms var(--ease-out) both', whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Transcript preview */}
      {(micState === 'listening' || micState === 'parsing') && (
        <div style={{
          position: 'fixed', bottom: '110px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)', padding: '10px 18px',
          fontSize: '12px', color: 'var(--text-secondary)',
          boxShadow: 'var(--shadow-md)', zIndex: 95, maxWidth: '320px', textAlign: 'center',
        }}>
          {micState === 'parsing'
            ? <><Loader2 size={12} style={{ display:'inline', marginRight:'6px', animation:'spin 1s linear infinite' }} />AI is parsing…</>
            : transcript
            ? `"${transcript}"`
            : '🎤 Listening…'
          }
        </div>
      )}

      {/* Pulse ring */}
      {pulseRing && (
        <div style={{
          position: 'fixed', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
          width: '200px', height: '72px', borderRadius: '999px',
          border: '2px solid var(--red)', zIndex: 88,
          animation: 'barPulse 1.2s ease-in-out infinite', pointerEvents: 'none',
        }}>
          <style>{`
            @keyframes barPulse{0%,100%{opacity:.6;transform:translateX(-50%) scale(1);}50%{opacity:.2;transform:translateX(-50%) scale(1.08);}}
            @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
          `}</style>
        </div>
      )}

      {/* ── Floating cylinder bar ── */}
      <div style={{
        position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 90, display: 'flex', alignItems: 'center', gap: '4px',
        padding: '8px 10px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
        borderRadius: '999px',
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(12px)',
      }}>
        {/* Quick */}
        <button onClick={() => setQuickAddOpen(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '10px 16px', borderRadius: '999px',
          border: 'none', background: 'var(--bg-overlay)',
          color: 'var(--text-secondary)', cursor: 'pointer',
          fontSize: '13px', fontWeight: 500, transition: 'all 150ms',
        }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--accent-dim)'; e.currentTarget.style.color='var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--bg-overlay)'; e.currentTarget.style.color='var(--text-secondary)'; }}
        >
          <Zap size={15} /><span>Quick</span>
        </button>

        <div style={{ width: 1, height: 28, background: 'var(--border-default)', flexShrink: 0 }} />

        {/* Mic */}
        <button
          onClick={handleMicPress}
          disabled={micState === 'parsing'}
          title={micState === 'listening' ? 'Tap to stop' : 'Speak to add task (AI)'}
          style={{
            width: 52, height: 52, borderRadius: '50%',
            border: 'none', background: micBg, color: 'white',
            cursor: micState === 'parsing' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: micGlow,
            transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
            transform: micState === 'listening' ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          {micState === 'parsing' ? <Loader2 size={22} style={{ animation:'spin 1s linear infinite' }} />
           : micState === 'done'  ? <span style={{ fontSize:'20px' }}>✓</span>
           : micState === 'listening' ? <MicOff size={22} />
           : <Mic size={22} />}
        </button>

        <div style={{ width: 1, height: 28, background: 'var(--border-default)', flexShrink: 0 }} />

        {/* New Task */}
        <button onClick={() => setAddTaskModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '10px 16px', borderRadius: '999px',
          border: 'none', background: 'var(--accent)', color: 'white',
          cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          transition: 'all 150ms', boxShadow: '0 2px 8px var(--accent-glow)',
        }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--accent-hover)'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--accent)'; e.currentTarget.style.transform='translateY(0)'; }}
        >
          <Plus size={15} /><span>New Task</span>
        </button>
      </div>
    </>
  );
}
