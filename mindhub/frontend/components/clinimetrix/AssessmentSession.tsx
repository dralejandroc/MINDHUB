/**
 * Assessment Session Component
 * Manage and conduct clinical assessment sessions
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useUniversalScales, useCurrentAssessment } from '../../contexts/UniversalScalesContext';
import {
  AssessmentSession as AssessmentSessionType,
  ScaleAdministration,
  SessionStatus,
  AdministrationStatus,
  SessionType,
  AdministrationMode
} from '../../types/clinimetrix';

// =============================================================================
// TYPES
// =============================================================================

interface AssessmentSessionProps {
  session: AssessmentSessionType;
  onSessionUpdate?: (session: AssessmentSessionType) => void;
  onAdministrationStart?: (administration: ScaleAdministration) => void;
  onAdministrationComplete?: (administration: ScaleAdministration) => void;
  readOnly?: boolean;
}

interface SessionHeaderProps {
  session: AssessmentSessionType;
  onStatusChange?: (status: SessionStatus) => void;
  readOnly?: boolean;
}

interface AdministrationListProps {
  administrations: ScaleAdministration[];
  onAdministrationSelect?: (administration: ScaleAdministration) => void;
  onAdministrationStart?: (administration: ScaleAdministration) => void;
  readOnly?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AssessmentSession({
  session,
  onSessionUpdate,
  onAdministrationStart,
  onAdministrationComplete,
  readOnly = false
}: AssessmentSessionProps) {
  const { startAssessment, completeAssessment } = useUniversalScales();
  const [localSession, setLocalSession] = useState<AssessmentSessionType>(session);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedAdministration, setSelectedAdministration] = useState<ScaleAdministration | null>(null);

  // Update local session when prop changes
  useEffect(() => {
    setLocalSession(session);
  }, [session]);

  // Handle administration start
  const handleAdministrationStart = async (administration: ScaleAdministration) => {
    if (readOnly) return;

    try {
      setIsStarting(true);
      await startAssessment(
        administration.scaleId,
        administration.sessionId // patientId in the universal context
      );
      
      setSelectedAdministration(administration);
      onAdministrationStart?.(administration);
    } catch (error) {
      console.error('Failed to start administration:', error);
    } finally {
      setIsStarting(false);
    }
  };

  // Handle administration complete
  const handleAdministrationComplete = async (administration: ScaleAdministration) => {
    if (readOnly) return;

    try {
      await completeAssessment();
      onAdministrationComplete?.(administration);
    } catch (error) {
      console.error('Failed to complete administration:', error);
    }
  };

  // Calculate session statistics
  const sessionStats = {
    totalAdministrations: localSession.administrations?.length || 0,
    completedAdministrations: localSession.administrations?.filter(
      a => a.status === AdministrationStatus.COMPLETED
    ).length || 0,
    inProgressAdministrations: localSession.administrations?.filter(
      a => a.status === AdministrationStatus.IN_PROGRESS
    ).length || 0,
    overallProgress: localSession.administrations?.length && localSession.administrations.length > 0 
      ? ((localSession.administrations.filter(a => a.status === AdministrationStatus.COMPLETED).length) / localSession.administrations.length) * 100
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <SessionHeader
        session={localSession}
        onStatusChange={(status) => {
          const updatedSession = { ...localSession, status };
          setLocalSession(updatedSession);
          onSessionUpdate?.(updatedSession);
        }}
        readOnly={readOnly}
      />

      {/* Session Statistics */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Session Progress</h3>
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-clinimetrix-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${sessionStats.overallProgress}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {sessionStats.overallProgress.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{sessionStats.totalAdministrations}</div>
            <div className="text-sm text-gray-500">Total Assessments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{sessionStats.completedAdministrations}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{sessionStats.inProgressAdministrations}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {sessionStats.totalAdministrations - sessionStats.completedAdministrations - sessionStats.inProgressAdministrations}
            </div>
            <div className="text-sm text-gray-500">Not Started</div>
          </div>
        </div>
      </Card>

      {/* Administration List */}
      {localSession.administrations && localSession.administrations.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Clinical Assessments</h3>
            {!readOnly && (
              <Button
                variant="outline"
                size="sm"
                disabled={localSession.status !== SessionStatus.IN_PROGRESS}
              >
                Add Assessment
              </Button>
            )}
          </div>

          <AdministrationList
            administrations={localSession.administrations}
            onAdministrationSelect={setSelectedAdministration}
            onAdministrationStart={handleAdministrationStart}
            readOnly={readOnly}
          />
        </Card>
      )}

      {/* Session Notes */}
      <Card className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Session Notes</h3>
        
        <div className="space-y-4">
          {localSession.preSessionNotes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Pre-Session Notes</h4>
              <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
                {localSession.preSessionNotes}
              </p>
            </div>
          )}

          {localSession.postSessionNotes && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Post-Session Notes</h4>
              <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
                {localSession.postSessionNotes}
              </p>
            </div>
          )}

          {localSession.environmentalFactors && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Environmental Factors</h4>
              <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md">
                {localSession.environmentalFactors}
              </p>
            </div>
          )}

          {localSession.validityConcerns && (
            <div className="border-l-4 border-yellow-400 pl-4">
              <h4 className="text-sm font-medium text-yellow-700 mb-2 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                Validity Concerns
              </h4>
              <p className="text-sm text-yellow-600">
                {localSession.validityConcerns}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Loading State */}
      {isStarting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-sm mx-4">
            <div className="flex items-center space-x-3">
              <LoadingSpinner size="sm" />
              <span className="text-gray-700">Starting assessment...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SESSION HEADER COMPONENT
// =============================================================================

function SessionHeader({ session, onStatusChange, readOnly }: SessionHeaderProps) {
  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case SessionStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case SessionStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case SessionStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case SessionStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case SessionStatus.INCOMPLETE:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionTypeIcon = (type: SessionType) => {
    switch (type) {
      case SessionType.INITIAL:
        return '🆕';
      case SessionType.FOLLOW_UP:
        return '🔄';
      case SessionType.RESEARCH:
        return '🔬';
      case SessionType.SCREENING:
        return '🔍';
      default:
        return '📋';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {session.sessionName || `Assessment Session ${session.id.slice(-6)}`}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
              {session.status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4" />
              <span>{new Date(session.sessionDate).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <UserIcon className="w-4 h-4" />
              <span>{session.administrationMode.replace('_', ' ')}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{getSessionTypeIcon(session.sessionType)}</span>
              <span>{session.sessionType.replace('_', ' ')}</span>
            </div>

            {session.location && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>📍</span>
                <span>{session.location}</span>
              </div>
            )}

            {session.durationMinutes && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4" />
                <span>{session.durationMinutes} minutes</span>
              </div>
            )}

            {session.completionRate && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ChartBarIcon className="w-4 h-4" />
                <span>{session.completionRate.toFixed(1)}% complete</span>
              </div>
            )}
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center space-x-2">
            {session.status === SessionStatus.SCHEDULED && (
              <Button
                onClick={() => onStatusChange?.(SessionStatus.IN_PROGRESS)}
                className="flex items-center space-x-2"
              >
                <PlayIcon className="w-4 h-4" />
                <span>Start Session</span>
              </Button>
            )}

            {session.status === SessionStatus.IN_PROGRESS && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onStatusChange?.(SessionStatus.INCOMPLETE)}
                  className="flex items-center space-x-2"
                >
                  <PauseIcon className="w-4 h-4" />
                  <span>Pause</span>
                </Button>
                
                <Button
                  onClick={() => onStatusChange?.(SessionStatus.COMPLETED)}
                  className="flex items-center space-x-2"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Complete</span>
                </Button>
              </>
            )}

            {session.status === SessionStatus.INCOMPLETE && (
              <Button
                onClick={() => onStatusChange?.(SessionStatus.IN_PROGRESS)}
                className="flex items-center space-x-2"
              >
                <PlayIcon className="w-4 h-4" />
                <span>Resume</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// ADMINISTRATION LIST COMPONENT
// =============================================================================

function AdministrationList({
  administrations,
  onAdministrationSelect,
  onAdministrationStart,
  readOnly
}: AdministrationListProps) {
  const getStatusIcon = (status: AdministrationStatus) => {
    switch (status) {
      case AdministrationStatus.NOT_STARTED:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
      case AdministrationStatus.IN_PROGRESS:
        return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />;
      case AdministrationStatus.COMPLETED:
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case AdministrationStatus.ABANDONED:
        return <StopIcon className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="space-y-3">
      {administrations.map((administration, index) => (
        <Card
          key={administration.id}
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onAdministrationSelect?.(administration)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-medium text-gray-500">
                  {index + 1}
                </span>
                {getStatusIcon(administration.status)}
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900">
                    {administration.scale?.name || 'Loading...'}
                  </h4>
                  <span className="text-sm text-gray-500">
                    ({administration.scale?.abbreviation})
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                  <span>
                    {administration.itemsCompleted} / {administration.totalItems} items
                  </span>
                  <span>{administration.completionPercentage.toFixed(1)}% complete</span>
                  
                  {administration.rawScore !== undefined && (
                    <span>Score: {administration.rawScore}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {administration.status === AdministrationStatus.NOT_STARTED && !readOnly && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdministrationStart?.(administration);
                  }}
                  className="flex items-center space-x-1"
                >
                  <PlayIcon className="w-3 h-3" />
                  <span>Start</span>
                </Button>
              )}

              {administration.status === AdministrationStatus.IN_PROGRESS && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdministrationSelect?.(administration);
                  }}
                  className="flex items-center space-x-1"
                >
                  <span>Continue</span>
                </Button>
              )}

              {administration.status === AdministrationStatus.COMPLETED && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdministrationSelect?.(administration);
                  }}
                  className="flex items-center space-x-1"
                >
                  <DocumentTextIcon className="w-3 h-3" />
                  <span>View</span>
                </Button>
              )}

              {administration.completionPercentage > 0 && (
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-clinimetrix-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${administration.completionPercentage}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Administration Notes */}
          {administration.administrationNotes && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
              <InformationCircleIcon className="w-4 h-4 inline mr-1" />
              {administration.administrationNotes}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export default AssessmentSession;