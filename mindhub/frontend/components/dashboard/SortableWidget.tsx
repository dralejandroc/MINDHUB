'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/Card';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function SortableWidget({ id, children, className }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'z-50',
        className
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute top-2 right-2 z-10 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing',
          'bg-white shadow-sm border border-gray-200 hover:bg-gray-50',
          isDragging && 'opacity-100'
        )}
        title="Arrastrar para reordenar"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Widget Content */}
      <div
        className={cn(
          'h-full transition-all duration-200',
          isDragging && 'opacity-50 scale-105 shadow-2xl'
        )}
      >
        {children}
      </div>
    </div>
  );
}