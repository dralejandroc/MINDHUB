/**
 * Service Entity
 * Core business logic for financial services/products - Pure domain model
 * No external dependencies, framework-agnostic
 */

export type ServiceType = 'consultation' | 'therapy' | 'evaluation' | 'procedure' | 'medication' | 'other';
export type ServiceStatus = 'active' | 'inactive' | 'archived';
export type PricingType = 'fixed' | 'variable' | 'tiered' | 'time_based';

export interface PriceTier {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
}

export class Service {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly serviceType: ServiceType,
    public readonly category: ServiceCategory,
    public readonly basePrice: number,
    public readonly currency: string,
    public readonly pricingType: PricingType,
    public readonly status: ServiceStatus,
    public readonly code: string,
    public readonly duration: number, // in minutes
    public readonly isActive: boolean = true,
    public readonly requiresAuthorization: boolean = false,
    public readonly maxSessionsPerDay: number = 0, // 0 = unlimited
    public readonly priceTiers: PriceTier[] = [],
    public readonly discountEligible: boolean = true,
    public readonly taxable: boolean = true,
    public readonly professionalIds: string[] = [], // Who can provide this service
    public readonly equipmentRequired: string[] = [],
    public readonly notes: string = '',
    public readonly clinicId?: string,
    public readonly workspaceId?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate();
  }

  /**
   * Business rule: Validate service data
   */
  private validate(): void {
    if (!this.name.trim()) {
      throw new Error('Service name is required');
    }

    if (this.basePrice < 0) {
      throw new Error('Base price cannot be negative');
    }

    if (!this.code.trim()) {
      throw new Error('Service code is required');
    }

    if (this.duration < 0) {
      throw new Error('Duration cannot be negative');
    }

    // Business rule: Must belong to either clinic or workspace
    if (!this.clinicId && !this.workspaceId) {
      throw new Error('Service must belong to either a clinic or workspace');
    }

    if (this.clinicId && this.workspaceId) {
      throw new Error('Service cannot belong to both clinic and workspace');
    }

    // Business rule: Validate price tiers if tiered pricing
    if (this.pricingType === 'tiered' && this.priceTiers.length === 0) {
      throw new Error('Tiered pricing requires at least one price tier');
    }

    // Business rule: Validate tier structure
    if (this.priceTiers.length > 0) {
      this.validatePriceTiers();
    }

    // Business rule: Sessions per day validation
    if (this.maxSessionsPerDay < 0) {
      throw new Error('Max sessions per day cannot be negative');
    }
  }

  /**
   * Business rule: Validate price tiers structure
   */
  private validatePriceTiers(): void {
    const sortedTiers = [...this.priceTiers].sort((a, b) => a.minQuantity - b.minQuantity);

    for (let i = 0; i < sortedTiers.length; i++) {
      const tier = sortedTiers[i];
      
      if (tier.minQuantity <= 0) {
        throw new Error('Price tier minimum quantity must be positive');
      }

      if (tier.price < 0) {
        throw new Error('Price tier price cannot be negative');
      }

      if (tier.maxQuantity && tier.maxQuantity <= tier.minQuantity) {
        throw new Error('Price tier maximum quantity must be greater than minimum');
      }

      // Check for overlaps with next tier
      if (i < sortedTiers.length - 1) {
        const nextTier = sortedTiers[i + 1];
        const currentMax = tier.maxQuantity || Infinity;
        
        if (currentMax >= nextTier.minQuantity) {
          throw new Error('Price tier ranges cannot overlap');
        }
      }
    }
  }

  /**
   * Business logic: Calculate price for given quantity
   */
  calculatePrice(quantity: number = 1, discountPercentage: number = 0): number {
    let price = 0;

    switch (this.pricingType) {
      case 'fixed':
        price = this.basePrice;
        break;

      case 'variable':
        price = this.basePrice * quantity;
        break;

      case 'time_based':
        // Price per minute, quantity represents minutes
        price = (this.basePrice / 60) * quantity;
        break;

      case 'tiered':
        price = this.calculateTieredPrice(quantity);
        break;

      default:
        price = this.basePrice;
    }

    // Apply discount if service is discount eligible
    if (this.discountEligible && discountPercentage > 0) {
      const maxDiscount = 50; // Maximum 50% discount
      const validDiscount = Math.min(discountPercentage, maxDiscount);
      price = price * (1 - validDiscount / 100);
    }

    return Math.round(price * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Business logic: Calculate tiered pricing
   */
  private calculateTieredPrice(quantity: number): number {
    if (this.priceTiers.length === 0) {
      return this.basePrice * quantity;
    }

    const applicableTier = this.priceTiers.find(tier => 
      quantity >= tier.minQuantity && 
      (!tier.maxQuantity || quantity <= tier.maxQuantity)
    );

    if (!applicableTier) {
      // If no tier matches, use the highest tier or base price
      const highestTier = this.priceTiers[this.priceTiers.length - 1];
      return highestTier ? highestTier.price * quantity : this.basePrice * quantity;
    }

    return applicableTier.price * quantity;
  }

  /**
   * Business logic: Check if service can be provided by professional
   */
  canBeProvidedBy(professionalId: string): boolean {
    return this.professionalIds.length === 0 || this.professionalIds.includes(professionalId);
  }

  /**
   * Business logic: Check if service is available for booking
   */
  isAvailable(): boolean {
    return this.isActive && this.status === 'active';
  }

  /**
   * Business logic: Check if service requires authorization
   */
  needsAuthorization(): boolean {
    return this.requiresAuthorization;
  }

  /**
   * Business logic: Get estimated duration range
   */
  getDurationRange(): { min: number; max: number; unit: string } {
    const baseMin = this.duration;
    const baseMax = this.duration + (this.duration * 0.2); // 20% buffer

    return {
      min: baseMin,
      max: Math.round(baseMax),
      unit: 'minutes'
    };
  }

  /**
   * Business logic: Check if service can be scheduled today
   */
  canBeScheduledToday(currentSessionsToday: number = 0): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    if (this.maxSessionsPerDay === 0) {
      return true; // Unlimited sessions
    }

    return currentSessionsToday < this.maxSessionsPerDay;
  }

  /**
   * Business logic: Get formatted price
   */
  getFormattedPrice(quantity: number = 1, discountPercentage: number = 0): string {
    const price = this.calculatePrice(quantity, discountPercentage);
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: this.currency
    }).format(price);
  }

  /**
   * Business logic: Archive service
   */
  archive(reason?: string): Service {
    if (this.status === 'archived') {
      throw new Error('Service is already archived');
    }

    const updatedNotes = reason 
      ? `${this.notes}\nArchived: ${new Date().toISOString()} - ${reason}`
      : `${this.notes}\nArchived: ${new Date().toISOString()}`;

    return new Service(
      this.id,
      this.name,
      this.description,
      this.serviceType,
      this.category,
      this.basePrice,
      this.currency,
      this.pricingType,
      'archived',
      this.code,
      this.duration,
      false, // isActive = false
      this.requiresAuthorization,
      this.maxSessionsPerDay,
      this.priceTiers,
      this.discountEligible,
      this.taxable,
      this.professionalIds,
      this.equipmentRequired,
      updatedNotes,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Update pricing
   */
  updatePricing(
    newBasePrice: number,
    newPricingType?: PricingType,
    newPriceTiers?: PriceTier[]
  ): Service {
    if (newBasePrice < 0) {
      throw new Error('New base price cannot be negative');
    }

    return new Service(
      this.id,
      this.name,
      this.description,
      this.serviceType,
      this.category,
      newBasePrice,
      this.currency,
      newPricingType || this.pricingType,
      this.status,
      this.code,
      this.duration,
      this.isActive,
      this.requiresAuthorization,
      this.maxSessionsPerDay,
      newPriceTiers || this.priceTiers,
      this.discountEligible,
      this.taxable,
      this.professionalIds,
      this.equipmentRequired,
      `${this.notes}\nPricing updated: ${new Date().toISOString()}`,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Add professional who can provide this service
   */
  addProfessional(professionalId: string): Service {
    if (this.professionalIds.includes(professionalId)) {
      return this; // Already exists
    }

    return new Service(
      this.id,
      this.name,
      this.description,
      this.serviceType,
      this.category,
      this.basePrice,
      this.currency,
      this.pricingType,
      this.status,
      this.code,
      this.duration,
      this.isActive,
      this.requiresAuthorization,
      this.maxSessionsPerDay,
      this.priceTiers,
      this.discountEligible,
      this.taxable,
      [...this.professionalIds, professionalId],
      this.equipmentRequired,
      this.notes,
      this.clinicId,
      this.workspaceId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Business logic: Get service complexity score (for scheduling)
   */
  getComplexityScore(): number {
    let score = 1; // Base complexity

    // Duration complexity
    if (this.duration > 120) score += 3; // > 2 hours
    else if (this.duration > 60) score += 2; // > 1 hour
    else if (this.duration > 30) score += 1; // > 30 minutes

    // Equipment complexity
    score += this.equipmentRequired.length * 0.5;

    // Authorization complexity
    if (this.requiresAuthorization) score += 1;

    // Specialized professional complexity
    if (this.professionalIds.length > 0 && this.professionalIds.length < 3) {
      score += 2; // Limited professionals
    }

    return Math.min(score, 10); // Cap at 10
  }
}