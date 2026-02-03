/**
 * ENTIDAD DE DOMINIO - ConsultationData
 * Esta entidad encapsula las reglas de negocio centrales para consultas médicas
 */

export interface VitalSigns {
  height: string;
  weight: string;
  bloodPressure: { systolic: string; diastolic: string };
  temperature: string;
  heartRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
}

export interface MentalExam {
  descripcionInspeccion: string;
  apariencia: string;
  actitud: string;
  conciencia: string;
  orientacion: string;
  atencion: string;
  lenguaje: string;
  afecto: string;
  sensopercepcion: string;
  memoria: string;
  pensamientoPrincipal: string;
  pensamientoDetalles: string;
}

export interface Medication {
  id: number;
  name: string;
  presentation: string;
  substance: string;
  prescription: string;
}

export type Temporality = 'acute' | 'chronic' | 'subacute';

export class ConsultationData {
  constructor(
    public noteType: string,
    public date: string,
    public patientOffice: string,
    public currentCondition: string,
    public vitalSigns: VitalSigns,
    public physicalExamination: string,
    public labResults: string,
    public diagnosis: string,
    public temporality: Temporality,
    public medications: Medication[],
    public additionalInstructions: string,
    public labOrders: string,
    public nextAppointment: { time: string; date: string },
    public mentalExam: MentalExam,
    
    // Campos específicos por tipo de consulta
    public specialtyFields: Record<string, any> = {}
  ) {
    this.validateRequired();
    this.validateVitalSigns();
  }

  private validateRequired(): void {
    if (!this.noteType) throw new Error('El tipo de nota es obligatorio');
    if (!this.date) throw new Error('La fecha es obligatoria');
    if (!this.currentCondition.trim()) throw new Error('La condición actual es obligatoria');
  }

  private validateVitalSigns(): void {
    const { bloodPressure } = this.vitalSigns;
    if (bloodPressure?.systolic && bloodPressure?.diastolic) {
      const systolic = parseInt(bloodPressure?.systolic);
      const diastolic = parseInt(bloodPressure?.diastolic);
      
      if (systolic <= diastolic) {
        throw new Error('La presión sistólica debe ser mayor que la diastólica');
      }
    }
  }

  public addMedication(medication: Medication): void {
    if (this.medications.find(m => m.id === medication.id)) {
      throw new Error('La medicación ya está agregada');
    }
    this.medications.push(medication);
  }

  public removeMedication(medicationId: number): void {
    this.medications = this.medications.filter(m => m.id !== medicationId);
  }

  public hasRequiredFields(): boolean {
    return !!(this.noteType && this.date && this.currentCondition.trim());
  }

  public static createEmpty(): ConsultationData {
    return new ConsultationData(
      '',
      new Date().toISOString().split('T')[0],
      '',
      '',
      {
        height: '',
        weight: '',
        bloodPressure: { systolic: '', diastolic: '' },
        temperature: '',
        heartRate: '',
        respiratoryRate: '',
        oxygenSaturation: ''
      },
      '',
      '',
      '',
      'chronic',
      [],
      '',
      '',
      { time: '', date: '' },
      {
        descripcionInspeccion: '',
        apariencia: '',
        actitud: '',
        conciencia: '',
        orientacion: '',
        atencion: '',
        lenguaje: '',
        afecto: '',
        sensopercepcion: '',
        memoria: '',
        pensamientoPrincipal: '',
        pensamientoDetalles: ''
      }
    );
  }
}