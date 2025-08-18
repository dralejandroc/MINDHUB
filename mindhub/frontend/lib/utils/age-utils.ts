/**
 * Age-based utilities for FormX template selection
 * Integrates with Dr. Alejandro Contreras age-based formularios
 */

export type AgeGroup = 'child' | 'adolescent' | 'adult' | 'mature_adult';

export interface AgeGroupConfig {
  id: AgeGroup;
  name: string;
  ageRange: string;
  minAge: number;
  maxAge: number;
  description: string;
}

export const AGE_GROUPS: AgeGroupConfig[] = [
  {
    id: 'child',
    name: 'Niño',
    ageRange: '5-11 años',
    minAge: 5,
    maxAge: 11,
    description: 'Formulario específico para niños de 5 a 11 años'
  },
  {
    id: 'adolescent', 
    name: 'Adolescente',
    ageRange: '12-17 años',
    minAge: 12,
    maxAge: 17,
    description: 'Formulario específico para adolescentes de 12 a 17 años'
  },
  {
    id: 'adult',
    name: 'Adulto',
    ageRange: '18-60 años', 
    minAge: 18,
    maxAge: 60,
    description: 'Formulario específico para adultos de 18 a 60 años'
  },
  {
    id: 'mature_adult',
    name: 'Adulto Maduro',
    ageRange: '61+ años',
    minAge: 61,
    maxAge: 120,
    description: 'Formulario específico para adultos mayores de 61 años en adelante'
  }
];

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Determine age group based on age
 */
export function getAgeGroup(age: number): AgeGroupConfig {
  for (const ageGroup of AGE_GROUPS) {
    if (age >= ageGroup.minAge && age <= ageGroup.maxAge) {
      return ageGroup;
    }
  }
  
  // Default to adult if age doesn't fit standard ranges
  return AGE_GROUPS.find(ag => ag.id === 'adult')!;
}

/**
 * Get age group from date of birth
 */
export function getAgeGroupFromBirthDate(dateOfBirth: string | Date): AgeGroupConfig {
  const age = calculateAge(dateOfBirth);
  return getAgeGroup(age);
}

/**
 * Get appropriate template ID based on age group
 */
export function getTemplateIdForAgeGroup(ageGroup: AgeGroup): string {
  return `psychiatric-${ageGroup}`;
}

/**
 * Validate if age is appropriate for a specific age group
 */
export function validateAgeForGroup(age: number, ageGroup: AgeGroup): boolean {
  const config = AGE_GROUPS.find(ag => ag.id === ageGroup);
  if (!config) return false;
  
  return age >= config.minAge && age <= config.maxAge;
}