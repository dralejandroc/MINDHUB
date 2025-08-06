import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PatientManagementAdvanced from '@/components/expedix/PatientManagementAdvanced';
import { mockTabletDevice, mockDesktopDevice } from '../setup';

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  formatDate: (date: string) => new Date(date).toLocaleDateString('es-MX'),
  getInitials: (name: string) => {
    const parts = name.split(' ');
    return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
  },
  isTabletDevice: () => {
    return window.innerWidth >= 768 && window.innerWidth <= 1024 && 
           navigator.maxTouchPoints > 0;
  }
}));

// Mock design system
jest.mock('@/lib/design-system', () => ({
  getHubColor: (hub: string) => ({
    expedix: '#22c55e',
    formx: '#a855f7',
    clinimetrix: '#3b82f6'
  }[hub] || '#6b7280')
}));

describe('Patient Management Integration Tests', () => {
  const mockProps = {
    onSelectPatient: jest.fn(),
    onNewPatient: jest.fn(),
    onNewConsultation: jest.fn(),
    onClinicalAssessment: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDesktopDevice();
  });

  describe('Initial Load and Data Display', () => {
    it('should show loading state initially', () => {
      render(<PatientManagementAdvanced {...mockProps} />);
      
      expect(screen.getByText('Cargando pacientes...')).toBeInTheDocument();
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    });

    it('should display patients after loading', async () => {
      render(<PatientManagementAdvanced {...mockProps} />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      // Should show patient cards
      expect(screen.getByText('María González Rodríguez')).toBeInTheDocument();
      expect(screen.getByText('Juan Carlos Mendoza')).toBeInTheDocument();
      expect(screen.getByText('Ana Patricia López')).toBeInTheDocument();
    });

    it('should display correct patient statistics', async () => {
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Check stats
      expect(screen.getByText('3')).toBeInTheDocument(); // Total patients
      expect(screen.getByText('Pacientes')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Appointments scheduled
      expect(screen.getByText('Citas Programadas')).toBeInTheDocument();
      expect(screen.getByText('Activos')).toBeInTheDocument();
      expect(screen.getByText('Pendientes')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter patients by search term', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      await user.type(searchInput, 'María');

      // Should show only María González
      expect(screen.getByText('María González Rodríguez')).toBeInTheDocument();
      expect(screen.queryByText('Juan Carlos Mendoza')).not.toBeInTheDocument();
      expect(screen.queryByText('Ana Patricia López')).not.toBeInTheDocument();
    });

    it('should filter by email', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      await user.type(searchInput, 'juan.mendoza');

      expect(screen.getByText('Juan Carlos Mendoza')).toBeInTheDocument();
      expect(screen.queryByText('María González Rodríguez')).not.toBeInTheDocument();
    });

    it('should filter by phone number', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      await user.type(searchInput, '3456');

      expect(screen.getByText('Ana Patricia López')).toBeInTheDocument();
      expect(screen.queryByText('María González Rodríguez')).not.toBeInTheDocument();
    });

    it('should show no results message when no matches', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      await user.type(searchInput, 'NoExiste');

      expect(screen.getByText('No se encontraron pacientes')).toBeInTheDocument();
      expect(screen.getByText('Intenta con otros términos de búsqueda')).toBeInTheDocument();
    });
  });

  describe('View Mode Toggle', () => {
    it('should switch between grid and list view', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Initially in grid view
      const toggleButton = screen.getByText('Vista Lista');
      await user.click(toggleButton);

      // Should switch to list view
      expect(screen.getByText('Vista Tarjetas')).toBeInTheDocument();
      
      // Click again to switch back
      await user.click(screen.getByText('Vista Tarjetas'));
      expect(screen.getByText('Vista Lista')).toBeInTheDocument();
    });

    it('should display patients differently in grid vs list view', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Check grid layout classes
      const container = screen.getByText('María González Rodríguez').closest('[class*="grid"]');
      expect(container).toHaveClass('grid');

      // Switch to list view
      const toggleButton = screen.getByText('Vista Lista');
      await user.click(toggleButton);

      // Should now have list layout
      const listContainer = screen.getByText('María González Rodríguez').closest('[class*="space-y"]');
      expect(listContainer).toHaveClass('space-y-3');
    });
  });

  describe('Patient Card Interactions', () => {
    it('should open patient details modal when card is clicked', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      const patientCard = screen.getByText('María González Rodríguez').closest('[role="button"]');
      await user.click(patientCard!);

      // Modal should open
      expect(screen.getByText('Detalles de María González Rodríguez')).toBeInTheDocument();
      expect(screen.getByText('Información de Contacto')).toBeInTheDocument();
      expect(screen.getByText('Contacto de Emergencia')).toBeInTheDocument();
      expect(screen.getByText('Resumen Médico')).toBeInTheDocument();
    });

    it('should display patient medical information in modal', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      const patientCard = screen.getByText('María González Rodríguez').closest('[role="button"]');
      await user.click(patientCard!);

      // Check medical information
      expect(screen.getByText('Polen')).toBeInTheDocument();
      expect(screen.getByText('Mariscos')).toBeInTheDocument();
      expect(screen.getByText('Sertralina 50mg')).toBeInTheDocument();
      expect(screen.getByText('Ansiedad generalizada')).toBeInTheDocument();
    });

    it('should call onSelectPatient when card is clicked', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      const patientCard = screen.getByText('María González Rodríguez').closest('[role="button"]');
      await user.click(patientCard!);

      expect(mockProps.onSelectPatient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'María González Rodríguez',
          email: 'maria.gonzalez@email.com'
        })
      );
    });

    it('should handle quick action buttons correctly', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Click consultation button (should not trigger card click)
      const consultaButtons = screen.getAllByText('Consulta');
      await user.click(consultaButtons[0]);

      expect(mockProps.onNewConsultation).toHaveBeenCalledTimes(1);
      expect(mockProps.onSelectPatient).not.toHaveBeenCalled();
    });
  });

  describe('New Patient Button', () => {
    it('should call onNewPatient when new patient button is clicked', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      const newPatientButton = screen.getByText('Nuevo Paciente');
      await user.click(newPatientButton);

      expect(mockProps.onNewPatient).toHaveBeenCalledTimes(1);
    });

    it('should show new patient button when no patients found', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Search for non-existent patient
      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      await user.type(searchInput, 'NoExiste');

      // Should not show "Agregar Paciente" button in empty search results
      expect(screen.queryByText('Agregar Paciente')).not.toBeInTheDocument();
    });
  });

  describe('Tablet Optimization', () => {
    it('should adapt layout for tablet devices', async () => {
      mockTabletDevice();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Title should be larger on tablets
      const title = screen.getByText('Gestión de Pacientes');
      expect(title).toHaveClass('text-3xl');

      // Cards should have larger padding
      const patientCard = screen.getByText('María González Rodríguez').closest('[class*="p-"]');
      expect(patientCard).toHaveClass('p-6');
    });

    it('should use touch-optimized components on tablets', async () => {
      mockTabletDevice();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Search input should be touch-optimized
      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      expect(searchInput).toHaveClass('min-h-[44px]');

      // Buttons should be touch-optimized
      const newPatientButton = screen.getByText('Nuevo Paciente');
      expect(newPatientButton).toHaveStyle({ minHeight: '44px' });
    });

    it('should show appropriate grid columns for tablet', async () => {
      mockTabletDevice();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Grid should use tablet-specific columns
      const gridContainer = screen.getByText('María González Rodríguez')
        .closest('[class*="grid"]');
      expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2', 'xl:grid-cols-3');
    });
  });

  describe('Status Display', () => {
    it('should display correct status badges', async () => {
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Check status badges
      expect(screen.getAllByText('Activo')).toHaveLength(2);
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('should show correct status colors', async () => {
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Active status should have green styling
      const activeStatus = screen.getAllByText('Activo')[0];
      expect(activeStatus).toHaveClass('bg-green-100', 'text-green-800');

      // Pending status should have yellow styling
      const pendingStatus = screen.getByText('Pendiente');
      expect(pendingStatus).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });

  describe('Modal Functionality', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Open modal
      const patientCard = screen.getByText('María González Rodríguez').closest('[role="button"]');
      await user.click(patientCard!);

      // Close modal
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Modal should be closed
      expect(screen.queryByText('Detalles de María González Rodríguez')).not.toBeInTheDocument();
    });

    it('should handle modal action buttons', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Open modal
      const patientCard = screen.getByText('María González Rodríguez').closest('[role="button"]');
      await user.click(patientCard!);

      // Click "Nueva Consulta" in modal
      const newConsultationButton = screen.getByText('Nueva Consulta');
      await user.click(newConsultationButton);

      expect(mockProps.onNewConsultation).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'María González Rodríguez'
        })
      );

      // Click "Evaluación Clínica" in modal
      const clinicalAssessmentButton = screen.getByText('Evaluación Clínica');
      await user.click(clinicalAssessmentButton);

      expect(mockProps.onClinicalAssessment).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'María González Rodríguez'
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA labels', async () => {
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Search input should have proper label
      const searchInput = screen.getByPlaceholderText(/buscar pacientes/i);
      expect(searchInput).toBeInTheDocument();

      // Buttons should have accessible names
      const newPatientButton = screen.getByRole('button', { name: /nuevo paciente/i });
      expect(newPatientButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Tab to search input
      await user.tab();
      expect(screen.getByPlaceholderText(/buscar pacientes/i)).toHaveFocus();

      // Tab to view toggle button
      await user.tab();
      expect(screen.getByText('Vista Lista')).toHaveFocus();

      // Tab to new patient button
      await user.tab();
      expect(screen.getByText('Nuevo Paciente')).toHaveFocus();
    });

    it('should handle escape key to close modal', async () => {
      const user = userEvent.setup();
      render(<PatientManagementAdvanced {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando pacientes...')).not.toBeInTheDocument();
      });

      // Open modal
      const patientCard = screen.getByText('María González Rodríguez').closest('[role="button"]');
      await user.click(patientCard!);

      // Press escape
      await user.keyboard('{Escape}');

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Detalles de María González Rodríguez')).not.toBeInTheDocument();
      });
    });
  });
});