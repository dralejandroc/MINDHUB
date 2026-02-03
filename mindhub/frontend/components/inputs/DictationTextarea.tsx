'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline';

type Props = {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  lang?: string; // 'es-MX'
};

function getSpeechRecognitionCtor(): any | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function DictationTextarea({
  label,
  value, 
  onChange,
  placeholder,
  rows = 4,
  className = '',
  disabled,
  lang = 'es-MX',
}: Props) {
  const recognitionCtor = useMemo(() => getSpeechRecognitionCtor(), []);
  const recognitionRef = useRef<any>(null);

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ✅ refs para evitar recrear recognition cuando cambia value/onChange
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Estado deseado (lo que el usuario quiere)
  const shouldListenRef = useRef(false);
  const isStartingRef = useRef(false);

  // Texto base al iniciar un “segmento”
  const baseRef = useRef<string>('');
  // Dictado confirmado acumulado del segmento
  const committedRef = useRef<string>('');
  // Dictado en vivo (interim)
  const interimRef = useRef<string>('');

  // helper: aplicar valor al textarea sin romper
  const applyText = (next: string) => {
    onChangeRef.current(next);

    const el = textareaRef.current;
    if (el && document.activeElement === el) {
      requestAnimationFrame(() => {
        const pos = next.length;
        el.setSelectionRange(pos, pos);
      });
    }
  };

  useEffect(() => {
    setIsSupported(!!recognitionCtor);
    if (!recognitionCtor) return;

    const rec = new recognitionCtor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;   // aun así puede cortar por silencio
    rec.maxAlternatives = 1;

    const safeStart = () => {
      if (!shouldListenRef.current) return;
      if (isStartingRef.current) return;

      isStartingRef.current = true;

      try {
        // 👇 IMPORTANTE:
        // en cada (re)inicio, toma el valor ACTUAL como base
        // y limpia buffers del “segmento” para que no se duplique
        baseRef.current = valueRef.current || '';
        committedRef.current = '';
        interimRef.current = '';

        rec.start();
      } catch {
        // start puede fallar si ya está iniciando
      } finally {
        setTimeout(() => { isStartingRef.current = false; }, 300);
      }
    };

    rec.onstart = () => {
      setError(null);
      setIsListening(true);
    };

    rec.onend = () => {
      setIsListening(false);

      // Si se cortó y el usuario aún quiere dictar -> reinicia
      if (shouldListenRef.current) {
        // ✅ TIP: si había interim y se cortó, lo “commit” para no perderlo
        if (interimRef.current.trim()) {
          committedRef.current = (committedRef.current + ' ' + interimRef.current).trim();
          interimRef.current = '';
          const next = [baseRef.current, committedRef.current].filter(Boolean).join(' ').replace(/\s+/g, ' ');
          applyText(next);
        }

        setTimeout(() => safeStart(), 600);
      }
    };

    rec.onerror = (e: any) => {
      setError(e?.error || 'speech_error');
      setIsListening(false);

      if (shouldListenRef.current && (e?.error === 'no-speech' || e?.error === 'aborted')) {
        setTimeout(() => safeStart(), 600);
      } else {
        shouldListenRef.current = false;
      }
    };

    rec.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = (res[0]?.transcript || '').trim();
        if (!transcript) continue;

        if (res.isFinal) finalText += (finalText ? ' ' : '') + transcript;
        else interimText += (interimText ? ' ' : '') + transcript;
      }

      // ✅ AQUI SE APLICAN LOS COMANDOS DE VOZ
      // if (finalText) finalText = applyVoiceCommands(finalText);
      // if (interimText) interimText = applyVoiceCommands(interimText);

      if (finalText) {
        committedRef.current = (committedRef.current + ' ' + finalText).trim();
        interimRef.current = '';
      } else {
        interimRef.current = interimText;
      }

      const base = baseRef.current;
      const committed = committedRef.current;
      const interim = interimRef.current;

     const nextRaw = [base, committed, interim].filter(Boolean).join(' ');

      // ✅ aplicar comandos al texto completo
      const withCommands = applyVoiceCommands(nextRaw);

      const next = withCommands
        .replace(/[ \t]+/g, ' ')
        .replace(/[ \t]*\n[ \t]*/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trimStart();

      applyText(next);

    };


    recognitionRef.current = rec;

    return () => {
      try {
        shouldListenRef.current = false;
        rec.onresult = null;
        rec.onend = null;
        rec.onerror = null;
        rec.stop();
      } catch {}
    };
  }, [recognitionCtor, lang]); // ✅ ya NO depende de value/onChange

  const start = () => {
    if (disabled || !recognitionRef.current) return;
    setError(null);
    shouldListenRef.current = true;

    // preparar base del primer segmento
    baseRef.current = valueRef.current || '';
    committedRef.current = '';
    interimRef.current = '';

    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      // si ya estaba arrancando, onend->restart lo acomoda
    }
  };

  const stop = () => {
    shouldListenRef.current = false;
    setIsListening(false);

    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {}
  };

  const toggle = () => {
    if (!isSupported) return;
    if (isListening) stop();
    else start();
  };

  function applyVoiceCommands(raw: string) {
    let t = raw;

    t = t.replace(/[ \t]+/g, ' ').trim();

    t = t
      .replace(/\b(siguiente linea|siguiente línea|nueva linea|nueva línea|salto de linea|salto de línea)\b/gi, '\n')
      .replace(/\b(nuevo parrafo|nuevo párrafo)\b/gi, '\n\n');

    
    t = t
      .replace(/\b(punto y coma)\b/gi, ';')
      .replace(/\b(dos puntos)\b/gi, ':')
      .replace(/\b(coma)\b/gi, ',')
      .replace(/\b(punto)\b/gi, '.')
      .replace(/\b(puntos suspensivos|tres puntos)\b/gi, '...');

    
    t = t
      .replace(/\b(abrir interrogacion|abrir interrogación)\b/gi, '¿')
      .replace(/\b(cerrar interrogacion|cerrar interrogación|signo de interrogacion|signo de interrogación)\b/gi, '?')
      .replace(/\b(abrir exclamacion|abrir exclamación)\b/gi, '¡')
      .replace(/\b(cerrar exclamacion|cerrar exclamación|signo de exclamacion|signo de exclamación)\b/gi, '!');

    t = t.replace(/[ \t]+([,.;:!?])/g, '$1');

    t = t.replace(/([,.;:!?])([a-záéíóúüñ0-9])/gi, '$1 $2');

    t = t
      .replace(/[ \t]*\n[ \t]*/g, '\n')
      .replace(/\n{3,}/g, '\n\n');

    return t;
  }


  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-900 mb-2">{label}</label>}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />

        <button
          type="button"
          onClick={toggle}
          disabled={!isSupported || disabled}
          title={!isSupported ? 'Dictado no soportado en este navegador' : (isListening ? 'Detener dictado' : 'Dictar')}
          className={`absolute right-2 top-2 h-9 w-9 flex items-center justify-center rounded-md border
            ${!isSupported || disabled ? 'opacity-40 cursor-not-allowed border-gray-200' : 'border-gray-200 hover:bg-gray-50'}
            ${isListening ? 'bg-red-50 border-red-200' : 'bg-white'}
          `}
        >
          {isListening ? (
            <StopIcon className="h-5 w-5 text-red-600" />
          ) : (
            <MicrophoneIcon className="h-5 w-5 text-gray-700" />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600">
          {error === 'not-allowed'
            ? 'Permiso de micrófono denegado.'
            : error === 'no-speech'
              ? 'No se detectó voz.'
              : error === 'audio-capture'
                ? 'No se detectó micrófono.'
                : `Error de dictado: ${error}`}
        </p>
      )}

      {!isSupported && (
        <p className="mt-2 text-xs text-gray-500">
          Dictado por voz disponible en Chrome/Edge. (Safari/Firefox puede no soportarlo)
        </p>
      )}
    </div>
  );
}
