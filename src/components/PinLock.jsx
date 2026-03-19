import { useState, useEffect, useRef } from 'react';
import { Lock, Delete } from 'lucide-react';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PinLock({ onUnlock }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const storedPin = localStorage.getItem('app_pin') || '0000';

  const press = (k) => {
    if (k === '⌫') { setInput(p => p.slice(0,-1)); setError(false); return; }
    if (k === '') return;
    if (input.length >= 4) return;
    const next = input + k;
    setInput(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === storedPin) {
          onUnlock();
        } else {
          setError(true);
          setShake(true);
          setTimeout(() => { setShake(false); setInput(''); setError(false); }, 700);
        }
      }, 120);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') press(e.key);
      if (e.key === 'Backspace') press('⌫');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [input]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '32px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 4px 20px var(--accent-glow)',
        }}>
          <Lock size={24} color="white" />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          Secret To-Do
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
          Enter your PIN to continue
        </div>
      </div>

      {/* Dots */}
      <div style={{
        display: 'flex', gap: '14px',
        animation: shake ? 'pinShake 0.5s ease' : 'none',
      }}>
        <style>{`
          @keyframes pinShake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-8px)}
            40%{transform:translateX(8px)}
            60%{transform:translateX(-6px)}
            80%{transform:translateX(6px)}
          }
        `}</style>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 14, height: 14,
            borderRadius: '50%',
            background: i < input.length
              ? (error ? 'var(--red)' : 'var(--accent)')
              : 'var(--border-default)',
            transition: 'background 150ms, transform 150ms',
            transform: i < input.length ? 'scale(1.2)' : 'scale(1)',
            boxShadow: i < input.length && !error ? '0 0 8px var(--accent-glow)' : 'none',
          }} />
        ))}
      </div>

      {error && (
        <div style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 500, marginTop: '-20px' }}>
          Incorrect PIN
        </div>
      )}

      {/* Keypad */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 72px)',
        gap: '12px',
      }}>
        {KEYS.map((k, i) => (
          <button
            key={i}
            onClick={() => press(k)}
            disabled={k === ''}
            style={{
              width: 72, height: 72,
              borderRadius: '50%',
              border: k === '⌫'
                ? '1px solid var(--border-default)'
                : k === '' ? 'none' : '1px solid var(--border-subtle)',
              background: k === '' ? 'none'
                : k === '⌫' ? 'var(--bg-overlay)'
                : 'var(--bg-elevated)',
              color: k === '⌫' ? 'var(--text-secondary)' : 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              fontSize: k === '⌫' ? '20px' : '22px',
              fontWeight: 600,
              cursor: k === '' ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 120ms',
              boxShadow: k !== '' && k !== '⌫' ? 'var(--shadow-sm)' : 'none',
            }}
            onMouseDown={e => { if (k) e.currentTarget.style.transform = 'scale(0.92)'; }}
            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
