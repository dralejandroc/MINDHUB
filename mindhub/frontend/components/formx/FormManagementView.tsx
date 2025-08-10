'use client';

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  DocumentTextIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  UserGroupIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface FormManagementViewProps {
  forms: any[];
  onEditForm: (form: any) => void;
  onDuplicateForm: (form: any) => void;
  onAssignForm: (form: any) => void;
  onRefresh: () => void;
}

export const FormManagementView: React.FC<FormManagementViewProps> = ({
  forms,
  onEditForm,
  onDuplicateForm,
  onAssignForm,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'usage'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<any[]>([]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/formx/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Filter and sort forms
  const filteredAndSortedForms = forms
    .filter(form => {
      const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = !categoryFilter || form.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.created_at || a.createdAt).getTime() - new Date(b.created_at || b.createdAt).getTime();
          break;
        case 'usage':
          comparison = (a.usage_count || 0) - (b.usage_count || 0);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const handleDeleteForm = async (form: any) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${form.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/formx/forms/${form.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Formulario eliminado exitosamente');
        onRefresh();
      } else {
        toast.error('Error al eliminar el formulario');
      }
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Error al eliminar el formulario');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredAndSortedForms.map((form) => (
        <div key={form.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{form.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{getCategoryName(form.category)}</p>
              </div>
              <DocumentTextIcon className="h-5 w-5 text-emerald-600 flex-shrink-0 ml-2" />
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {form.description && (
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">{form.description}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="text-center p-2 bg-emerald-50 rounded">
                <div className="text-sm font-semibold text-emerald-600">
                  {form.sections?.reduce((acc: number, section: any) => acc + (section.fields?.length || 0), 0) || 0}
                </div>
                <div className="text-xs text-emerald-700">Campos</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-sm font-semibold text-blue-600">{form.total_assignments || 0}</div>
                <div className="text-xs text-blue-700">Asignaciones</div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-1 text-xs text-gray-500 mb-4">
              <div className="flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span>Creado {formatDate(form.created_at || form.createdAt)}</span>
              </div>
              {form.usage_count > 0 && (
                <div className="flex items-center">
                  <EyeIcon className="h-3 w-3 mr-1" />
                  <span>Usado {form.usage_count} veces</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-1">
              <Button
                onClick={() => onEditForm(form)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <PencilIcon className="h-3 w-3 mr-1" />
                Editar
              </Button>
              <Button
                onClick={() => onAssignForm(form)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <UserGroupIcon className="h-3 w-3 mr-1" />
                Asignar
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-1 mt-1">
              <Button
                onClick={() => onDuplicateForm(form)}
                variant="outline"
                size="sm"
                className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
                Duplicar
              </Button>
              <Button
                onClick={() => handleDeleteForm(form)}
                variant="outline"
                size="sm"
                className="text-xs text-red-600 border-red-200 hover:bg-red-50"
              >
                <TrashIcon className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Formulario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campos</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignaciones</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedForms.map((form) => (
              <tr key={form.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{form.title}</div>
                    {form.description && (
                      <div className="text-xs text-gray-500 line-clamp-1">{form.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                    {getCategoryName(form.category)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {form.sections?.reduce((acc: number, section: any) => acc + (section.fields?.length || 0), 0) || 0}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {form.total_assignments || 0}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDate(form.created_at || form.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => onEditForm(form)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => onAssignForm(form)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <UserGroupIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => onDuplicateForm(form)}
                      variant="outline"
                      size="sm"
                      className="text-xs text-blue-600 border-blue-200"
                    >
                      <DocumentDuplicateIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteForm(form)}
                      variant="outline"
                      size="sm"
                      className="text-xs text-red-600 border-red-200"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar formularios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="lg:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="lg:w-40">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy as 'date' | 'name' | 'usage');
                setSortOrder(newSortOrder as 'asc' | 'desc');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="date-desc">Más recientes</option>
              <option value="date-asc">Más antiguos</option>
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
              <option value="usage-desc">Más usados</option>
              <option value="usage-asc">Menos usados</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-xs font-medium ${
                viewMode === 'grid' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cuadrícula
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-xs font-medium ${
                viewMode === 'list' 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Lista
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando {filteredAndSortedForms.length} de {forms.length} formularios
          </p>
        </div>
      </div>

      {/* Forms Display */}
      {filteredAndSortedForms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || categoryFilter ? 'No se encontraron formularios' : 'No hay formularios'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || categoryFilter 
              ? 'Prueba con diferentes términos de búsqueda o filtros'
              : 'Crea tu primer formulario para comenzar'
            }
          </p>
          {(!searchTerm && !categoryFilter) && (
            <Button variant="primary">
              <PlusIcon className="h-4 w-4 mr-2" />
              Crear Formulario
            </Button>
          )}
        </div>
      ) : (
        viewMode === 'grid' ? renderGridView() : renderListView()
      )}
    </div>
  );
};