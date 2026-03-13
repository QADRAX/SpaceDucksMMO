/**
 * Loading state for rendering system.
 */
export interface LoadingState {
  readonly isLoading: boolean;
  readonly progress: number; // 0-1
  readonly message?: string;
  readonly remainingAssets: number;
}

/**
 * Initial state for loading.
 */
export const INITIAL_LOADING_STATE: LoadingState = {
  isLoading: false,
  progress: 0,
  message: undefined,
  remainingAssets: 0,
};

/**
 * Update loading state with partial changes.
 */
export function updateLoadingState(
  current: LoadingState,
  updates: Partial<LoadingState>
): LoadingState {
  return {
    ...current,
    ...updates,
  };
}
