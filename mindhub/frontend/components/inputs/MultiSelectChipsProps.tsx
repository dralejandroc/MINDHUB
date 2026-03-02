import React, { useEffect, useMemo, useRef, useState } from "react";

type Option = { value: string; label: string };

type MultiSelectChipsProps = {
  label?: string;
  options: Option[];
  value: string[]; // array de strings
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function MultiSelectChips({
  label,
  options,
  value,
  onChange,
  placeholder = "Selecciona...",
  disabled,
}: MultiSelectChipsProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedSet = useMemo(() => new Set(value ?? []), [value]);

  const selectedOptions = useMemo(() => {
    // mantener orden según options
    const byValue = new Map(options.map((o) => [o.value, o]));
    return (value ?? []).map((v) => byValue.get(v)).filter(Boolean) as Option[];
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  const toggleValue = (v: string) => {
    if (disabled) return;
    const exists = selectedSet.has(v);
    const next = exists ? value.filter((x) => x !== v) : [...value, v];
    // asegurar únicos
    onChange(Array.from(new Set(next)));
  };

  const removeValue = (v: string) => {
    if (disabled) return;
    onChange((value ?? []).filter((x) => x !== v));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Cerrar al click afuera
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Focus search al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
    }
  }, [open]);

  return (
    <div ref={rootRef} className="w-full">
      {label ? (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      ) : null}

      {/* Control */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className={[
          "w-full rounded-md border px-3 py-2 text-left",
          "flex items-center justify-between gap-3",
          disabled ? "bg-gray-100 text-gray-400" : "bg-white",
          open ? "border-primary-500 ring-2 ring-primary-100" : "border-gray-300",
        ].join(" ")}
      >
        <div className="min-w-0 flex-1">
          {selectedOptions.length === 0 ? (
            <span className="text-sm text-gray-400">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                >
                  {opt.label}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeValue(opt.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        removeValue(opt.value);
                      }
                    }}
                    className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-gray-200"
                    aria-label={`Quitar ${opt.label}`}
                    title="Quitar"
                  >
                    ✕
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedOptions.length > 0 && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
              title="Limpiar"
            >
              Limpiar
            </span>
          ) : null}
          <span className="text-gray-500">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Dropdown */}
      {open && !disabled ? (
        <div className="mt-2 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Buscar..."
            />
          </div>

          <div className="max-h-60 overflow-auto p-2">
            {filtered.length === 0 ? (
              <div className="px-2 py-3 text-sm text-gray-500">
                Sin resultados
              </div>
            ) : (
              <ul className="space-y-1">
                {filtered.map((opt) => {
                  const isSelected = selectedSet.has(opt.value);
                  return (
                    <li key={opt.value}>
                      <button
                        type="button"
                        onClick={() => toggleValue(opt.value)}
                        className={[
                          "w-full flex items-center justify-between rounded-md px-2 py-2 text-sm",
                          isSelected
                            ? "bg-primary-50 text-primary-700"
                            : "hover:bg-gray-50 text-gray-700",
                        ].join(" ")}
                      >
                        <span className="truncate">{opt.label}</span>
                        <span className="ml-3">
                          {isSelected ? "✓" : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

