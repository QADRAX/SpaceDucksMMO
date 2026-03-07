/**
 * Request DTO for initializing a renderer
 */
export interface RenderInitRequest {
  /**
   * Container element where renderer will be attached
   */
  container: HTMLElement;

  /**
   * Optional rendering options
   */
  options?: {
    antialias?: boolean;
    shadows?: boolean;
    colorSpace?: string;
  };
}

/**
 * Response DTO for successful initialization
 */
export interface RenderInitResponse {
  success: true;
  renderId: string;
  timestamp: number;
}

/**
 * Error response for initialization
 */
export interface RenderInitErrorResponse {
  success: false;
  error: string;
  code: string;
}

export type RenderInitResult = RenderInitResponse | RenderInitErrorResponse;
