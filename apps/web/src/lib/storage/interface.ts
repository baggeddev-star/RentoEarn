/**
 * Storage provider interface for banner images and other assets.
 */
export interface StorageProvider {
  /**
   * Upload a file to storage.
   * @param key - The storage key/path for the file
   * @param buffer - The file contents
   * @param contentType - MIME type of the file
   * @returns The public URL of the uploaded file
   */
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;

  /**
   * Get the public URL for a stored file.
   * @param key - The storage key/path
   * @returns The public URL
   */
  getUrl(key: string): string;

  /**
   * Download a file from storage.
   * @param key - The storage key/path
   * @returns The file contents as a Buffer
   */
  download(key: string): Promise<Buffer>;

  /**
   * Delete a file from storage.
   * @param key - The storage key/path
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists in storage.
   * @param key - The storage key/path
   */
  exists(key: string): Promise<boolean>;
}

export type StorageProviderType = 'local' | 's3';
