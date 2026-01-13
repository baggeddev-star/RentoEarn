import type { StorageProvider, StorageProviderType } from './interface';
import { LocalStorageProvider } from './local';
import { S3StorageProvider } from './s3';

export type { StorageProvider, StorageProviderType };
export { LocalStorageProvider } from './local';
export { S3StorageProvider } from './s3';

let storageInstance: StorageProvider | null = null;

/**
 * Get the configured storage provider instance.
 * Uses singleton pattern to reuse the same instance.
 */
export function getStorage(): StorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageProviderType;

  switch (provider) {
    case 's3':
      storageInstance = new S3StorageProvider();
      break;
    case 'local':
    default:
      storageInstance = new LocalStorageProvider();
      break;
  }

  return storageInstance;
}
