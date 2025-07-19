'use client';

import { useState } from 'react';
import { 
  ClipboardDocumentListIcon, 
  PlusIcon, 
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import UniversalScalesGrid from '@/components/clinimetrix/UniversalScalesGrid';
import { AssessmentSession } from '@/components/clinimetrix/AssessmentSession';
import { AssessmentInterface } from '@/components/clinimetrix/AssessmentInterface';
import { ClinicalScale, AssessmentSession as AssessmentSessionType } from '@/types/clinimetrix';

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

function ClinimetrixPageContent() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'scales' | 'sessions' | 'assessment'>('dashboard');
  const [selectedScale, setSelectedScale] = useState<ClinicalScale | null>(null);
  const [selectedSession, setSelectedSession] = useState<AssessmentSessionType | null>(null);

  const renderContent = () => {
    switch (currentView) {
      case 'scales':
        return <UniversalScalesGrid />;
      
      case 'sessions':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Assessment Sessions</h2>
              <Button 
                onClick={() => setCurrentView('scales')}
                className="flex items-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>New Session</span>
              </Button>
            </div>
            
            <Card className="p-8 text-center">
              <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Active Sessions
              </h3>
              <p className="text-gray-600 mb-6">
                Create a new assessment session to get started
              </p>
              <Button onClick={() => setCurrentView('scales')}>
                Create Session
              </Button>
            </Card>
          </div>
        );
      
      case 'assessment':
        return (
          <AssessmentInterface
            onComplete={() => {
              setCurrentView('sessions');
              console.log('Assessment completed');
            }}
            onExit={() => setCurrentView('sessions')}
            autoSave={true}
            showProgress={true}
            allowNavigation={true}
          />
        );
      
      default:
        return (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Available Scales</p>
                    <p className="text-2xl font-bold text-gray-900">50+</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Assessments Today</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg. Duration</p>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setCurrentView('scales')}
                  className="flex items-center justify-center space-x-2 p-4"
                >
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                  <span>Browse Clinical Scales</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setCurrentView('sessions')}
                  className="flex items-center justify-center space-x-2 p-4"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Start New Assessment</span>
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-clinimetrix-100 rounded-lg flex items-center justify-center">
            <ClipboardDocumentListIcon className="h-6 w-6 text-clinimetrix-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clinimetrix</h1>
            <p className="text-gray-600">Clinical Assessment System</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Navigation */}
          <Button
            variant={currentView === 'dashboard' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </Button>
          
          <Button
            variant={currentView === 'scales' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('scales')}
          >
            Scales
          </Button>
          
          <Button
            variant={currentView === 'sessions' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setCurrentView('sessions')}
          >
            Sessions
          </Button>
          
          <Button
            variant="primary"
            onClick={() => setCurrentView('scales')}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>New Assessment</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}

export default function ClinimetrixPage() {
  return <ClinimetrixPageContent />;
}