'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabProps {
  text: string;
  selected: boolean;
  setSelected: (text: string) => void;
  discount?: boolean;
}

export function Tab({ text, selected, setSelected, discount }: TabProps) {
  return (
    <button
      onClick={() => setSelected(text)}
      className={cn(
        'relative rounded-full px-6 py-2 text-sm font-medium transition-all duration-200',
        selected
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      )}
    >
      {text}
      {discount && selected && (
        <span className="absolute -top-2 -right-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
          -20%
        </span>
      )}
    </button>
  );
}