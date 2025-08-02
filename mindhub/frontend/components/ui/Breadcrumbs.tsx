'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" aria-hidden="true" />
            )}
            
            {item.href && !item.current ? (
              <Link
                href={item.href}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {index === 0 && items.length > 1 ? (
                  <HomeIcon className="h-4 w-4" />
                ) : (
                  item.label
                )}
              </Link>
            ) : (
              <span
                className={`${
                  item.current 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-500'
                }`}
                aria-current={item.current ? 'page' : undefined}
              >
                {index === 0 && items.length > 1 ? (
                  <HomeIcon className="h-4 w-4" />
                ) : (
                  item.label
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};