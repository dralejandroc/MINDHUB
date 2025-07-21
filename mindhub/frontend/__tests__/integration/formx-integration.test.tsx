import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DragDropContext } from 'react-beautiful-dnd';
import FormBuilderAdvanced from '@/components/formx/FormBuilderAdvanced';
import { mockTabletDevice, mockDesktopDevice } from '../setup';

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  ...jest.requireActual('react-beautiful-dnd'),
  DragDropContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: any }) => (
    <div data-testid="drag-drop-context" data-on-drag-end={!!onDragEnd}>
      {children}
    </div>
  ),
  Droppable: ({ children, droppableId }: { children: any; droppableId: string }) => (
    <div data-testid={`droppable-${droppableId}`}>
      {children({ 
        innerRef: jest.fn(),
        droppableProps: {},
        placeholder: <div data-testid="placeholder" />
      })}
    </div>
  ),
  Draggable: ({ children, draggableId }: { children: any; draggableId: string }) => (
    <div data-testid={`draggable-${draggableId}`}>
      {children({
        innerRef: jest.fn(),
        draggableProps: { 'data-draggable': true },
        dragHandleProps: { 'data-drag-handle': true }
      })}
    </div>
  )
}));

describe('FormX Integration Tests', () => {
  beforeEach(() => {
    mockDesktopDevice();
  });

  describe('FormBuilder Core Functionality', () => {
    it('should render form builder with field palette', () => {
      render(<FormBuilderAdvanced />);
      
      // Check main sections
      expect(screen.getByText('Campos de Formulario')).toBeInTheDocument();
      expect(screen.getByText('Constructor de Formulario')).toBeInTheDocument();
      expect(screen.getByText('Vista Previa')).toBeInTheDocument();
      
      // Check field types are available
      expect(screen.getByText('Texto')).toBeInTheDocument();
      expect(screen.getByText('Área de Texto')).toBeInTheDocument();
      expect(screen.getByText('Selección')).toBeInTheDocument();
      expect(screen.getByText('Casilla Legal')).toBeInTheDocument();
      expect(screen.getByText('Historial Médico')).toBeInTheDocument();
      expect(screen.getByText('Contacto de Emergencia')).toBeInTheDocument();
    });

    it('should add field when clicking on field type', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      // Initially should show empty form message
      expect(screen.getByText('Arrastra campos aquí para crear tu formulario')).toBeInTheDocument();
      
      // Click on text field to add it
      await user.click(screen.getByText('Texto'));
      
      // Field should be added to form
      await waitFor(() => {
        expect(screen.getByDisplayValue('Campo de Texto')).toBeInTheDocument();
      });
    });

    it('should show field configuration when field is selected', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      // Add a text field
      await user.click(screen.getByText('Texto'));
      
      // Wait for field to be added and click on it
      await waitFor(() => {
        const fieldElement = screen.getByDisplayValue('Campo de Texto');
        expect(fieldElement).toBeInTheDocument();
      });
      
      // Click on the field to select it
      const fieldButton = screen.getByRole('button', { name: /campo de texto/i });
      await user.click(fieldButton);
      
      // Configuration panel should appear
      expect(screen.getByText('Configuración del Campo')).toBeInTheDocument();
      expect(screen.getByLabelText('Etiqueta:')).toBeInTheDocument();
      expect(screen.getByLabelText('Texto de ayuda:')).toBeInTheDocument();
    });

    it('should update field configuration', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      // Add a text field
      await user.click(screen.getByText('Texto'));
      
      // Select the field
      await waitFor(() => {
        const fieldButton = screen.getByRole('button', { name: /campo de texto/i });
        return user.click(fieldButton);
      });
      
      // Update field label
      const labelInput = screen.getByLabelText('Etiqueta:');
      await user.clear(labelInput);
      await user.type(labelInput, 'Nombre Completo');
      
      // Update placeholder
      const placeholderInput = screen.getByLabelText('Placeholder:');
      await user.clear(placeholderInput);
      await user.type(placeholderInput, 'Ingrese su nombre completo');
      
      // Field should update in preview
      await waitFor(() => {
        expect(screen.getByDisplayValue('Nombre Completo')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Ingrese su nombre completo')).toBeInTheDocument();
      });
    });

    it('should remove field when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      // Add a text field
      await user.click(screen.getByText('Texto'));
      
      // Select the field
      await waitFor(() => {
        const fieldButton = screen.getByRole('button', { name: /campo de texto/i });
        return user.click(fieldButton);
      });
      
      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /eliminar campo/i });
      await user.click(deleteButton);
      
      // Field should be removed
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Campo de Texto')).not.toBeInTheDocument();
        expect(screen.getByText('Arrastra campos aquí para crear tu formulario')).toBeInTheDocument();
      });
    });
  });

  describe('FormX-Specific Fields', () => {
    it('should render legal checkbox field correctly', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      await user.click(screen.getByText('Casilla Legal'));
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Acepto los términos y condiciones')).toBeInTheDocument();
      });
      
      // Select and configure
      const fieldButton = screen.getByRole('button', { name: /acepto los términos/i });
      await user.click(fieldButton);
      
      // Should show legal-specific options
      expect(screen.getByLabelText('Texto legal:')).toBeInTheDocument();
      expect(screen.getByLabelText('Enlace a documento:')).toBeInTheDocument();
    });

    it('should render medical history field with proper structure', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      await user.click(screen.getByText('Historial Médico'));
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Historial Médico')).toBeInTheDocument();
      });
      
      // Select field to see configuration
      const fieldButton = screen.getByRole('button', { name: /historial médico/i });
      await user.click(fieldButton);
      
      // Should show medical-specific options
      expect(screen.getByLabelText('Incluir alergias:')).toBeInTheDocument();
      expect(screen.getByLabelText('Incluir medicamentos:')).toBeInTheDocument();
      expect(screen.getByLabelText('Incluir condiciones:')).toBeInTheDocument();
    });

    it('should render emergency contact field with contact options', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      await user.click(screen.getByText('Contacto de Emergencia'));
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Contacto de Emergencia')).toBeInTheDocument();
      });
      
      // Select field
      const fieldButton = screen.getByRole('button', { name: /contacto de emergencia/i });
      await user.click(fieldButton);
      
      // Should show emergency contact options
      expect(screen.getByLabelText('Incluir relación:')).toBeInTheDocument();
      expect(screen.getByLabelText('Teléfonos múltiples:')).toBeInTheDocument();
    });

    it('should render satisfaction rating field', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      await user.click(screen.getByText('Calificación'));
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Calificación de Satisfacción')).toBeInTheDocument();
      });
      
      // Select field
      const fieldButton = screen.getByRole('button', { name: /calificación de satisfacción/i });
      await user.click(fieldButton);
      
      // Should show rating options
      expect(screen.getByLabelText('Escala máxima:')).toBeInTheDocument();
      expect(screen.getByLabelText('Mostrar etiquetas:')).toBeInTheDocument();
    });
  });

  describe('Form Preview Functionality', () => {
    it('should show proper form preview with multiple fields', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      // Add multiple fields
      await user.click(screen.getByText('Texto'));
      await user.click(screen.getByText('Email'));
      await user.click(screen.getByText('Teléfono'));
      await user.click(screen.getByText('Casilla Legal'));
      
      // Wait for all fields to be added
      await waitFor(() => {
        expect(screen.getAllByRole('button').filter(btn => 
          btn.textContent?.includes('Campo de Texto') ||
          btn.textContent?.includes('Email') ||
          btn.textContent?.includes('Teléfono') ||
          btn.textContent?.includes('Acepto')
        )).toHaveLength(4);
      });
      
      // Preview should show all fields
      const previewSection = screen.getByTestId('form-preview');
      expect(previewSection).toBeInTheDocument();
    });

    it('should handle form validation in preview', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      // Add required text field
      await user.click(screen.getByText('Texto'));
      
      // Make field required
      await waitFor(() => {
        const fieldButton = screen.getByRole('button', { name: /campo de texto/i });
        return user.click(fieldButton);
      });
      
      const requiredCheckbox = screen.getByLabelText('Requerido:');
      await user.click(requiredCheckbox);
      
      // Preview should show required indicator
      await waitFor(() => {
        expect(screen.getByText('*')).toBeInTheDocument();
      });
    });

    it('should export form JSON correctly', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<FormBuilderAdvanced />);
      
      // Add a few fields
      await user.click(screen.getByText('Texto'));
      await user.click(screen.getByText('Email'));
      
      // Click export button
      const exportButton = screen.getByRole('button', { name: /exportar json/i });
      await user.click(exportButton);
      
      // Should log form JSON
      expect(consoleSpy).toHaveBeenCalledWith(
        'Form JSON:',
        expect.stringContaining('text')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Tablet Optimization', () => {
    it('should adapt interface for tablet devices', async () => {
      mockTabletDevice();
      
      render(<FormBuilderAdvanced />);
      
      // Field palette should have larger touch targets
      const fieldButtons = screen.getAllByRole('button').filter(btn =>
        ['Texto', 'Email', 'Teléfono'].includes(btn.textContent || '')
      );
      
      fieldButtons.forEach(button => {
        expect(button).toHaveClass('p-3'); // Larger padding for tablets
      });
    });

    it('should handle touch interactions properly', async () => {
      mockTabletDevice();
      const user = userEvent.setup();
      
      render(<FormBuilderAdvanced />);
      
      // Simulate touch interaction
      const textFieldButton = screen.getByText('Texto');
      
      // Touch start and end events
      fireEvent.touchStart(textFieldButton);
      fireEvent.touchEnd(textFieldButton);
      await user.click(textFieldButton);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Campo de Texto')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid field configurations gracefully', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      // Add field and try to set invalid configuration
      await user.click(screen.getByText('Número'));
      
      await waitFor(() => {
        const fieldButton = screen.getByRole('button', { name: /campo numérico/i });
        return user.click(fieldButton);
      });
      
      // Try to set invalid min/max values
      const minInput = screen.getByLabelText('Valor mínimo:');
      const maxInput = screen.getByLabelText('Valor máximo:');
      
      await user.clear(minInput);
      await user.type(minInput, '100');
      
      await user.clear(maxInput);
      await user.type(maxInput, '50'); // Max less than min
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/valor máximo debe ser mayor/i)).toBeInTheDocument();
      });
    });

    it('should handle missing required field data', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      // Add required field
      await user.click(screen.getByText('Texto'));
      
      await waitFor(() => {
        const fieldButton = screen.getByRole('button', { name: /campo de texto/i });
        return user.click(fieldButton);
      });
      
      const requiredCheckbox = screen.getByLabelText('Requerido:');
      await user.click(requiredCheckbox);
      
      // Clear the label (required for required fields)
      const labelInput = screen.getByLabelText('Etiqueta:');
      await user.clear(labelInput);
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/etiqueta es requerida/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should provide proper ARIA labels for form fields', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      await user.click(screen.getByText('Texto'));
      
      await waitFor(() => {
        const fieldButton = screen.getByRole('button', { name: /campo de texto/i });
        expect(fieldButton).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      // Tab through field palette
      await user.tab();
      expect(screen.getByText('Texto')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Área de Texto')).toHaveFocus();
      
      // Enter should activate field
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Área de Texto')).toBeInTheDocument();
      });
    });

    it('should announce changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<FormBuilderAdvanced />);
      
      await user.click(screen.getByText('Texto'));
      
      // Should have aria-live region for announcements
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });
  });
});