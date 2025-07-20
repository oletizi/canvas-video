import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

export interface StorageOptions {
  appName: string;
  dataType: string;
  enableBackups?: boolean;
  maxBackups?: number;
  compressionLevel?: number;
}

export interface StorageItem<T> {
  id: string;
  data: T;
  metadata: {
    created: string;
    modified: string;
    version: string;
    checksum?: string;
  };
}

export interface BackupInfo {
  filename: string;
  timestamp: string;
  itemCount: number;
  size: number;
}

export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class FileStorage<T> {
  private basePath: string;
  private backupPath: string;
  private options: Required<StorageOptions>;

  constructor(options: StorageOptions) {
    this.options = {
      enableBackups: true,
      maxBackups: 10,
      compressionLevel: 6,
      ...options
    };

    this.basePath = join(homedir(), '.config', this.options.appName, this.options.dataType);
    this.backupPath = join(this.basePath, '.backups');
  }

  async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      if (this.options.enableBackups) {
        await fs.mkdir(this.backupPath, { recursive: true });
      }
    } catch (error) {
      throw new StorageError(
        'Failed to create storage directories',
        'DIRECTORY_CREATION_FAILED',
        error as Error
      );
    }
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
  }

  private generateChecksum(data: string): string {
    // Simple checksum for data integrity
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private async writeFileAtomic(filePath: string, content: string): Promise<void> {
    const tempPath = `${filePath}.tmp`;
    try {
      await fs.writeFile(tempPath, content, 'utf-8');
      await fs.rename(tempPath, filePath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch {}
      throw error;
    }
  }

  async save(id: string, data: T, version: string = '1.0.0'): Promise<void> {
    try {
      await this.ensureDirectories();
      
      const filename = this.sanitizeFilename(id);
      const filePath = join(this.basePath, `${filename}.json`);
      
      const storageItem: StorageItem<T> = {
        id,
        data,
        metadata: {
          created: await this.getCreationTime(filePath) || new Date().toISOString(),
          modified: new Date().toISOString(),
          version,
          checksum: ''
        }
      };

      const content = JSON.stringify(storageItem, null, 2);
      storageItem.metadata.checksum = this.generateChecksum(content);
      
      const finalContent = JSON.stringify(storageItem, null, 2);
      await this.writeFileAtomic(filePath, finalContent);
      
    } catch (error) {
      throw new StorageError(
        `Failed to save item "${id}"`,
        'SAVE_FAILED',
        error as Error
      );
    }
  }

  async load(id: string): Promise<T> {
    try {
      const filename = this.sanitizeFilename(id);
      const filePath = join(this.basePath, `${filename}.json`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const storageItem: StorageItem<T> = JSON.parse(content);
      
      // Verify checksum if available
      if (storageItem.metadata.checksum) {
        const contentWithoutChecksum = JSON.stringify({
          ...storageItem,
          metadata: { ...storageItem.metadata, checksum: '' }
        }, null, 2);
        const expectedChecksum = this.generateChecksum(contentWithoutChecksum);
        
        if (expectedChecksum !== storageItem.metadata.checksum) {
          console.warn(`Checksum mismatch for item "${id}". Data may be corrupted.`);
        }
      }
      
      return storageItem.data;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new StorageError(
          `Item "${id}" not found`,
          'ITEM_NOT_FOUND',
          error as Error
        );
      }
      throw new StorageError(
        `Failed to load item "${id}"`,
        'LOAD_FAILED',
        error as Error
      );
    }
  }

  async loadWithMetadata(id: string): Promise<StorageItem<T>> {
    try {
      const filename = this.sanitizeFilename(id);
      const filePath = join(this.basePath, `${filename}.json`);
      
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new StorageError(
          `Item "${id}" not found`,
          'ITEM_NOT_FOUND',
          error as Error
        );
      }
      throw new StorageError(
        `Failed to load item "${id}" with metadata`,
        'LOAD_FAILED',
        error as Error
      );
    }
  }

  async list(): Promise<string[]> {
    try {
      await this.ensureDirectories();
      const files = await fs.readdir(this.basePath);
      return files
        .filter(f => f.endsWith('.json') && !f.startsWith('.'))
        .map(f => f.replace('.json', ''));
    } catch (error) {
      throw new StorageError(
        'Failed to list items',
        'LIST_FAILED',
        error as Error
      );
    }
  }

  async listWithMetadata(): Promise<Array<{ id: string; metadata: StorageItem<T>['metadata'] }>> {
    try {
      const ids = await this.list();
      const items = await Promise.allSettled(
        ids.map(async id => {
          const item = await this.loadWithMetadata(id);
          return { id, metadata: item.metadata };
        })
      );

      return items
        .filter((result): result is PromiseFulfilledResult<{ id: string; metadata: StorageItem<T>['metadata'] }> => 
          result.status === 'fulfilled')
        .map(result => result.value);
    } catch (error) {
      throw new StorageError(
        'Failed to list items with metadata',
        'LIST_METADATA_FAILED',
        error as Error
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const filename = this.sanitizeFilename(id);
      const filePath = join(this.basePath, `${filename}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new StorageError(
          `Item "${id}" not found`,
          'ITEM_NOT_FOUND',
          error as Error
        );
      }
      throw new StorageError(
        `Failed to delete item "${id}"`,
        'DELETE_FAILED',
        error as Error
      );
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const filename = this.sanitizeFilename(id);
      const filePath = join(this.basePath, `${filename}.json`);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async getCreationTime(filePath: string): Promise<string | null> {
    try {
      const stats = await fs.stat(filePath);
      return stats.birthtime.toISOString();
    } catch {
      return null;
    }
  }

  async createBackup(name?: string): Promise<string> {
    if (!this.options.enableBackups) {
      throw new StorageError(
        'Backups are disabled',
        'BACKUPS_DISABLED'
      );
    }

    try {
      await this.ensureDirectories();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = name || `backup-${timestamp}`;
      const backupFilename = `${backupName}.backup.json`;
      const backupFilePath = join(this.backupPath, backupFilename);

      // Collect all items
      const ids = await this.list();
      const allItems: StorageItem<T>[] = [];
      
      for (const id of ids) {
        try {
          const item = await this.loadWithMetadata(id);
          allItems.push(item);
        } catch (error) {
          console.warn(`Failed to backup item "${id}":`, error);
        }
      }

      const backup = {
        metadata: {
          created: new Date().toISOString(),
          appName: this.options.appName,
          dataType: this.options.dataType,
          version: '1.0.0',
          itemCount: allItems.length
        },
        items: allItems
      };

      await this.writeFileAtomic(backupFilePath, JSON.stringify(backup, null, 2));
      
      // Clean up old backups
      await this.cleanupOldBackups();
      
      return backupFilename;
    } catch (error) {
      throw new StorageError(
        'Failed to create backup',
        'BACKUP_FAILED',
        error as Error
      );
    }
  }

  async restoreFromBackup(backupFilename: string, overwrite: boolean = false): Promise<{
    restored: number;
    skipped: number;
    errors: string[];
  }> {
    try {
      const backupFilePath = join(this.backupPath, backupFilename);
      const content = await fs.readFile(backupFilePath, 'utf-8');
      const backup = JSON.parse(content);

      let restored = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const item of backup.items) {
        try {
          const exists = await this.exists(item.id);
          
          if (exists && !overwrite) {
            skipped++;
            continue;
          }

          await this.save(item.id, item.data, item.metadata.version);
          restored++;
        } catch (error) {
          errors.push(`Failed to restore "${item.id}": ${error}`);
        }
      }

      return { restored, skipped, errors };
    } catch (error) {
      throw new StorageError(
        'Failed to restore from backup',
        'RESTORE_FAILED',
        error as Error
      );
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    if (!this.options.enableBackups) {
      return [];
    }

    try {
      await this.ensureDirectories();
      const files = await fs.readdir(this.backupPath);
      const backupFiles = files.filter(f => f.endsWith('.backup.json'));
      
      const backups: BackupInfo[] = [];
      
      for (const file of backupFiles) {
        try {
          const filePath = join(this.backupPath, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const backup = JSON.parse(content);
          
          backups.push({
            filename: file,
            timestamp: backup.metadata.created,
            itemCount: backup.metadata.itemCount || 0,
            size: stats.size
          });
        } catch (error) {
          console.warn(`Failed to read backup info for ${file}:`, error);
        }
      }

      return backups.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      throw new StorageError(
        'Failed to list backups',
        'LIST_BACKUPS_FAILED',
        error as Error
      );
    }
  }

  async deleteBackup(backupFilename: string): Promise<void> {
    try {
      const backupFilePath = join(this.backupPath, backupFilename);
      await fs.unlink(backupFilePath);
    } catch (error) {
      throw new StorageError(
        'Failed to delete backup',
        'DELETE_BACKUP_FAILED',
        error as Error
      );
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const backupsToDelete = backups.slice(this.options.maxBackups);
      
      for (const backup of backupsToDelete) {
        await this.deleteBackup(backup.filename);
      }
    } catch (error) {
      console.warn('Failed to cleanup old backups:', error);
    }
  }

  async exportData(): Promise<string> {
    try {
      const ids = await this.list();
      const allItems: StorageItem<T>[] = [];
      
      for (const id of ids) {
        const item = await this.loadWithMetadata(id);
        allItems.push(item);
      }

      const exportData = {
        metadata: {
          exported: new Date().toISOString(),
          appName: this.options.appName,
          dataType: this.options.dataType,
          version: '1.0.0',
          itemCount: allItems.length
        },
        items: allItems
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new StorageError(
        'Failed to export data',
        'EXPORT_FAILED',
        error as Error
      );
    }
  }

  async importData(jsonData: string, overwrite: boolean = false): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.items || !Array.isArray(importData.items)) {
        throw new Error('Invalid import data format');
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const item of importData.items) {
        try {
          const exists = await this.exists(item.id);
          
          if (exists && !overwrite) {
            skipped++;
            continue;
          }

          await this.save(item.id, item.data, item.metadata.version);
          imported++;
        } catch (error) {
          errors.push(`Failed to import "${item.id}": ${error}`);
        }
      }

      return { imported, skipped, errors };
    } catch (error) {
      throw new StorageError(
        'Failed to import data',
        'IMPORT_FAILED',
        error as Error
      );
    }
  }

  async getStorageInfo(): Promise<{
    itemCount: number;
    totalSize: number;
    path: string;
    backupCount: number;
    lastBackup?: string;
  }> {
    try {
      await this.ensureDirectories();
      const files = await fs.readdir(this.basePath);
      const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('.'));
      
      let totalSize = 0;
      for (const file of jsonFiles) {
        const filePath = join(this.basePath, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      let backupCount = 0;
      let lastBackup: string | undefined;
      if (this.options.enableBackups) {
        try {
          const backups = await this.listBackups();
          backupCount = backups.length;
          lastBackup = backups[0]?.timestamp;
        } catch {}
      }

      return {
        itemCount: jsonFiles.length,
        totalSize,
        path: this.basePath,
        backupCount,
        lastBackup
      };
    } catch (error) {
      throw new StorageError(
        'Failed to get storage info',
        'INFO_FAILED',
        error as Error
      );
    }
  }
}