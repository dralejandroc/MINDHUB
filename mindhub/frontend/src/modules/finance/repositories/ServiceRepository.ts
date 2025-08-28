/**
 * Service Repository Interface
 * Abstraction for medical service data access operations
 */

import { Service } from '../entities/Service';

export interface ServiceFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  isActive?: boolean;
  professionalId?: string;
  clinicId?: string;
  workspaceId?: string;
  searchTerm?: string;
}

export interface ServiceStatistics {
  totalServices: number;
  activeServices: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  byCategory: Record<string, number>;
  mostUsed: Array<{
    service: Service;
    usageCount: number;
  }>;
}

export interface ServiceRepository {
  // Basic CRUD
  create(service: Service): Promise<Service>;
  findById(id: string): Promise<Service | null>;
  findAll(filters?: ServiceFilters): Promise<Service[]>;
  update(service: Service): Promise<Service>;
  delete(id: string): Promise<void>;
  
  // Specialized queries
  findByCategory(category: string): Promise<Service[]>;
  findByPriceRange(minPrice: number, maxPrice: number): Promise<Service[]>;
  findByProfessional(professionalId: string): Promise<Service[]>;
  findActive(): Promise<Service[]>;
  search(term: string, filters?: ServiceFilters): Promise<Service[]>;
  
  // Service management
  activate(id: string): Promise<Service>;
  deactivate(id: string): Promise<Service>;
  updatePrice(id: string, newPrice: number): Promise<Service>;
  updateDuration(id: string, newDuration: number): Promise<Service>;
  
  // Categories
  getCategories(): Promise<string[]>;
  getServicesByCategory(): Promise<Record<string, Service[]>>;
  
  // Statistics
  getStatistics(filters?: ServiceFilters): Promise<ServiceStatistics>;
  getUsageStatistics(startDate: Date, endDate: Date): Promise<Array<{
    service: Service;
    usageCount: number;
    revenue: number;
  }>>;
  
  // Pricing
  getMostExpensive(limit?: number): Promise<Service[]>;
  getMostAffordable(limit?: number): Promise<Service[]>;
  getAveragePrice(category?: string): Promise<number>;
  
  // Bulk operations
  createBulk(services: Service[]): Promise<Service[]>;
  updateBulk(updates: Array<{ id: string; changes: Partial<Service> }>): Promise<Service[]>;
  activateBulk(ids: string[]): Promise<void>;
  deactivateBulk(ids: string[]): Promise<void>;
}