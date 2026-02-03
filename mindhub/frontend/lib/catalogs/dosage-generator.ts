// src/lib/catalogs/dosage-generator.ts

const UNITS = ["tableta", "cápsula", "ml", "gotas", "disparos"];
const AMOUNTS: Record<string, number[]> = {
  tableta: [0.5, 1, 2],
  cápsula: [1, 2],
  ml: [2.5, 5, 10],
  gotas: [5, 10, 15, 20],
  disparos: [1, 2],
};
const HOURS = [4, 6, 8, 12, 24];
const TIMES_PER_DAY = [1, 2, 3, 4];

const pluralize = (unit: string, amount: number) => {
  // plural simple
  if (amount === 1) return unit;
  if (unit === "tableta") return "tabletas";
  if (unit === "cápsula") return "cápsulas";
  if (unit === "disparos") return "disparos";
  if (unit === "gota") return "gotas";
  return unit; // ml, gotas ya está plural
};

export function buildDosageSuggestions(extra?: { includePerDay?: boolean }) {
  const out: string[] = [];

  for (const unit of UNITS) {
    const amounts = AMOUNTS[unit] ?? [1];
    for (const amount of amounts) {
      for (const h of HOURS) {
        const u = pluralize(unit, amount);
        out.push(`${amount} ${u} cada ${h} horas`);
      }
    }
  }

  if (extra?.includePerDay) {
    for (const unit of ["tableta", "cápsula"]) {
      const amounts = AMOUNTS[unit] ?? [1];
      for (const amount of amounts) {
        for (const t of TIMES_PER_DAY) {
          const u = pluralize(unit, amount);
          out.push(`${amount} ${u} ${t} vez${t === 1 ? "" : "es"} al día`);
        }
      }
    }
  }

  // quitar duplicados
  return Array.from(new Set(out));
}
