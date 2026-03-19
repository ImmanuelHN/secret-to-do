import { useState, useRef } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';

/**
 * VoiceInput button — uses Web Speech API
 * onResult(text) called with transcript when speech detected.
 */
export default function VoiceInput({ onResult, disabled = false }) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const recognizerRef = useRef(null);

  if (!supported) return null;

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart  = () => setListening(true);
    rec.onend    = () => setListening(false);
    rec.onerror  = () => setListening(false);
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript || '';
      if (text) onResult(text.trim());
    };

    recognizerRef.current = rec;
    rec.start();
  };

  const stop = () => {
    recognizerRef.current?.stop();
    setListening(false);
  };

  const toggle = () => listening ? stop() : start();

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      title={listening ? 'Stop recording' : 'Voice input'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34,
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${listening ? 'var(--red)' : 'var(--border-default)'}`,
        background: listening ? 'var(--red-dim)' : 'var(--bg-overlay)',
        color: listening ? 'var(--red)' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 150ms',
        flexShrink: 0,
        animation: listening ? 'pulse 1.2s ease-in-out infinite' : 'none',
      }}
    >
      {listening ? <MicOff size={15} /> : <Mic size={15} />}
    </button>
  );
}
