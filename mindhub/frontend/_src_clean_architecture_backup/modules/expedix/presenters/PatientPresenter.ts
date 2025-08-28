/**
 * PatientPresenter
 * Transforms domain entities into UI-friendly view models
 */

import { Patient } from '../entities/Patient';
import { MedicalRecord } from '../entities/MedicalRecord';
import { format, differenceInYears, isToday, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface PatientViewModel {
  id: string;
  displayName: string;
  fullName: string;
  medicalRecordNumber: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  status: {
    isActive: boolean;
    label: string;
    color: string;
  };
  riskLevel: {
    level: 'low' | 'medium' | 'high';
    label: string;
    color: string;
  };
  metadata: {
    hasAllergies: boolean;
    hasChronicConditions: boolean;
    isMinor: boolean;
    allergiesCount: number;
    conditionsCount: number;
    medicationsCount: number;
  };
  contact: {
    primaryPhone: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
  lastVisit: {
    date: string;
    timeAgo: string;
    wasRecent: boolean;
  } | null;
  tags: string[];
  category: {
    value: string;
    label: string;
    color: string;
  };
}

export interface MedicalRecordViewModel {
  patient: PatientViewModel;
  summary: {
    totalVisits: number;
    recentVisits: number;
    daysSinceLastVisit: number | null;
    needsFollowUp: boolean;
  };
  riskFactors: {
    overall: 'low' | 'medium' | 'high';
    cardiovascular: 'low' | 'medium' | 'high';
    diabetes: 'low' | 'medium' | 'high';
    mental: 'low' | 'medium' | 'high';
    riskScore: number;
  } | null;
  alerts: {
    hasHighRiskVitals: boolean;
    hasDrugInteractions: boolean;
    isOverdue: boolean;
    flags: string[];
  };
  timeline: {
    type: 'consultation' | 'medication' | 'diagnosis';
    title: string;
    date: string;
    description: string;
  }[];
}

export class PatientPresenter {
  /**
   * Transform patient entity to view model
   */
  static toViewModel(patient: Patient, lastVisitDate?: Date): PatientViewModel {
    const age = patient.getAge();
    const riskLevel = patient.getRiskLevel();
    
    return {
      id: patient.id,
      displayName: patient.getDisplayName(),
      fullName: patient.getFullName(),
      medicalRecordNumber: patient.medicalRecordNumber,
      age: age !== null ? `${age} años` : 'No especificada',
      gender: this.getGenderLabel(patient.gender),
      phone: this.formatPhone(patient.phone),
      email: patient.email || 'No especificado',
      address: this.formatAddress(patient),
      status: {
        isActive: patient.isActive,
        label: patient.isActive ? 'Activo' : 'Inactivo',
        color: patient.isActive ? 'green' : 'gray'
      },
      riskLevel: {
        level: riskLevel,
        label: this.getRiskLevelLabel(riskLevel),
        color: this.getRiskLevelColor(riskLevel)
      },
      metadata: {
        hasAllergies: patient.hasAllergies(),
        hasChronicConditions: patient.hasChronicConditions(),
        isMinor: patient.isMinor(),
        allergiesCount: patient.allergies.length,
        conditionsCount: patient.chronicConditions.length,
        medicationsCount: patient.currentMedications.length
      },
      contact: {
        primaryPhone: this.formatPhone(patient.phone),
        emergencyContact: patient.emergencyContact?.name || 'No especificado',
        emergencyPhone: this.formatPhone(patient.emergencyContact?.phone)
      },
      lastVisit: lastVisitDate ? {
        date: format(lastVisitDate, 'dd MMM yyyy', { locale: es }),
        timeAgo: formatDistanceToNow(lastVisitDate, { locale: es, addSuffix: true }),
        wasRecent: differenceInYears(new Date(), lastVisitDate) < 1
      } : null,
      tags: patient.tags,
      category: {
        value: patient.patientCategory,
        label: this.getCategoryLabel(patient.patientCategory),
        color: this.getCategoryColor(patient.patientCategory)
      }
    };
  }

  /**
   * Transform medical record to comprehensive view model
   */
  static toMedicalRecordViewModel(medicalRecord: MedicalRecord): MedicalRecordViewModel {
    const patientViewModel = this.toViewModel(medicalRecord.patient, medicalRecord.lastVisitDate);
    
    return {
      patient: patientViewModel,
      summary: {
        totalVisits: medicalRecord.totalVisits,
        recentVisits: medicalRecord.getRecentConsultations().length,
        daysSinceLastVisit: medicalRecord.getDaysSinceLastVisit(),
        needsFollowUp: medicalRecord.needsFollowUp()
      },
      riskFactors: medicalRecord.riskFactors ? {
        overall: medicalRecord.riskFactors.overall,
        cardiovascular: medicalRecord.riskFactors.cardiovascular,
        diabetes: medicalRecord.riskFactors.diabetes,
        mental: medicalRecord.riskFactors.mental,
        riskScore: medicalRecord.calculateRiskScore()
      } : null,
      alerts: {
        hasHighRiskVitals: false, // TODO: Implement based on recent consultations
        hasDrugInteractions: medicalRecord.hasPotentialDrugInteractions(),
        isOverdue: medicalRecord.needsFollowUp(),
        flags: medicalRecord.alertFlags
      },
      timeline: this.buildTimeline(medicalRecord)
    };
  }

  /**
   * Transform multiple patients for list view
   */
  static toListViewModel(
    patients: Patient[],
    lastVisitDates?: Map<string, Date>
  ): PatientViewModel[] {
    return patients.map(patient => 
      this.toViewModel(patient, lastVisitDates?.get(patient.id))
    );
  }

  /**
   * Get gender label
   */
  private static getGenderLabel(gender?: string): string {
    const labels: Record<string, string> = {
      'masculino': 'Masculino',
      'femenino': 'Femenino',
      'otro': 'Otro',
      'no_especificado': 'No especificado'
    };
    return labels[gender || ''] || 'No especificado';
  }

  /**
   * Get risk level label
   */
  private static getRiskLevelLabel(level: 'low' | 'medium' | 'high'): string {
    const labels: Record<string, string> = {
      'low': 'Bajo riesgo',
      'medium': 'Riesgo moderado',
      'high': 'Alto riesgo'
    };
    return labels[level];
  }

  /**
   * Get risk level color
   */
  private static getRiskLevelColor(level: 'low' | 'medium' | 'high'): string {
    const colors: Record<string, string> = {
      'low': 'green',
      'medium': 'yellow',
      'high': 'red'
    };
    return colors[level];
  }

  /**
   * Get category label
   */
  private static getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'primera_vez': 'Primera vez',
      'subsecuente': 'Subsecuente',
      'seguimiento': 'Seguimiento',
      'urgencia': 'Urgencia'
    };
    return labels[category] || category;
  }

  /**
   * Get category color
   */
  private static getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'primera_vez': 'blue',
      'subsecuente': 'green',
      'seguimiento': 'purple',
      'urgencia': 'red'
    };
    return colors[category] || 'gray';
  }

  /**
   * Format phone number for display
   */
  private static formatPhone(phone?: string): string {
    if (!phone) return 'No especificado';
    
    // Remove country code for display
    if (phone.startsWith('+52')) {
      const cleaned = phone.substring(3);
      if (cleaned.length === 10) {
        return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
      }
    }
    
    return phone;
  }

  /**
   * Format address for display
   */
  private static formatAddress(patient: Patient): string {
    const parts = [
      patient.address,
      patient.city,
      patient.state,
      patient.postalCode
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'No especificada';
  }

  /**
   * Build timeline for medical record
   */
  private static buildTimeline(medicalRecord: MedicalRecord): MedicalRecordViewModel['timeline'] {
    const timeline: MedicalRecordViewModel['timeline'] = [];
    
    // Add consultations to timeline
    medicalRecord.getRecentConsultations(5).forEach(consultation => {
      timeline.push({
        type: 'consultation',
        title: `Consulta ${consultation.consultationType}`,
        date: format(consultation.consultationDate, 'dd MMM yyyy', { locale: es }),
        description: consultation.chiefComplaint || consultation.diagnosis || 'Consulta médica'
      });
    });

    // Add medication history
    const medications = medicalRecord.getAllPrescribedMedications();
    medications.slice(0, 3).forEach(med => {
      timeline.push({
        type: 'medication',
        title: `Medicamento: ${med.name}`,
        date: format(med.lastPrescribed, 'dd MMM yyyy', { locale: es }),
        description: `Prescrito ${med.frequency} vez(es)`
      });
    });

    // Add diagnoses
    const diagnoses = medicalRecord.getMostCommonDiagnoses();
    diagnoses.slice(0, 2).forEach(diagnosis => {
      timeline.push({
        type: 'diagnosis',
        title: `Diagnóstico: ${diagnosis.diagnosis}`,
        date: 'Historial',
        description: `Registrado ${diagnosis.frequency} vez(es)`
      });
    });

    // Sort by date (most recent first)
    return timeline
      .sort((a, b) => {
        if (a.date === 'Historial') return 1;
        if (b.date === 'Historial') return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 10); // Limit to 10 items
  }

  /**
   * Calculate dashboard statistics
   */
  static calculateDashboardStats(patients: PatientViewModel[]): {
    total: number;
    active: number;
    inactive: number;
    highRisk: number;
    withAllergies: number;
    minors: number;
    recentVisits: number;
  } {
    return {
      total: patients.length,
      active: patients.filter(p => p.status.isActive).length,
      inactive: patients.filter(p => !p.status.isActive).length,
      highRisk: patients.filter(p => p.riskLevel.level === 'high').length,
      withAllergies: patients.filter(p => p.metadata.hasAllergies).length,
      minors: patients.filter(p => p.metadata.isMinor).length,
      recentVisits: patients.filter(p => p.lastVisit?.wasRecent).length
    };
  }

  /**
   * Filter patients by search query
   */
  static filterBySearch(patients: PatientViewModel[], query: string): PatientViewModel[] {
    if (!query.trim()) return patients;
    
    const searchTerm = query.toLowerCase().trim();
    
    return patients.filter(patient => 
      patient.displayName.toLowerCase().includes(searchTerm) ||
      patient.fullName.toLowerCase().includes(searchTerm) ||
      patient.medicalRecordNumber.toLowerCase().includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm) ||
      patient.phone.includes(searchTerm) ||
      patient.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Group patients by category
   */
  static groupByCategory(patients: PatientViewModel[]): Map<string, PatientViewModel[]> {
    const grouped = new Map<string, PatientViewModel[]>();
    
    patients.forEach(patient => {
      const category = patient.category.label;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(patient);
    });
    
    return grouped;
  }

  /**
   * Sort patients by different criteria
   */
  static sortPatients(
    patients: PatientViewModel[], 
    sortBy: 'name' | 'date' | 'risk' | 'category'
  ): PatientViewModel[] {
    return [...patients].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        
        case 'date':
          if (!a.lastVisit && !b.lastVisit) return 0;
          if (!a.lastVisit) return 1;
          if (!b.lastVisit) return -1;
          return new Date(b.lastVisit.date).getTime() - new Date(a.lastVisit.date).getTime();
        
        case 'risk':
          const riskOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return riskOrder[b.riskLevel.level] - riskOrder[a.riskLevel.level];
        
        case 'category':
          return a.category.label.localeCompare(b.category.label);
        
        default:
          return 0;
      }
    });
  }
}