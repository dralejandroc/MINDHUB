'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon 
} from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';

export default function ThemeToggle() {
  const { theme, effectiveTheme, setTheme } = useTheme();

  const themes = [
    {
      value: 'light',
      label: 'Claro',
      icon: SunIcon,
      description: 'Fondo claro con texto oscuro'
    },
    {
      value: 'dark',
      label: 'Oscuro', 
      icon: MoonIcon,
      description: 'Fondo oscuro con texto claro'
    },
    {
      value: 'system',
      label: 'Sistema',
      icon: ComputerDesktopIcon,
      description: 'Sigue la preferencia del sistema'
    }
  ] as const;

  const currentTheme = themes.find(t => t.value === theme);
  const CurrentIcon = currentTheme?.icon || SunIcon;

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button 
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-theme-secondary hover:bg-theme-tertiary border border-theme-primary text-theme-primary transition-colors"
          aria-label="Tema de la aplicación"
          title="Cambiar tema"
        >
          <CurrentIcon className="h-3 w-3" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-lg bg-theme-primary shadow-theme-lg border border-theme-primary focus:outline-none">
          <div className="py-1">
            <div className="px-3 py-2 border-b border-theme-primary">
              <p className="text-sm font-medium text-theme-primary">Tema de la aplicación</p>
              <p className="text-xs text-theme-secondary">
                Actualmente: {effectiveTheme === 'dark' ? 'Oscuro' : 'Claro'}
              </p>
            </div>
            
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isActive = theme === themeOption.value;
              
              return (
                <Menu.Item key={themeOption.value}>
                  {({ active }) => (
                    <button
                      onClick={() => setTheme(themeOption.value)}
                      className={`${
                        active ? 'bg-theme-accent' : ''
                      } ${
                        isActive ? 'bg-theme-accent text-theme-primary font-medium' : 'text-theme-secondary'
                      } group flex w-full items-center px-3 py-2 text-sm transition-colors`}
                    >
                      <Icon 
                        className={`mr-3 h-4 w-4 ${isActive ? 'text-theme-primary' : 'text-theme-tertiary'}`} 
                        aria-hidden="true" 
                      />
                      <div className="flex-1 text-left">
                        <div className={isActive ? 'text-theme-primary' : 'text-theme-primary'}>
                          {themeOption.label}
                        </div>
                        <div className="text-xs text-theme-tertiary">
                          {themeOption.description}
                        </div>
                      </div>
                      {isActive && (
                        <div className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}