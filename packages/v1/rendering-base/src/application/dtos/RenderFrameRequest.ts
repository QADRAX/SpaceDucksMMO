/**
 * Request DTO for rendering a frame
 */
export interface RenderFrameRequest {
  /**
   * Delta time since last frame (in seconds)
   */
  deltaTime: number;

  /**
   * Whether to update physics/entities before rendering
   */
  updateEntities?: boolean;
}

/**
 * Response DTO for a rendered frame
 */
export interface RenderFrameResponse {
  /**
   * Whether frame was rendered successfully
   */
  success: true;

  /**
   * Frame timing information
   */
  timing: {
    startTime: number;
    endTime: number;
    duration: number; // in ms
  };

  /**
   * Statistics
   */
  stats?: {
    entitiesRendered: number;
    featuresActive: number;
  };
}

/**
 * Error response for frame render
 */
export interface RenderFrameErrorResponse {
  success: false;
  error: string;
  code: string;
}

export type RenderFrameResult = RenderFrameResponse | RenderFrameErrorResponse;
