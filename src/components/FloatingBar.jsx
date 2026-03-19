import { useState, useRef, useEffect } from 'react';
import { Plus, Zap, Mic, MicOff, Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { db } from '../db/database';
import { parseVoiceToTask } from '../services/aiTaskParser';

export default function FloatingBar() {
  const { setAddTaskModal, setQuickAddOpen, activeFolderId, folders } = useAppStore();

  const [micState, setMicState] = useState('idle'); // idle | listening | parsing | done
  const [pulseRing, setPulseRing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [toast, setToast] = useState(null);
  const recognizerRef = useRef(null);

  const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const startListening = () => {
    if (!supported) { alert('Voice input is not supported on this browser. Please use Chrome.'); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart = () => { setMicState('listening'); setPulseRing(true); };
    rec.onend   = () => { setPulseRing(false); };
    rec.onerror = () => { setMicState('idle'); setPulseRing(false); showToast('❌ Could not hear you. Try again.', 'error'); };

    rec.onresult = async (e) => {
      const text = e.results[0]?.[0]?.transcript || '';
      if (!text) { setMicState('idle'); return; }
      setTranscript(text);
      setMicState('parsing');

      try {
        const task = await parseVoiceToTask(text);
        await db.tasks.add({
          ...task,
          folder_id:  activeFolderId ?? (folders[0]?.id ?? null),
          completed:  0,
          recur:      null,
          created_at: new Date().toISOString(),
        });
        setMicState('done');
        showToast(`✅ "${task.title}" added!`, 'success');
        setTimeout(() => setMicState('idle'), 1800);
      } catch {
        setMicState('idle');
        showToast('❌ Failed to save task', 'error');
      }
    };

    recognizerRef.current = rec;
    rec.start();
  };

  const stopListening = () => {
    recognizerRef.current?.stop();
    setMicState('idle');
    setPulseRing(false);
  };

  const handleMicPress = () => {
    if (micState === 'listening') stopListening();
    else if (micState === 'idle') startListening();
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const micColor = micState === 'listening' ? '#ef4444'
    : micState === 'parsing'   ? 'var(--yellow)'
    : micState === 'done'      ? 'var(--green)'
    : 'var(--text-primary)';

  const micBg = micState === 'listening' ? 'rgba(239,68,68,0.15)'
    : micState === 'parsing'  ? 'var(--yellow-dim)'
    : micState === 'done'     ? 'var(--green-dim)'
    : 'transparent';

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '110px', left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'success' ? 'var(--green-dim)' : 'var(--red-dim)',
          color: toast.type === 'success' ? 'var(--green)' : 'var(--red)',
          border: `1px solid ${toast.type === 'success' ? 'var(--green)' : 'var(--red)'}40`,
          borderRadius: 'var(--radius-xl)',
          padding: '10px 18px',
          fontSize: '13px', fontWeight: 600,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 95,
          animation: 'fadeUp 220ms var(--ease-out) both',
          whiteSpace: 'nowrap',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Transcript preview while listening */}
      {(micState === 'listening' || micState === 'parsing') && transcript && (
        <div style={{
          position: 'fixed', bottom: '110px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 18px',
          fontSize: '12px', color: 'var(--text-secondary)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 95, maxWidth: '320px', textAlign: 'center',
        }}>
          {micState === 'parsing' && <Loader2 size={12} style={{ display: 'inline', marginRight: '6px', animation: 'spin 1s linear infinite' }} />}
          "{transcript}"
        </div>
      )}

      {/* Listening pulse ring */}
      {pulseRing && (
        <div style={{
          position: 'fixed', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
          width: '180px', height: '64px',
          borderRadius: '999px',
          border: '2px solid var(--red)',
          zIndex: 88,
          animation: 'barPulse 1.2s ease-in-out infinite',
          pointerEvents: 'none',
        }}>
          <style>{`
            @keyframes barPulse {
              0%,100%{opacity:0.6;transform:translateX(-50%) scale(1);}
              50%{opacity:0.2;transform:translateX(-50%) scale(1.08);}
            }
            @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          `}</style>
        </div>
      )}

      {/* ── The Cylinder Bar ────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 10px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-strong)',
        borderRadius: '999px',
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(12px)',
      }}>

        {/* Quick Add */}
        <button
          onClick={() => setQuickAddOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 16px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--bg-overlay)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px', fontWeight: 500,
            transition: 'all 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-overlay)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <Zap size={15} />
          <span>Quick</span>
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border-default)', flexShrink: 0 }} />

        {/* AI Mic Button — center, larger */}
        <button
          onClick={handleMicPress}
          disabled={micState === 'parsing'}
          title={micState === 'listening' ? 'Tap to stop' : 'Speak to add task (AI)'}
          style={{
            width: 52, height: 52,
            borderRadius: '50%',
            border: 'none',
            background: micState === 'listening'
              ? 'var(--red)'
              : micState === 'done'
              ? 'var(--green)'
              : 'var(--accent)',
            color: 'white',
            cursor: micState === 'parsing' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: micState === 'listening'
              ? '0 0 0 4px rgba(239,68,68,0.3), 0 4px 20px rgba(239,68,68,0.4)'
              : '0 4px 20px var(--accent-glow)',
            transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
            transform: micState === 'listening' ? 'scale(1.05)' : 'scale(1)',
            position: 'relative',
          }}
        >
          {micState === 'parsing' ? <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
           : micState === 'done'  ? <span style={{ fontSize: '20px' }}>✓</span>
           : micState === 'listening' ? <MicOff size={22} />
           : <Mic size={22} />}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'var(--border-default)', flexShrink: 0 }} />

        {/* New Task */}
        <button
          onClick={() => setAddTaskModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 16px',
            borderRadius: '999px',
            border: 'none',
            background: 'var(--accent)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '13px', fontWeight: 600,
            transition: 'all 150ms',
            boxShadow: '0 2px 8px var(--accent-glow)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Plus size={15} />
          <span>New Task</span>
        </button>
      </div>
    </>
  );
}
