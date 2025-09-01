'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
  disabled?: boolean;
}

interface ExpandableTabsProps {
  tabs: Tab[];
  defaultExpanded?: string[];
  className?: string;
  allowMultiple?: boolean;
}

export function ExpandableTabs({
  tabs,
  defaultExpanded = [],
  className,
  allowMultiple = false
}: ExpandableTabsProps) {
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(
    new Set(defaultExpanded)
  );

  const toggleTab = (tabId: string) => {
    const newExpanded = new Set(expandedTabs);
    
    if (newExpanded.has(tabId)) {
      newExpanded.delete(tabId);
    } else {
      if (!allowMultiple) {
        newExpanded.clear();
      }
      newExpanded.add(tabId);
    }
    
    setExpandedTabs(newExpanded);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {tabs.map((tab) => {
        const isExpanded = expandedTabs.has(tab.id);
        const Icon = tab.icon;
        
        return (
          <div
            key={tab.id}
            className={cn(
              "border rounded-lg overflow-hidden transition-all duration-200",
              isExpanded ? "bg-white shadow-sm" : "bg-gray-50",
              tab.disabled && "opacity-50"
            )}
          >
            <button
              onClick={() => !tab.disabled && toggleTab(tab.id)}
              disabled={tab.disabled}
              className={cn(
                "w-full flex items-center justify-between p-4 text-left transition-colors",
                "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset",
                isExpanded && "bg-blue-50 border-b border-gray-200",
                tab.disabled && "cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-3">
                {Icon && (
                  <Icon className={cn(
                    "h-5 w-5 transition-colors",
                    isExpanded ? "text-blue-600" : "text-gray-500"
                  )} />
                )}
                <span className={cn(
                  "font-medium transition-colors",
                  isExpanded ? "text-blue-900" : "text-gray-900"
                )}>
                  {tab.label}
                </span>
              </div>
              
              <div className={cn(
                "transition-transform duration-200",
                isExpanded ? "rotate-0" : ""
              )}>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </button>
            
            {isExpanded && (
              <div className="p-6 bg-white border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                {tab.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ExpandableTabs;