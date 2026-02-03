import React, { useMemo, useState } from "react";

type EvalOption = { id: string | number; name: string };

export function EvaluationsMultiSelect({
  evaluationCatalog,
  selected,
  onChange,
  disabled,
}: {
  evaluationCatalog: EvalOption[] | undefined;
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");

  const options = evaluationCatalog ?? [];

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const add = (value: string) => {
    if (disabled) return;
    if (!value) return;
    if (selectedSet.has(value)) return;
    onChange([...selected, value]);
  };

  const remove = (value: string) => {
    if (disabled) return;
    onChange(selected.filter(v => v !== value));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="w-full">
      {/* Chips */}
      <div className="mb-2 flex flex-wrap gap-2">
        {selected.length === 0 ? (
          <span className="text-sm text-gray-500">No hay evaluaciones seleccionadas</span>
        ) : (
          selected.map(val => (
            <span
              key={val}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm"
            >
              {val}
              <button
                type="button"
                onClick={() => remove(val)}
                className="text-gray-500 hover:text-gray-800"
                aria-label={`Quitar ${val}`}
                disabled={disabled}
              >
                ✕
              </button>
            </span>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar evaluación..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          disabled={disabled}
        />

        <button
          type="button"
          onClick={clearAll}
          className="px-3 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={disabled || selected.length === 0}
        >
          Limpiar
        </button>
      </div>

      {/* Dropdown list */}
      <div className="border border-gray-300 rounded-md overflow-hidden">
        <div className="max-h-48 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">Sin resultados</div>
          ) : (
            filteredOptions.map(opt => {
              const isSelected = selectedSet.has(opt.name);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => add(opt.name)}
                  disabled={disabled || isSelected}
                  className={[
                    "w-full text-left px-3 py-2 text-sm",
                    "hover:bg-gray-50",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    isSelected ? "bg-gray-50" : "bg-white",
                  ].join(" ")}
                >
                  <span className="flex items-center justify-between">
                    <span>{opt.name}</span>
                    {isSelected ? <span className="text-gray-500">Seleccionado</span> : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Seleccionadas: {selected.length}
      </p>
    </div>
  );
}