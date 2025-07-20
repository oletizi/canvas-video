import { FileStorage, StorageError } from './storage';
import { ConfigMigrator } from './config-migrations';
import type { PixelAnimationConfig } from '@/video/pixel-config-types';
import type { BackupInfo } from './storage';

export class ConfigStorage extends FileStorage<PixelAnimationConfig> {
  private migrator: ConfigMigrator;

  constructor() {
    super({
      appName: 'canvas-video',
      dataType: 'pixel-configs',
      enableBackups: true,
      maxBackups: 10
    });
    this.migrator = new ConfigMigrator();
  }

  async saveConfig(config: PixelAnimationConfig): Promise<void> {
    try {
      // Validate the config before saving
      const validation = this.migrator.validateMigration(config);
      if (!validation.isValid) {
        throw new StorageError(
          `Invalid configuration: ${validation.errors.join(', ')}`,
          'VALIDATION_FAILED'
        );
      }

      // Ensure config has current version
      const migratedConfig = this.migrator.migrate(config);
      
      // Generate filename from config name
      const filename = this.sanitizeConfigName(migratedConfig.name);
      
      await this.save(filename, migratedConfig, migratedConfig.version);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        'Failed to save configuration',
        'SAVE_CONFIG_FAILED',
        error as Error
      );
    }
  }

  async loadConfig(filename: string): Promise<PixelAnimationConfig> {
    try {
      const item = await this.loadWithMetadata(filename);
      
      // Check if migration is needed
      const needsMigration = this.migrator.needsMigration(item.metadata.version);
      
      if (needsMigration) {
        console.log(`Config "${filename}" needs migration from version ${item.metadata.version}`);
        const migratedConfig = this.migrator.migrate(item.data, item.metadata.version);
        
        // Save the migrated version
        await this.save(filename, migratedConfig, migratedConfig.version);
        
        return migratedConfig;
      }

      return item.data;
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `Failed to load configuration "${filename}"`,
        'LOAD_CONFIG_FAILED',
        error as Error
      );
    }
  }

  async listConfigs(): Promise<Array<{
    id: string;
    name: string;
    version: string;
    created: string;
    modified: string;
    pixelCount: number;
    needsMigration: boolean;
  }>> {
    try {
      const items = await this.listWithMetadata();
      const configs = [];

      for (const item of items) {
        try {
          const config = await this.load(item.id);
          const needsMigration = this.migrator.needsMigration(item.metadata.version);
          
          configs.push({
            id: item.id,
            name: config.name,
            version: item.metadata.version,
            created: item.metadata.created,
            modified: item.metadata.modified,
            pixelCount: config.initialFrame.pixels.length,
            needsMigration
          });
        } catch (error) {
          console.warn(`Failed to load config info for "${item.id}":`, error);
        }
      }

      return configs.sort((a, b) => 
        new Date(b.modified).getTime() - new Date(a.modified).getTime()
      );
    } catch (error) {
      throw new StorageError(
        'Failed to list configurations',
        'LIST_CONFIGS_FAILED',
        error as Error
      );
    }
  }

  async duplicateConfig(sourceFilename: string, newName: string): Promise<string> {
    try {
      const sourceConfig = await this.loadConfig(sourceFilename);
      const newConfig: PixelAnimationConfig = {
        ...sourceConfig,
        id: `${sourceConfig.id}-copy-${Date.now()}`,
        name: newName,
        metadata: {
          ...sourceConfig.metadata,
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      };

      await this.saveConfig(newConfig);
      return this.sanitizeConfigName(newName);
    } catch (error) {
      throw new StorageError(
        'Failed to duplicate configuration',
        'DUPLICATE_CONFIG_FAILED',
        error as Error
      );
    }
  }

  async renameConfig(oldFilename: string, newName: string): Promise<string> {
    try {
      const config = await this.loadConfig(oldFilename);
      config.name = newName;
      config.metadata.modified = new Date().toISOString();

      const newFilename = this.sanitizeConfigName(newName);
      
      // Save with new filename
      await this.saveConfig(config);
      
      // Delete old file if filename changed
      if (oldFilename !== newFilename) {
        await this.delete(oldFilename);
      }

      return newFilename;
    } catch (error) {
      throw new StorageError(
        'Failed to rename configuration',
        'RENAME_CONFIG_FAILED',
        error as Error
      );
    }
  }

  async exportConfig(filename: string): Promise<string> {
    try {
      const config = await this.loadConfig(filename);
      return JSON.stringify(config, null, 2);
    } catch (error) {
      throw new StorageError(
        'Failed to export configuration',
        'EXPORT_CONFIG_FAILED',
        error as Error
      );
    }
  }

  async importConfig(jsonData: string, overwrite: boolean = false): Promise<string> {
    try {
      const config = JSON.parse(jsonData) as PixelAnimationConfig;
      
      // Validate imported config
      const validation = this.migrator.validateMigration(config);
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Migrate if needed
      const migratedConfig = this.migrator.migrate(config);
      const filename = this.sanitizeConfigName(migratedConfig.name);

      // Check if exists
      const exists = await this.exists(filename);
      if (exists && !overwrite) {
        throw new Error(`Configuration "${migratedConfig.name}" already exists`);
      }

      await this.saveConfig(migratedConfig);
      return filename;
    } catch (error) {
      throw new StorageError(
        'Failed to import configuration',
        'IMPORT_CONFIG_FAILED',
        error as Error
      );
    }
  }

  async migrateAllConfigs(): Promise<{
    migrated: number;
    errors: string[];
  }> {
    try {
      const configs = await this.listConfigs();
      const configsNeedingMigration = configs.filter(c => c.needsMigration);
      
      let migrated = 0;
      const errors: string[] = [];

      for (const config of configsNeedingMigration) {
        try {
          await this.loadConfig(config.id); // This will auto-migrate
          migrated++;
        } catch (error) {
          errors.push(`Failed to migrate "${config.name}": ${error}`);
        }
      }

      return { migrated, errors };
    } catch (error) {
      throw new StorageError(
        'Failed to migrate configurations',
        'MIGRATE_CONFIGS_FAILED',
        error as Error
      );
    }
  }

  private sanitizeConfigName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '_').toLowerCase();
  }

  // Backup-specific methods for configs
  async createConfigBackup(name?: string): Promise<string> {
    return await this.createBackup(name);
  }

  async restoreConfigBackup(backupFilename: string, overwrite: boolean = false): Promise<{
    restored: number;
    skipped: number;
    errors: string[];
    migrated: number;
  }> {
    const result = await this.restoreFromBackup(backupFilename, overwrite);
    
    // Auto-migrate any restored configs that need it
    const migrateResult = await this.migrateAllConfigs();
    
    return {
      ...result,
      migrated: migrateResult.migrated
    };
  }

  async listConfigBackups(): Promise<BackupInfo[]> {
    return await this.listBackups();
  }

  async deleteConfigBackup(backupFilename: string): Promise<void> {
    await this.deleteBackup(backupFilename);
  }

  async exportAllConfigs(): Promise<string> {
    return await this.exportData();
  }

  async importAllConfigs(jsonData: string, overwrite: boolean = false): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
    migrated: number;
  }> {
    const result = await this.importData(jsonData, overwrite);
    
    // Auto-migrate any imported configs that need it
    const migrateResult = await this.migrateAllConfigs();
    
    return {
      ...result,
      migrated: migrateResult.migrated
    };
  }

  async getConfigStorageInfo(): Promise<{
    itemCount: number;
    totalSize: number;
    path: string;
    backupCount: number;
    lastBackup?: string;
    currentVersion: string;
    configsNeedingMigration: number;
  }> {
    const info = await this.getStorageInfo();
    const configs = await this.listConfigs();
    const configsNeedingMigration = configs.filter(c => c.needsMigration).length;

    return {
      ...info,
      currentVersion: this.migrator.getCurrentVersion(),
      configsNeedingMigration
    };
  }
}