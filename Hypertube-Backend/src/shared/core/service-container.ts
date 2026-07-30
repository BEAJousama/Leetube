import { logger } from "../utils/logger";

// Base service interface for dependency injection
export interface IService {}

// Base repository interface
export interface IRepository {}

// Service container for dependency injection
class ServiceContainer {
  private services = new Map<string, any>();

  register<T>(name: string, service: T): void {
    if (this.services.has(name)) {
      // Service replacement detected - this is usually fine during hot reload
    }
    this.services.set(name, service);
    // Service registered successfully - keeping minimal logging for production
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }
}

export const container = new ServiceContainer();

// Decorators for dependency injection
export function Service(name?: string) {
  return function<T extends new (...args: any[]) => any>(constructor: T) {
    const serviceName = name || constructor.name;
    const instance = new constructor();
    container.register(serviceName, instance);
    logger.info(`Registered service: ${serviceName}`);
    return constructor;
  };
}


export function Repository(name?: string) {
  return function<T extends new (...args: any[]) => any>(constructor: T) {
    const repoName = name || constructor.name;
    const instance = new constructor();
    container.register(repoName, instance);
    return constructor;
  };
}

// Simple getter for services
export function getService<T>(serviceName: string): T {
  return container.get<T>(serviceName);
}
