import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '@/i18n/LanguageContext';

// Browser SpeechRecognition typings (vendor-prefixed)
type SR = any;
declare global {
  interface Window {
    SpeechRecognition?: SR;
    webkitSpeechRecognition?: SR;
  }
}

interface Options {
  onResult?: (text: string) => void;
  continuous?: boolean;
}

export function useVoiceInput({ onResult, continuous = false }: Options = {}) {
  const { lang } = useLang();
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(Boolean(Ctor));
  }, []);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return false;
    }
    try { recognitionRef.current?.stop(); } catch { /* noop */ }

    const r = new Ctor();
    r.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    r.interimResults = true;
    r.continuous = continuous;
    r.maxAlternatives = 1;

    let finalText = '';

    r.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const part = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += part + ' ';
        else interim += part;
      }
      const combined = (finalText + interim).trim();
      setTranscript(combined);
      onResult?.(combined);
    };

    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);

    recognitionRef.current = r;
    setTranscript('');
    setIsListening(true);
    try {
      r.start();
      return true;
    } catch {
      setIsListening(false);
      return false;
    }
  }, [lang, continuous, onResult]);

  // Cleanup on unmount
  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* noop */ } }, []);

  return { isListening, transcript, supported, start, stop };
}
