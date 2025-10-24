// === Date helpers (sin librerías) ===
export const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const startOfWeekMonday = (d: Date) => {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0=Dom,1=Lun,...6=Sáb
  const diff = (day === 0 ? -6 : 1 - day); // mover hasta lunes
  date.setDate(date.getDate() + diff);
  date.setHours(0,0,0,0);
  return date;
};

const endOfWeekSunday = (d: Date) => {
  const start = startOfWeekMonday(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23,59,59,999);
  return end;
};

const startOfMonth = (d: Date) => {
  const s = new Date(d.getFullYear(), d.getMonth(), 1);
  s.setHours(0,0,0,0);
  return s;
};

const endOfMonth = (d: Date) => {
  const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  e.setHours(23,59,59,999);
  return e;
};

const addDays = (d: Date, days: number) => {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
};

// Rango “de cuadrícula” de mes: inicia lunes antes o igual al día 1,
// termina domingo después o igual al último día del mes.
const getMonthGridRange = (d: Date) => {
  const som = startOfMonth(d);
  const eom = endOfMonth(d);
  const gridStart = startOfWeekMonday(som);
  const gridEnd = endOfWeekSunday(eom);
  return { start: gridStart, end: gridEnd };
};

type ViewType = 'week' | 'day' | 'month' | 'clinic-global' | 'reception';

export const getVisibleRange = (date: Date, view: ViewType) => {
  switch (view) {
    case 'day': {
      const s = new Date(date); s.setHours(0,0,0,0);
      const e = new Date(date); e.setHours(23,59,59,999);
      return { start: s, end: e };
    }
    case 'week': {
      return {
        start: startOfWeekMonday(date),
        end: endOfWeekSunday(date),
      };
    }
    case 'month': {
      // Si prefieres sólo el mes natural, usa startOfMonth/endOfMonth(date)
      return getMonthGridRange(date);
    }
    // Para vistas de clínica/recepción usa el mismo rango que la vista base actual.
    case 'clinic-global':
    case 'reception': {
      // Aquí puedes decidir si sigues la semana o el día.
      // Por default: semana.
      return {
        start: startOfWeekMonday(date),
        end: endOfWeekSunday(date),
      };
    }
    default: {
      return {
        start: startOfWeekMonday(date),
        end: endOfWeekSunday(date),
      };
    }
  }
};
