/**
 * Dependency Injection Container for Resources Module
 * Manages dependencies and provides singleton instances
 */

import { ManageResourcesUseCase } from '../usecases/ManageResourcesUseCase';
import { ShareResourceUseCase } from '../usecases/ShareResourceUseCase';
import { ResourcePresenter } from '../presenters/ResourcePresenter';
import { DjangoResourceAdapter } from '../adapters/DjangoResourceAdapter';

// Repository interfaces
import { ResourceRepository } from '../repositories/ResourceRepository';
import { ResourceCategoryRepository } from '../repositories/ResourceCategoryRepository';
import { ResourceShareRepository } from '../repositories/ResourceShareRepository';

export class ResourcesContainer {
  private static instance: ResourcesContainer;

  // Adapters (Infrastructure Layer)
  private _djangoResourceAdapter?: DjangoResourceAdapter;
  private _djangoCategoryAdapter?: DjangoResourceAdapter; // Would be DjangoCategoryAdapter
  private _djangoShareAdapter?: DjangoResourceAdapter; // Would be DjangoShareAdapter

  // Use Cases (Application Layer)
  private _manageResourcesUseCase?: ManageResourcesUseCase;
  private _shareResourceUseCase?: ShareResourceUseCase;

  // Presenters (Interface Adapters Layer)
  private _resourcePresenter?: ResourcePresenter;

  private constructor() {}

  static getInstance(): ResourcesContainer {
    if (!ResourcesContainer.instance) {
      ResourcesContainer.instance = new ResourcesContainer();
    }
    return ResourcesContainer.instance;
  }

  // Adapter Factories (Infrastructure Layer)
  getDjangoResourceAdapter(): DjangoResourceAdapter {
    if (!this._djangoResourceAdapter) {
      this._djangoResourceAdapter = new DjangoResourceAdapter();
    }
    return this._djangoResourceAdapter;
  }

  getDjangoCategoryAdapter(): ResourceCategoryRepository {
    if (!this._djangoCategoryAdapter) {
      // In a real implementation, this would be a proper DjangoCategoryAdapter
      this._djangoCategoryAdapter = new DjangoResourceAdapter();
    }
    return this._djangoCategoryAdapter as any;
  }

  getDjangoShareAdapter(): ResourceShareRepository {
    if (!this._djangoShareAdapter) {
      // In a real implementation, this would be a proper DjangoShareAdapter
      this._djangoShareAdapter = new DjangoResourceAdapter();
    }
    return this._djangoShareAdapter as any;
  }

  // Use Case Factories (Application Layer)
  getManageResourcesUseCase(): ManageResourcesUseCase {
    if (!this._manageResourcesUseCase) {
      this._manageResourcesUseCase = new ManageResourcesUseCase(
        this.getDjangoResourceAdapter(),
        this.getDjangoCategoryAdapter()
      );
    }
    return this._manageResourcesUseCase;
  }

  getShareResourceUseCase(): ShareResourceUseCase {
    if (!this._shareResourceUseCase) {
      this._shareResourceUseCase = new ShareResourceUseCase(
        this.getDjangoResourceAdapter(),
        this.getDjangoShareAdapter()
      );
    }
    return this._shareResourceUseCase;
  }

  // Presenter Factories (Interface Adapters Layer)
  getResourcePresenter(): ResourcePresenter {
    if (!this._resourcePresenter) {
      this._resourcePresenter = new ResourcePresenter();
    }
    return this._resourcePresenter;
  }

  // Convenience Methods for Common Use Cases
  getResourceManagementBundle() {
    return {
      useCase: this.getManageResourcesUseCase(),
      presenter: this.getResourcePresenter()
    };
  }

  getResourceSharingBundle() {
    return {
      useCase: this.getShareResourceUseCase(),
      presenter: this.getResourcePresenter()
    };
  }

  getAllUseCases() {
    return {
      manage: this.getManageResourcesUseCase(),
      share: this.getShareResourceUseCase()
    };
  }

  getAllPresenters() {
    return {
      resource: this.getResourcePresenter()
    };
  }

  getAllAdapters() {
    return {
      resource: this.getDjangoResourceAdapter(),
      category: this.getDjangoCategoryAdapter(),
      share: this.getDjangoShareAdapter()
    };
  }

  // Testing Support
  replaceAdapter(type: 'resource' | 'category' | 'share', adapter: any) {
    switch (type) {
      case 'resource':
        this._djangoResourceAdapter = adapter;
        this._manageResourcesUseCase = undefined; // Force re-creation
        this._shareResourceUseCase = undefined;
        break;
      case 'category':
        this._djangoCategoryAdapter = adapter;
        this._manageResourcesUseCase = undefined;
        break;
      case 'share':
        this._djangoShareAdapter = adapter;
        this._shareResourceUseCase = undefined;
        break;
    }
  }

  replaceUseCase(type: 'manage' | 'share', useCase: any) {
    switch (type) {
      case 'manage':
        this._manageResourcesUseCase = useCase;
        break;
      case 'share':
        this._shareResourceUseCase = useCase;
        break;
    }
  }

  replacePresenter(presenter: ResourcePresenter) {
    this._resourcePresenter = presenter;
  }

  // Reset for testing
  reset() {
    this._djangoResourceAdapter = undefined;
    this._djangoCategoryAdapter = undefined;
    this._djangoShareAdapter = undefined;
    this._manageResourcesUseCase = undefined;
    this._shareResourceUseCase = undefined;
    this._resourcePresenter = undefined;
  }
}

// Convenience function for getting the container
export const getResourcesContainer = () => ResourcesContainer.getInstance();

// Convenience functions for common use cases
export const getResourceManagement = () => 
  ResourcesContainer.getInstance().getResourceManagementBundle();

export const getResourceSharing = () => 
  ResourcesContainer.getInstance().getResourceSharingBundle();