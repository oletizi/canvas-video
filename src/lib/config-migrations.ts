import type { PixelAnimationConfig } from '@/video/pixel-config-types';

export interface Migration<T = any> {
  version: string;
  description: string;
  migrate: (data: T) => T;
}

export class ConfigMigrator {
  private migrations: Migration<PixelAnimationConfig>[] = [
    {
      version: '1.0.0',
      description: 'Initial version',
      migrate: (data) => data
    },
    {
      version: '1.1.0',
      description: 'Add audio reactive features',
      migrate: (data) => {
        if (!data.audioReactive) {
          return {
            ...data,
            audioReactive: {
              vuMeterConfig: {
                attack: 0.1,
                release: 0.3
              },
              dynamicPixels: []
            }
          };
        }
        return data;
      }
    },
    {
      version: '1.2.0',
      description: 'Add keyframe support',
      migrate: (data) => {
        if (!data.keyframes) {
          return {
            ...data,
            keyframes: []
          };
        }
        return data;
      }
    },
    {
      version: '1.3.0',
      description: 'Enhanced metadata and tags',
      migrate: (data) => {
        if (!data.metadata.tags) {
          return {
            ...data,
            metadata: {
              ...data.metadata,
              tags: []
            }
          };
        }
        return data;
      }
    }
  ];

  getCurrentVersion(): string {
    return this.migrations[this.migrations.length - 1].version;
  }

  needsMigration(version: string): boolean {
    return this.compareVersions(version, this.getCurrentVersion()) < 0;
  }

  migrate(data: PixelAnimationConfig, fromVersion?: string): PixelAnimationConfig {
    const startVersion = fromVersion || data.version || '1.0.0';
    
    if (!this.needsMigration(startVersion)) {
      return data;
    }

    console.log(`Migrating config from version ${startVersion} to ${this.getCurrentVersion()}`);
    
    let migratedData = { ...data };
    
    // Apply migrations in order
    for (const migration of this.migrations) {
      if (this.compareVersions(startVersion, migration.version) < 0) {
        console.log(`Applying migration: ${migration.description} (${migration.version})`);
        migratedData = migration.migrate(migratedData);
        migratedData.version = migration.version;
      }
    }

    // Update metadata
    migratedData.metadata = {
      ...migratedData.metadata,
      modified: new Date().toISOString()
    };

    return migratedData;
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }
    
    return 0;
  }

  getMigrationPath(fromVersion: string): Migration<PixelAnimationConfig>[] {
    return this.migrations.filter(migration =>
      this.compareVersions(fromVersion, migration.version) < 0
    );
  }

  validateMigration(data: PixelAnimationConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic structure validation
    if (!data.id) errors.push('Missing config ID');
    if (!data.name) errors.push('Missing config name');
    if (!data.version) errors.push('Missing version');
    if (!data.canvas) errors.push('Missing canvas configuration');
    if (!data.initialFrame) errors.push('Missing initial frame');

    // Canvas validation
    if (data.canvas) {
      if (!data.canvas.pixelCols || data.canvas.pixelCols <= 0) {
        errors.push('Invalid pixel columns');
      }
      if (!data.canvas.pixelRows || data.canvas.pixelRows <= 0) {
        errors.push('Invalid pixel rows');
      }
    }

    // Pixels validation
    if (data.initialFrame?.pixels) {
      data.initialFrame.pixels.forEach((pixel, index) => {
        if (typeof pixel.x !== 'number' || typeof pixel.y !== 'number') {
          errors.push(`Invalid coordinates for pixel ${index}`);
        }
        if (!pixel.color || typeof pixel.color !== 'string') {
          errors.push(`Invalid color for pixel ${index}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}