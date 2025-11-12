/**
 * Port for checking file existence.
 * Domain layer defines the contract, infrastructure implements it.
 */
export interface IFileExistenceChecker {
  /**
   * Check if a file exists at the given path
   * @param path - Relative or absolute path to check
   * @returns Promise that resolves to true if file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Check multiple files at once (batch operation)
   * @param paths - Array of paths to check
   * @returns Promise with array of boolean results
   */
  existsMany(paths: string[]): Promise<boolean[]>;
}
