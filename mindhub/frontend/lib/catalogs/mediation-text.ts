// src/lib/catalogs/medication-texts.ts

export const DOSAGE_TEMPLATES = [
  // Tabletas/cápsulas
  "1 tableta cada 8 horas",
  "1 tableta cada 12 horas",
  "1 tableta cada 24 horas",
  "2 tabletas cada 8 horas",
  "2 tabletas cada 12 horas",

  "1 cápsula cada 8 horas",
  "1 cápsula cada 12 horas",
  "1 cápsula cada 24 horas",
  "2 cápsulas cada 8 horas",
  "2 cápsulas cada 12 horas",

  // Gotas
  "10 gotas cada 8 horas",
  "10 gotas cada 12 horas",
  "20 gotas cada 8 horas",
  "20 gotas cada 12 horas",

  // Jarabe
  "5 ml cada 8 horas",
  "5 ml cada 12 horas",
  "10 ml cada 8 horas",
  "10 ml cada 12 horas",

  // Inhalador
  "2 disparos cada 8 horas",
  "2 disparos cada 12 horas",
  "1 disparo cada 6 horas",

  // Aplicación tópica
  "Aplicar capa delgada cada 12 horas",
  "Aplicar cada 24 horas",
  "Aplicar 3 veces al día",
];

export const ROUTE_TEMPLATES = [
  "Vía oral",
  "Sublingual",
  "Intramuscular",
  "Intravenosa",
  "Subcutánea",
  "Tópica",
  "Oftálmica",
  "Ótica",
  "Nasal",
  "Rectal",
  "Vaginal",
  "Inhalatoria",
];

export const DURATION_TEMPLATES = [
  "por 3 días",
  "por 5 días",
  "por 7 días",
  "por 10 días",
  "por 14 días",
  "por 1 mes",
  "hasta terminar",
];

export const PRN_TEMPLATES = [
  "si dolor",
  "si fiebre",
  "si náusea",
  "si ansiedad",
  "si insomnio",
  "si crisis",
];

export const MEAL_TEMPLATES = [
  "con alimentos",
  "antes de alimentos",
  "después de alimentos",
  "en ayuno",
  "por la noche",
];

export const EXTRA_INSTRUCTIONS = [
  "No manejar maquinaria",
  "Evitar alcohol",
  "Tomar con abundante agua",
  "No suspender abruptamente",
  "Agitar antes de usar",
];

export const MEDICATION_TEXT_CATALOG = {
  dosage: DOSAGE_TEMPLATES,
  route: ROUTE_TEMPLATES,
  duration: DURATION_TEMPLATES,
  prn: PRN_TEMPLATES,
  meal: MEAL_TEMPLATES,
  extra: EXTRA_INSTRUCTIONS,
};
