'use client';

import { SparklesIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function FormxPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-formx-100 rounded-lg flex items-center justify-center">
            <SparklesIcon className="h-6 w-6 text-formx-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Formx</h1>
            <p className="text-gray-600">Form Builder System</p>
          </div>
        </div>
        <Button variant="primary">
          Create Form
        </Button>
      </div>

      {/* Coming Soon */}
      <Card className="text-center py-12">
        <SparklesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Formx Hub Coming Soon
        </h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Drag-and-drop form builder for custom questionnaires will be available here.
        </p>
        <Button variant="outline">
          Learn More
        </Button>
      </Card>
    </div>
  );
}