import { useState, useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PinLock({ onUnlock }) {
  const [input, setInput]   = useState('');
  const [error, setError]   = useState(false);
  const [shake, setShake]   = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked]     = useState(false); // locked after 5 failed
  const [lockTimer, setLockTimer] = useState(0);
  const timerRef = useRef(null);

  const storedPin = localStorage.getItem('app_pin') || '0000';

  // Lockout countdown
  useEffect(() => {
    if (locked && lockTimer > 0) {
      timerRef.current = setInterval(() => {
        setLockTimer(t => {
          if (t <= 1) { clearInterval(timerRef.current); setLocked(false); setAttempts(0); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [locked]);

  const press = (k) => {
    if (locked) return;
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
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setError(true);
          setShake(true);
          setTimeout(() => { setShake(false); setInput(''); setError(false); }, 700);
          if (newAttempts >= 5) {
            setLocked(true);
            setLockTimer(30); // 30 second lockout
          }
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
  }, [input, locked]);

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
        <img src="/secret-to-do/logo.png" alt="SToDo"
          style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover',
            margin: '0 auto 16px', display: 'block',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            animation: 'float 3s ease-in-out infinite' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
          SToDo
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
          {locked ? `🔒 Too many attempts. Wait ${lockTimer}s` : 'Enter your PIN to continue'}
        </div>
      </div>

      {/* Dots */}
      <div style={{
        display: 'flex', gap: '16px',
        animation: shake ? 'pinShake 0.5s ease' : 'none',
      }}>
        <style>{`
          @keyframes pinShake {
            0%,100%{transform:translateX(0)}
            20%{transform:translateX(-10px)}
            40%{transform:translateX(10px)}
            60%{transform:translateX(-7px)}
            80%{transform:translateX(7px)}
          }
        `}</style>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 16, height: 16,
            borderRadius: '50%',
            background: i < input.length
              ? (error ? 'var(--red)' : 'var(--accent)')
              : 'var(--border-default)',
            transition: 'all 150ms cubic-bezier(0.16,1,0.3,1)',
            transform: i < input.length ? 'scale(1.25)' : 'scale(1)',
            boxShadow: i < input.length && !error ? '0 0 12px var(--accent-glow)' : 'none',
          }} />
        ))}
      </div>

      {error && attempts < 5 && (
        <div style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 500, marginTop: '-20px' }}>
          Incorrect PIN · {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} left
        </div>
      )}

      {/* Keypad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 76px)', gap: '12px' }}>
        {KEYS.map((k, i) => (
          <button
            key={i}
            onClick={() => press(k)}
            disabled={k === '' || locked}
            style={{
              width: 76, height: 76,
              borderRadius: '50%',
              border: k === '⌫' ? '1px solid var(--border-default)' : k === '' ? 'none' : '1px solid var(--border-subtle)',
              background: k === '' ? 'none' : k === '⌫' ? 'var(--bg-overlay)' : 'var(--bg-elevated)',
              color: k === '⌫' ? 'var(--text-secondary)' : 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              fontSize: k === '⌫' ? '22px' : '24px',
              fontWeight: 600,
              cursor: k === '' || locked ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 120ms',
              boxShadow: k !== '' && k !== '⌫' ? 'var(--shadow-sm)' : 'none',
              opacity: locked ? 0.4 : 1,
            }}
            onMouseDown={e => { if (k && !locked) e.currentTarget.style.transform = 'scale(0.90)'; }}
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
