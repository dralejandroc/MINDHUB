'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Patient {
  id: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  age: number;
}

interface PHQ9Response {
  questionId: number;
  value: number;
  label: string;
}

interface PHQ9Assessment {
  id: string;
  patientId: string;
  date: string;
  responses: PHQ9Response[];
  totalScore: number;
  severity: string;
  difficultyLevel: number | null;
  difficultyDescription: string;
}

interface PHQ9ScaleProps {
  patient: Patient;
  onComplete: (assessment: PHQ9Assessment) => void;
  onCancel: () => void;
}

const PHQ9_QUESTIONS = [
  "Poco interés o placer en hacer cosas",
  "Se ha sentido decaído(a), deprimido(a) o sin esperanzas",
  "Ha tenido dificultad para quedarse o permanecer dormido(a), o ha dormido demasiado",
  "Se ha sentido cansado(a) o con poca energía",
  "Sin apetito o ha comido en exceso",
  "Se ha sentido mal consigo mismo(a) - o que es un fracaso o que ha quedado mal con usted mismo(a) o con su familia",
  "Ha tenido dificultad para concentrarse en cosas, tales como leer el periódico o ver la televisión",
  "¿Se ha movido o hablado tan lento que otras personas podrían haberlo notado? o lo contrario - muy inquieto(a) o agitado(a) que ha estado moviéndose mucho más de lo normal",
  "Pensamientos de que estaría mejor muerto(a) o de lastimarse de alguna manera"
];

const RESPONSE_OPTIONS = [
  { value: 0, label: "Para nada" },
  { value: 1, label: "Varios días" },
  { value: 2, label: "Más de la mitad de los días" },
  { value: 3, label: "Casi todos los días" }
];

const DIFFICULTY_LEVELS = [
  "Para nada difícil",
  "Un poco difícil",
  "Muy difícil",
  "Extremadamente difícil"
];

export default function PHQ9Scale({ patient, onComplete, onCancel }: PHQ9ScaleProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<PHQ9Response[]>([]);
  const [showDifficultyQuestion, setShowDifficultyQuestion] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleResponse = (value: number, label: string) => {
    const newResponse: PHQ9Response = {
      questionId: currentQuestion,
      value,
      label
    };

    const updatedResponses = [...responses];
    updatedResponses[currentQuestion] = newResponse;
    setResponses(updatedResponses);

    if (currentQuestion < PHQ9_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // All questions answered, show difficulty question
      setShowDifficultyQuestion(true);
    }
  };

  const handleDifficultyResponse = (level: number) => {
    setDifficultyLevel(level);
    setShowResults(true);
  };

  const goToPreviousQuestion = () => {
    if (showDifficultyQuestion) {
      setShowDifficultyQuestion(false);
      setCurrentQuestion(PHQ9_QUESTIONS.length - 1);
    } else if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    return responses.reduce((sum, response) => sum + (response?.value || 0), 0);
  };

  const getSeverityLevel = (score: number) => {
    if (score >= 20) return { level: "Depresión severa", color: "text-red-600", bgColor: "bg-red-50" };
    if (score >= 15) return { level: "Depresión moderadamente severa", color: "text-orange-600", bgColor: "bg-orange-50" };
    if (score >= 10) return { level: "Depresión moderada", color: "text-yellow-600", bgColor: "bg-yellow-50" };
    if (score >= 5) return { level: "Depresión leve", color: "text-blue-600", bgColor: "bg-blue-50" };
    return { level: "Mínima depresión", color: "text-green-600", bgColor: "bg-green-50" };
  };

  const handleCompleteAssessment = () => {
    const totalScore = calculateScore();
    const severity = getSeverityLevel(totalScore);
    
    const assessment: PHQ9Assessment = {
      id: `phq9_${Date.now()}`,
      patientId: patient.id,
      date: new Date().toISOString(),
      responses,
      totalScore,
      severity: severity.level,
      difficultyLevel,
      difficultyDescription: difficultyLevel !== null ? DIFFICULTY_LEVELS[difficultyLevel] : ''
    };

    onComplete(assessment);
  };

  const restartAssessment = () => {
    setCurrentQuestion(0);
    setResponses([]);
    setShowDifficultyQuestion(false);
    setDifficultyLevel(null);
    setShowResults(false);
  };

  if (showResults) {
    const totalScore = calculateScore();
    const severity = getSeverityLevel(totalScore);

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-slate-800 p-5">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm p-8 shadow-2xl border border-white/20">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-light text-teal-700 mb-2">PHQ-9</h1>
              <h2 className="text-lg text-slate-600">Cuestionario de Salud del Paciente</h2>
              <div className="mt-4 p-2 bg-teal-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  Paciente: <strong>{patient.firstName} {patient.paternalLastName}</strong>
                </p>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              <div className={`p-6 rounded-2xl ${severity.bgColor} border-l-4 border-l-teal-500`}>
                <h3 className="text-xl font-medium text-slate-800 mb-4">Resultados de la Evaluación</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-teal-600">{totalScore}</div>
                    <div className="text-sm text-slate-600">Puntuación Total</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-medium ${severity.color}`}>{severity.level}</div>
                    <div className="text-sm text-slate-600">Nivel de Severidad</div>
                  </div>
                </div>

                {difficultyLevel !== null && (
                  <div className="mt-4 p-3 bg-white/50 rounded-lg">
                    <p className="text-sm text-slate-700">
                      <strong>Dificultad funcional:</strong> {DIFFICULTY_LEVELS[difficultyLevel]}
                    </p>
                  </div>
                )}
              </div>

              {/* Clinical Recommendations */}
              <div className="bg-slate-50 rounded-2xl p-6">
                <h4 className="font-medium text-slate-800 mb-4">Recomendaciones Clínicas</h4>
                <div className="space-y-2 text-sm">
                  {totalScore >= 20 && (
                    <div className="p-3 bg-red-100 text-red-800 rounded-lg">
                      • Referencia inmediata a especialista en salud mental
                      • Evaluación de riesgo suicida urgente
                    </div>
                  )}
                  {totalScore >= 15 && totalScore < 20 && (
                    <div className="p-3 bg-orange-100 text-orange-800 rounded-lg">
                      • Considerar referencia a psicología/psiquiatría
                      • Seguimiento en 1-2 semanas
                    </div>
                  )}
                  {totalScore >= 10 && totalScore < 15 && (
                    <div className="p-3 bg-yellow-100 text-yellow-800 rounded-lg">
                      • Psicoterapia o medicación antidepresiva
                      • Seguimiento en 2-4 semanas
                    </div>
                  )}
                  {totalScore >= 5 && totalScore < 10 && (
                    <div className="p-3 bg-blue-100 text-blue-800 rounded-lg">
                      • Apoyo psicológico y seguimiento
                      • Re-evaluación en 4-6 semanas
                    </div>
                  )}
                  {responses[8]?.value > 0 && (
                    <div className="p-3 bg-red-100 text-red-800 rounded-lg">
                      ⚠️ ALERTA: Ideación suicida presente - Evaluación inmediata requerida
                    </div>
                  )}
                </div>
              </div>

              {/* Response Summary */}
              <div className="bg-slate-50 rounded-2xl p-6">
                <h4 className="font-medium text-slate-800 mb-4">Resumen de Respuestas</h4>
                <div className="space-y-2">
                  {PHQ9_QUESTIONS.map((question, index) => (
                    <div key={index} className="flex justify-between items-start text-sm">
                      <span className="text-slate-600 flex-1 mr-4">{index + 1}. {question}</span>
                      <span className="font-medium text-teal-600 min-w-0">
                        {responses[index]?.label || 'No respondida'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                  onClick={restartAssessment}
                  variant="outline"
                  className="flex-1"
                >
                  🔄 Reiniciar Evaluación
                </Button>
                <Button
                  onClick={handleCompleteAssessment}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  ✅ Guardar y Continuar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (showDifficultyQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-slate-800 p-5">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm p-8 shadow-2xl border border-white/20">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-light text-teal-700 mb-2">PHQ-9</h1>
              <h2 className="text-lg text-slate-600">Cuestionario de Salud del Paciente</h2>
              <div className="mt-4 p-2 bg-teal-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  Paciente: <strong>{patient.firstName} {patient.paternalLastName}</strong>
                </p>
              </div>
            </div>

            {/* Final Question */}
            <div className="space-y-6">
              <div className="bg-purple-50 rounded-2xl p-6 border-l-4 border-l-purple-500">
                <h3 className="text-lg font-medium text-slate-800 mb-4">Pregunta Final</h3>
                <p className="text-slate-600 mb-6">
                  Si marcó cualquiera de los problemas, ¿qué tan difícil se le ha hecho cumplir con su trabajo, 
                  atender su casa, o relacionarse con otras personas debido a estos problemas?
                </p>

                <div className="space-y-3">
                  {DIFFICULTY_LEVELS.map((level, index) => (
                    <button
                      key={index}
                      onClick={() => handleDifficultyResponse(index)}
                      className="w-full p-4 text-left bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
                    >
                      <span className="font-medium text-slate-800">{level}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  onClick={goToPreviousQuestion}
                  variant="ghost"
                >
                  ← Pregunta Anterior
                </Button>
                <div className="text-sm text-slate-500">
                  Pregunta final
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-slate-800 p-5">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm p-8 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-light text-teal-700 mb-2">PHQ-9</h1>
            <h2 className="text-lg text-slate-600">Cuestionario de Salud del Paciente</h2>
            <div className="mt-4 p-2 bg-teal-50 rounded-lg">
              <p className="text-sm text-slate-600">
                Paciente: <strong>{patient.firstName} {patient.paternalLastName}</strong>
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-teal-50 rounded-2xl p-5 mb-6 border-l-4 border-l-teal-500">
            <p className="text-slate-600 leading-relaxed">
              Durante las últimas 2 semanas, ¿qué tan seguido ha sido molestado por cualquiera de los siguientes problemas?
            </p>
          </div>

          {/* Question */}
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-teal-600">
                  Pregunta {currentQuestion + 1} de {PHQ9_QUESTIONS.length}
                </span>
                <div className="text-sm text-slate-500">
                  Progreso: {Math.round(((currentQuestion + 1) / PHQ9_QUESTIONS.length) * 100)}%
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-slate-800 mb-6">
                {PHQ9_QUESTIONS[currentQuestion]}
              </h3>

              <div className="space-y-3">
                {RESPONSE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleResponse(option.value, option.label)}
                    className="w-full p-4 text-left bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{option.label}</span>
                      <span className="text-sm text-slate-500">{option.value} puntos</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / PHQ9_QUESTIONS.length) * 100}%` }}
              ></div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                onClick={goToPreviousQuestion}
                disabled={currentQuestion === 0}
                variant="ghost"
              >
                ← Pregunta Anterior
              </Button>
              <Button
                onClick={onCancel}
                variant="ghost"
              >
                Cancelar Evaluación
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}