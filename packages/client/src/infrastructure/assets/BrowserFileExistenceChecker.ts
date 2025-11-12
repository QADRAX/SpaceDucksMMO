import type { IFileExistenceChecker } from '@client/domain/ports/IFileExistenceChecker';

/**
 * Browser-based file existence checker.
 * Uses fetch with HEAD request to check if files exist.
 * Works for public assets served by the dev/build server.
 */
export class BrowserFileExistenceChecker implements IFileExistenceChecker {
  private cache = new Map<string, boolean>();

  async exists(path: string): Promise<boolean> {
    // Check cache first
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }

    try {
      // Use HEAD request to check without downloading
      const response = await fetch(path, { method: 'HEAD' });
      const exists = response.ok;
      
      // Cache the result
      this.cache.set(path, exists);
      return exists;
    } catch (error) {
      // File doesn't exist or network error
      this.cache.set(path, false);
      return false;
    }
  }

  async existsMany(paths: string[]): Promise<boolean[]> {
    return Promise.all(paths.map(path => this.exists(path)));
  }

  /**
   * Clear the cache (useful for testing or if files change)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export default BrowserFileExistenceChecker;
