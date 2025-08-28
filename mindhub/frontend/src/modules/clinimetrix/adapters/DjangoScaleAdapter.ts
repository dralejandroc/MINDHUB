/**
 * Django Scale Repository Adapter
 * Implements ScaleRepository interface for Django backend
 * Follows Clean Architecture: Interface Adapters Layer
 */

import { Scale } from '../entities/Scale';
import { ScaleRepository, ScaleFilters } from '../repositories/ScaleRepository';

export class DjangoScaleAdapter implements ScaleRepository {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '/api/clinimetrix-pro/django') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  async findById(id: string): Promise<Scale | undefined> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/scales/${id}/`);
      const data = await response.json();
      return this.mapToScaleEntity(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return undefined;
      }
      throw error;
    }
  }

  async findAll(filters?: ScaleFilters): Promise<Scale[]> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await this.fetchWithAuth(`${this.baseUrl}/scales/?${params}`);
    const data = await response.json();
    
    return data.results.map((scale: any) => this.mapToScaleEntity(scale));
  }

  async search(query: string, filters?: ScaleFilters): Promise<Scale[]> {
    const params = new URLSearchParams({ search: query });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await this.fetchWithAuth(`${this.baseUrl}/scales/search/?${params}`);
    const data = await response.json();
    
    return data.results.map((scale: any) => this.mapToScaleEntity(scale));
  }

  async getScaleTemplate(id: string): Promise<Scale | undefined> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/scales/${id}/template/`);
      const data = await response.json();
      return this.mapToScaleEntity(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return undefined;
      }
      throw error;
    }
  }

  async findByCategory(category: string): Promise<Scale[]> {
    return this.findAll({ category });
  }

  async getFeaturedScales(limit: number = 10): Promise<Scale[]> {
    const params = new URLSearchParams({
      is_featured: 'true',
      limit: limit.toString()
    });

    const response = await this.fetchWithAuth(`${this.baseUrl}/scales/?${params}`);
    const data = await response.json();
    
    return data.results.map((scale: any) => this.mapToScaleEntity(scale));
  }

  async getPopularScales(limit: number = 10): Promise<Scale[]> {
    const params = new URLSearchParams({
      ordering: '-popularity',
      limit: limit.toString()
    });

    const response = await this.fetchWithAuth(`${this.baseUrl}/scales/?${params}`);
    const data = await response.json();
    
    return data.results.map((scale: any) => this.mapToScaleEntity(scale));
  }

  async existsAndActive(id: string): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/scales/${id}/status/`);
      const data = await response.json();
      return data.exists && data.is_active;
    } catch {
      return false;
    }
  }

  async getScalesForUserLevel(
    userLevel: string,
    userExperience?: 'beginner' | 'intermediate' | 'expert'
  ): Promise<Scale[]> {
    const params = new URLSearchParams({
      professional_level: userLevel
    });

    if (userExperience) {
      params.append('user_experience', userExperience);
    }

    const response = await this.fetchWithAuth(`${this.baseUrl}/scales/for-user/?${params}`);
    const data = await response.json();
    
    return data.results.map((scale: any) => this.mapToScaleEntity(scale));
  }

  private mapToScaleEntity(data: any): Scale {
    return new Scale(
      data.id,
      data.name,
      data.abbreviation,
      data.description,
      data.items || [],
      data.category,
      data.target_population,
      data.administration_time || '10-15 min',
      data.professional_level || [],
      data.administration_mode,
      data.difficulty,
      data.score_range || { min: 0, max: 100 },
      data.subscales || [],
      data.interpretation_rules || [],
      data.reverse_scored || [],
      data.authors || [],
      data.year || new Date().getFullYear(),
      data.language || 'es',
      data.version || '1.0',
      data.keywords || [],
      data.is_active || true,
      data.is_featured || false,
      data.is_public || true,
      data.popularity || 0,
      data.reliability || {},
      data.validity || {},
      data.norms || {},
      data.references || [],
      data.clinical_notes || [],
      data.created_at ? new Date(data.created_at) : undefined,
      data.updated_at ? new Date(data.updated_at) : undefined
    );
  }
}