/**
 * InteractiveComponentRenderer - Renders interactive components
 * 
 * Handles interactive elements like canvas drawing, timers, calculations
 * for specialized clinical assessments like MOCA.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface InteractiveComponentRendererProps {
  item: {
    id: string;
    text: string;
    responseType: string;
    interactive?: {
      type: 'canvas' | 'timer' | 'calculation';
      config: any;
    };
    metadata?: any;
  };
  value: any;
  onChange: (value: any) => void;
  responseGroups?: any;
}

export const InteractiveComponentRenderer: React.FC<InteractiveComponentRendererProps> = ({
  item,
  value,
  onChange
}) => {
  if (!item.interactive) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-yellow-800">
          Componente interactivo no configurado correctamente.
        </div>
      </div>
    );
  }

  switch (item.interactive.type) {
    case 'canvas':
      return <CanvasDrawingComponent item={item} value={value} onChange={onChange} />;
    case 'timer':
      return <TimerComponent item={item} value={value} onChange={onChange} />;
    case 'calculation':
      return <CalculationComponent item={item} value={value} onChange={onChange} />;
    default:
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            Tipo de componente interactivo no soportado: {item.interactive.type}
          </div>
        </div>
      );
  }
};

// =================== CANVAS DRAWING COMPONENT ===================

const CanvasDrawingComponent: React.FC<{
  item: any;
  value: any;
  onChange: (value: any) => void;
}> = ({ item, value, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const config = item.interactive.config || {};
  const canvasWidth = config.width || 400;
  const canvasHeight = config.height || 300;
  const strokeWidth = config.strokeWidth || 2;
  const strokeColor = config.strokeColor || '#000000';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas properties
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = strokeColor;

    // Load existing drawing if available
    if (value && value.dataURL) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = value.dataURL;
    }
  }, [value, strokeWidth, strokeColor]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    // Save the drawing
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataURL = canvas.toDataURL();
      onChange({
        dataURL,
        timestamp: new Date().toISOString(),
        canvasWidth,
        canvasHeight
      });
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange(null);
  };

  return (
    <div className="canvas-drawing-component">
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          {config.instructions || 'Use el ratón para dibujar en el área siguiente:'}
        </div>
        
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white inline-block">
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="border border-gray-200 cursor-crosshair"
            style={{ display: 'block' }}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Limpiar
        </button>
        
        {hasDrawn && (
          <div className="flex items-center text-sm text-green-600">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Dibujo guardado
          </div>
        )}
      </div>
    </div>
  );
};

// =================== TIMER COMPONENT ===================

const TimerComponent: React.FC<{
  item: any;
  value: any;
  onChange: (value: any) => void;
}> = ({ item, value, onChange }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const config = item.interactive.config || {};
  const duration = config.duration || 60; // seconds
  const autoStart = config.autoStart || false;

  useEffect(() => {
    if (value && value.completed) {
      setIsCompleted(true);
      setTimeLeft(0);
    } else if (!isRunning) {
      setTimeLeft(duration);
    }
  }, [duration, value, isRunning]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            onChange({
              completed: true,
              duration: duration,
              timestamp: new Date().toISOString()
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, duration, onChange]);

  const startTimer = () => {
    setIsRunning(true);
    setIsCompleted(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setTimeLeft(duration);
    onChange(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-component text-center">
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-4">
          {config.instructions || `Complete la tarea en ${duration} segundos:`}
        </div>
        
        <div className={`
          text-6xl font-mono font-bold mb-4
          ${isRunning ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'}
        `}>
          {formatTime(timeLeft)}
        </div>

        {isCompleted && (
          <div className="text-green-600 font-medium mb-4">
            ¡Tiempo completado!
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {!isRunning && !isCompleted && (
          <button
            type="button"
            onClick={startTimer}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Iniciar
          </button>
        )}
        
        {(isCompleted || isRunning) && (
          <button
            type="button"
            onClick={resetTimer}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Reiniciar
          </button>
        )}
      </div>
    </div>
  );
};

// =================== CALCULATION COMPONENT ===================

const CalculationComponent: React.FC<{
  item: any;
  value: any;
  onChange: (value: any) => void;
}> = ({ item, value, onChange }) => {
  const [result, setResult] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const config = item.interactive.config || {};
  const calculation = config.calculation || { question: '2 + 2', answer: 4 };

  const checkAnswer = () => {
    const numericResult = parseFloat(result);
    const correct = numericResult === calculation.answer;
    setIsCorrect(correct);
    
    onChange({
      question: calculation.question,
      userAnswer: numericResult,
      correctAnswer: calculation.answer,
      isCorrect: correct,
      timestamp: new Date().toISOString()
    });
  };

  const resetAnswer = () => {
    setResult('');
    setIsCorrect(null);
    onChange(null);
  };

  return (
    <div className="calculation-component">
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-4">
          {config.instructions || 'Resuelva el siguiente cálculo:'}
        </div>
        
        <div className="text-center mb-4">
          <div className="text-2xl font-medium mb-4">
            {calculation.question} = ?
          </div>
          
          <input
            type="number"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-32 px-3 py-2 text-center text-xl border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            placeholder="?"
            disabled={isCorrect !== null}
          />
        </div>

        {isCorrect !== null && (
          <div className={`text-center p-4 rounded-lg ${
            isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex items-center justify-center mb-2">
              {isCorrect ? (
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              <strong>
                {isCorrect ? 'Correcto' : 'Incorrecto'}
              </strong>
            </div>
            {!isCorrect && (
              <div>
                La respuesta correcta es: {calculation.answer}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {isCorrect === null && result && (
          <button
            type="button"
            onClick={checkAnswer}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Verificar
          </button>
        )}
        
        {isCorrect !== null && (
          <button
            type="button"
            onClick={resetAnswer}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Intentar de nuevo
          </button>
        )}
      </div>
    </div>
  );
};

export default InteractiveComponentRenderer;