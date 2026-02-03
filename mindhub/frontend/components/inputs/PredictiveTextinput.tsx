'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suggestions: string[];
  maxItems?: number;      // cuántas muestras como “top”
  maxHeightPx?: number;   // alto máximo del dropdown
  disabled?: boolean;
};

function normalize(s: string) {
  return s.toLowerCase().trim();
}

export function PredictiveComboInput({
  label,
  value,
  onChange,
  placeholder,
  suggestions,
  maxItems = 30,
  maxHeightPx = 220,
  disabled,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const filtered = useMemo(() => {
    const q = normalize(value);
    const base = q
      ? suggestions.filter((s) => normalize(s).includes(q))
      : suggestions;

    // quitar duplicados conservando orden
    const uniq: string[] = [];
    const seen = new Set<string>();
    for (const s of base) {
      const key = normalize(s);
      if (!seen.has(key)) {
        seen.add(key);
        uniq.push(s);
      }
      if (uniq.length >= maxItems) break;
    }
    return uniq;
  }, [suggestions, value, maxItems]);

  // click afuera
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const commit = (text: string) => {
    onChange(text);
    setOpen(false);
    setActiveIndex(-1);
    // mantener foco
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }

    if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!filtered.length) return;
      setOpen(true);
      setActiveIndex((prev) => (prev + 1) % filtered.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!filtered.length) return;
      setOpen(true);
      setActiveIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
      return;
    }

    if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault();
        commit(filtered[activeIndex]);
      }
    }
  };

  return (
    <div ref={wrapRef} className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      <div className="relative">
        <input
          ref={inputRef}
          disabled={disabled}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        />

        {/* Dropdown */}
        {open && filtered.length > 0 && (
          <div
            className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-auto"
            style={{ maxHeight: `${maxHeightPx}px` }}
          >
            {filtered.map((item, idx) => (
              <button
                key={`${item}-${idx}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // evita blur antes del click
                onClick={() => commit(item)}
                className={[
                  "w-full text-left px-3 py-2 text-sm",
                  idx === activeIndex ? "bg-gray-100" : "bg-white",
                  "hover:bg-gray-100"
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
