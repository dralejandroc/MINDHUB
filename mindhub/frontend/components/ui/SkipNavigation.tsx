'use client';

import React from 'react';

/**
 * Skip navigation link for keyboard users
 * Allows jumping directly to main content
 * WCAG 2.1 AA Compliance - Success Criterion 2.4.1
 */
export const SkipNavigation: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white 
                 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 
                 focus:ring-primary-500 focus:ring-offset-2"
    >
      Saltar al contenido principal
    </a>
  );
};

/**
 * Skip to section links for complex pages
 */
interface SkipLinksProps {
  links: {
    href: string;
    label: string;
  }[];
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ links }) => {
  return (
    <nav
      aria-label="Enlaces de salto"
      className="sr-only focus-within:not-sr-only focus-within:absolute 
                 focus-within:top-4 focus-within:left-4 focus-within:z-50 
                 focus-within:bg-white focus-within:rounded-lg focus-within:shadow-lg 
                 focus-within:p-4 focus-within:border focus-within:border-gray-200"
    >
      <h2 className="text-sm font-semibold text-gray-900 mb-2">
        Saltar a sección
      </h2>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="block px-3 py-1 text-sm text-gray-700 rounded 
                         hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};