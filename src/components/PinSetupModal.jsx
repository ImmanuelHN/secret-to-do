import { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { setSetting } from '../db/database';

export default function PinSetupModal({ mode = 'set', onClose, onDone }) {
  // mode: 'set' | 'change' | 'disable'
  const [step, setStep]       = useState(mode === 'disable' ? 'verify' : 'new');
  const [newPin, setNewPin]   = useState('');
  const [confirmPin, setConfirm] = useState('');
  const [currentPin, setCurrent] = useState('');
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState('');

  const storedPin = localStorage.getItem('app_pin');

  const handleVerify = () => {
    if (currentPin !== storedPin) { setError('Incorrect current PIN'); return; }
    if (mode === 'disable') {
      localStorage.removeItem('app_pin');
      setSetting('pin_enabled', false);
      onDone?.();
      onClose();
      return;
    }
    setStep('new');
    setError('');
  };

  const handleSet = () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setError('PIN must be exactly 4 digits'); return; }
    if (newPin !== confirmPin) { setError('PINs do not match'); return; }
    localStorage.setItem('app_pin', newPin);
    setSetting('pin_enabled', true);
    onDone?.();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel" style={{ maxWidth: '380px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} style={{ color: 'var(--accent)' }} />
            <span className="modal-title">
              {mode === 'disable' ? 'Disable PIN' : mode === 'change' ? 'Change PIN' : 'Set PIN'}
            </span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={17} /></button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{ padding: '10px 12px', background: 'var(--red-dim)', color: 'var(--red)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {(step === 'verify' || mode === 'change') && step !== 'new' && (
            <div className="field">
              <label className="field-label">Current PIN</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={show ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Enter current PIN"
                  value={currentPin}
                  onChange={e => { setCurrent(e.target.value.replace(/\D/,'')); setError(''); }}
                  style={{ paddingRight: '40px', letterSpacing: '8px', fontSize: '20px', textAlign: 'center' }}
                />
                <button className="btn-icon" onClick={() => setShow(s => !s)}
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: '4px' }}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button className="btn btn-primary" style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }} onClick={handleVerify}>
                Verify
              </button>
            </div>
          )}

          {step === 'new' && (
            <>
              <div className="field">
                <label className="field-label">New PIN (4 digits)</label>
                <input
                  className="input"
                  type={show ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="• • • •"
                  value={newPin}
                  onChange={e => { setNewPin(e.target.value.replace(/\D/,'')); setError(''); }}
                  style={{ letterSpacing: '12px', fontSize: '22px', textAlign: 'center' }}
                  autoFocus
                />
              </div>
              <div className="field">
                <label className="field-label">Confirm PIN</label>
                <input
                  className="input"
                  type={show ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="• • • •"
                  value={confirmPin}
                  onChange={e => { setConfirm(e.target.value.replace(/\D/,'')); setError(''); }}
                  style={{ letterSpacing: '12px', fontSize: '22px', textAlign: 'center' }}
                  onKeyDown={e => e.key === 'Enter' && handleSet()}
                />
              </div>
              <button className="btn-ghost" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}
                onClick={() => setShow(s => !s)}>
                {show ? 'Hide' : 'Show'} PIN
              </button>
            </>
          )}
        </div>

        {step === 'new' && (
          <div className="modal-footer">
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSet}>
              {mode === 'change' ? 'Update PIN' : 'Set PIN'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
