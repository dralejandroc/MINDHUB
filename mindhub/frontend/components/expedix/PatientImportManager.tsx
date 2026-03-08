'use client';

import { useState, useRef, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  UserGroupIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { expedixApi } from '@/lib/api/expedix-client';

interface PatientImportManagerProps {
  onClose: () => void;
  onImportComplete: (importedCount: number) => void;
}

interface CsvRow {
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string;
  genero: string;
  email: string;
  telefono_celular: string;
  telefono_fijo?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigo_postal?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  contacto_emergencia_parentesco?: string;
  historial_medico?: string;
  medicamentos_actuales?: string;
  alergias?: string;
}

interface ParsedPatient {
  rowIndex: number;
  data: CsvRow;
  errors: string[];
  valid: boolean;
}

interface ImportProgress {
  total: number;
  completed: number;
  failed: number;
  errors: { row: number; name: string; error: string }[];
}

type Step = 'upload' | 'preview' | 'importing' | 'complete';

// CSV template columns and a sample row
const CSV_COLUMNS = [
  'nombre',
  'apellido_paterno',
  'apellido_materno',
  'fecha_nacimiento',
  'genero',
  'email',
  'telefono_celular',
  'telefono_fijo',
  'direccion',
  'ciudad',
  'estado',
  'codigo_postal',
  'contacto_emergencia_nombre',
  'contacto_emergencia_telefono',
  'contacto_emergencia_parentesco',
  'historial_medico',
  'medicamentos_actuales',
  'alergias',
];

const CSV_SAMPLE_ROW = [
  'Juan',
  'García',
  'López',
  '1990-05-15',
  'masculino',
  'juan.garcia@ejemplo.com',
  '5512345678',
  '5587654321',
  'Calle Reforma 123 Col. Centro',
  'Ciudad de México',
  'CDMX',
  '06600',
  'María García',
  '5598765432',
  'madre',
  'Hipertensión diagnosticada en 2015',
  'Losartán 50mg diario',
  'Penicilina',
];

function downloadCsvTemplate() {
  const header = CSV_COLUMNS.join(',');
  const sample = CSV_SAMPLE_ROW.map(v => `"${v}"`).join(',');
  const content = `${header}\n${sample}\n`;
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'plantilla-pacientes-glian.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): ParsedPatient[] {
  const lines = text
    .split('\n')
    .map(l => l.replace(/\r$/, ''))
    .filter(l => l.trim());

  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const results: ParsedPatient[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue;

    // Handle quoted fields that may contain commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let c = 0; c < rawLine.length; c++) {
      const ch = rawLine[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current.trim());

    const row: Partial<CsvRow> = {};
    header.forEach((col, idx) => {
      (row as any)[col] = values[idx] ?? '';
    });

    const errors: string[] = [];

    if (!row.nombre?.trim()) errors.push('Nombre requerido');
    if (!row.apellido_paterno?.trim()) errors.push('Apellido paterno requerido');
    if (!row.fecha_nacimiento?.trim()) {
      errors.push('Fecha de nacimiento requerida');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(row.fecha_nacimiento.trim())) {
      errors.push('Fecha de nacimiento debe ser YYYY-MM-DD');
    }
    if (!row.email?.trim()) {
      errors.push('Email requerido');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
      errors.push('Email inválido');
    }
    if (!row.telefono_celular?.trim()) errors.push('Teléfono celular requerido');

    const genero = row.genero?.trim().toLowerCase();
    if (!genero) {
      errors.push('Género requerido');
    } else if (!['masculino', 'femenino', 'male', 'female'].includes(genero)) {
      errors.push('Género debe ser masculino o femenino');
    }

    results.push({
      rowIndex: i + 1,
      data: row as CsvRow,
      errors,
      valid: errors.length === 0,
    });
  }

  return results;
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function PatientImportManager({ onClose, onImportComplete }: PatientImportManagerProps) {
  const [step, setStep] = useState<Step>('upload');
  const [parsedPatients, setParsedPatients] = useState<ParsedPatient[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setParseError('Solo se aceptan archivos CSV (.csv)');
      return;
    }

    setParseError(null);
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const patients = parseCsv(text);
        if (patients.length === 0) {
          setParseError('El archivo no contiene datos de pacientes (solo encabezado o vacío)');
          return;
        }
        setParsedPatients(patients);
        setStep('preview');
      } catch {
        setParseError('Error al leer el archivo CSV. Verifica el formato.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    // Simulate input change
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, []);

  const executeImport = async () => {
    const validPatients = parsedPatients.filter(p => p.valid);
    if (validPatients.length === 0) return;

    setStep('importing');
    const prog: ImportProgress = {
      total: validPatients.length,
      completed: 0,
      failed: 0,
      errors: [],
    };
    setProgress({ ...prog });

    for (const patient of validPatients) {
      const { data } = patient;
      const genderNorm = ['masculino', 'male'].includes(data.genero?.toLowerCase()) ? 'male' : 'female';

      try {
        await expedixApi.createPatient({
          first_name: data.nombre.trim(),
          paternal_last_name: data.apellido_paterno.trim(),
          maternal_last_name: data.apellido_materno?.trim() || '',
          birth_date: data.fecha_nacimiento.trim(),
          gender: genderNorm,
          email: data.email.trim(),
          cell_phone: data.telefono_celular.trim(),
          phone: data.telefono_fijo?.trim() || '',
          address: data.direccion?.trim() || '',
          city: data.ciudad?.trim() || '',
          state: data.estado?.trim() || '',
          postal_code: data.codigo_postal?.trim() || '',
          emergency_contact_name: data.contacto_emergencia_nombre?.trim() || '',
          emergency_contact_phone: data.contacto_emergencia_telefono?.trim() || '',
          emergency_contact_relationship: data.contacto_emergencia_parentesco?.trim() || '',
          medical_history: data.historial_medico?.trim() || '',
          current_medications: data.medicamentos_actuales?.trim() || '',
          allergies: data.alergias?.trim() || '',
          age: calculateAge(data.fecha_nacimiento.trim()),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        prog.completed++;
      } catch (err) {
        prog.failed++;
        prog.errors.push({
          row: patient.rowIndex,
          name: `${data.nombre} ${data.apellido_paterno}`,
          error: err instanceof Error ? err.message : 'Error desconocido',
        });
      }

      setProgress({ ...prog });
    }

    setStep('complete');
    onImportComplete(prog.completed);
  };

  const reset = () => {
    setStep('upload');
    setParsedPatients([]);
    setUploadedFile(null);
    setParseError(null);
    setProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = parsedPatients.filter(p => p.valid).length;
  const invalidCount = parsedPatients.filter(p => !p.valid).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <CloudArrowUpIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Carga Masiva de Pacientes</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            {(['upload', 'preview', 'importing', 'complete'] as Step[]).map((s, idx) => {
              const labels: Record<Step, string> = {
                upload: '1. Subir CSV',
                preview: '2. Vista previa',
                importing: '3. Importando',
                complete: '4. Completo',
              };
              const steps: Step[] = ['upload', 'preview', 'importing', 'complete'];
              const currentIdx = steps.indexOf(step);
              const isActive = s === step;
              const isDone = steps.indexOf(s) < currentIdx;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className={`font-medium ${isActive ? 'text-primary-600' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                    {labels[s]}
                  </span>
                  {idx < 3 && <span className="text-gray-300">›</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Template download */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <DocumentArrowDownIcon className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-800 text-sm">Paso 1: Descarga la plantilla CSV</p>
                    <p className="text-blue-700 text-xs mt-0.5">
                      Llena la plantilla con los datos de tus pacientes. Los campos obligatorios son:
                      nombre, apellido paterno, fecha de nacimiento (YYYY-MM-DD), género (masculino/femenino), email y teléfono celular.
                    </p>
                  </div>
                  <Button
                    onClick={downloadCsvTemplate}
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                    Plantilla CSV
                  </Button>
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-primary-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-1">Arrastra tu CSV aquí o haz clic para seleccionarlo</p>
                <p className="text-gray-500 text-sm">Solo archivos .csv — máximo 5 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">{parseError}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                  <div className="text-2xl font-bold text-gray-800">{parsedPatients.length}</div>
                  <div className="text-xs text-gray-500 mt-1">Total registros</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{validCount}</div>
                  <div className="text-xs text-green-600 mt-1">Válidos para importar</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
                  <div className="text-xs text-red-500 mt-1">Con errores (se omitirán)</div>
                </div>
              </div>

              {/* Rows table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fila</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">F. Nacimiento</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedPatients.map(p => (
                        <tr key={p.rowIndex} className={p.valid ? 'bg-white' : 'bg-red-50'}>
                          <td className="px-3 py-2 text-gray-500">{p.rowIndex}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {[p.data.nombre, p.data.apellido_paterno, p.data.apellido_materno].filter(Boolean).join(' ')}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{p.data.email || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{p.data.fecha_nacimiento || '—'}</td>
                          <td className="px-3 py-2">
                            {p.valid ? (
                              <span className="inline-flex items-center gap-1 text-green-700 text-xs">
                                <CheckCircleIcon className="h-3.5 w-3.5" /> OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 text-xs" title={p.errors.join('\n')}>
                                <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                {p.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidCount > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Los registros con errores se omitirán en la importación. Corrige el CSV y vuelve a subirlo si deseas incluirlos.
                </p>
              )}
            </div>
          )}

          {/* STEP: IMPORTING */}
          {step === 'importing' && progress && (
            <div className="flex flex-col items-center justify-center py-10 gap-6">
              <ArrowPathIcon className="h-12 w-12 text-primary-500 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">Importando pacientes...</p>
                <p className="text-gray-500 text-sm mt-1">
                  {progress.completed + progress.failed} de {progress.total} procesados
                </p>
              </div>
              <div className="w-full max-w-sm bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${((progress.completed + progress.failed) / progress.total) * 100}%` }}
                />
              </div>
              <div className="flex gap-6 text-sm">
                <span className="text-green-600 font-medium">{progress.completed} exitosos</span>
                <span className="text-red-500 font-medium">{progress.failed} fallidos</span>
              </div>
            </div>
          )}

          {/* STEP: COMPLETE */}
          {step === 'complete' && progress && (
            <div className="flex flex-col items-center justify-center py-8 gap-5">
              <CheckCircleIcon className="h-16 w-16 text-green-500" />
              <div className="text-center">
                <p className="text-xl font-bold text-gray-900">¡Importación completada!</p>
                <p className="text-gray-600 mt-1">
                  Se importaron <span className="font-semibold text-green-700">{progress.completed}</span> pacientes correctamente.
                  {progress.failed > 0 && (
                    <span className="text-red-500"> {progress.failed} fallaron.</span>
                  )}
                </p>
              </div>

              {progress.errors.length > 0 && (
                <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <p className="text-sm font-medium text-red-800 mb-2">Errores de importación:</p>
                  {progress.errors.map((e, i) => (
                    <div key={i} className="text-xs text-red-700 mb-1">
                      Fila {e.row} — {e.name}: {e.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          {step === 'upload' && (
            <>
              <span className="text-xs text-gray-400">
                Archivo: {uploadedFile?.name ?? 'ninguno'}
              </span>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={reset}>
                Cambiar archivo
              </Button>
              <Button
                onClick={executeImport}
                disabled={validCount === 0}
                variant="primary"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-1.5" />
                Importar {validCount} paciente{validCount !== 1 ? 's' : ''}
              </Button>
            </>
          )}

          {step === 'importing' && (
            <span className="text-sm text-gray-500 mx-auto">Por favor espera...</span>
          )}

          {step === 'complete' && (
            <>
              <Button variant="outline" onClick={reset}>
                Importar más
              </Button>
              <Button variant="primary" onClick={onClose}>
                Cerrar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
