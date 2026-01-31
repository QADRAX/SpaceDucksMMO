/**
 * WebGPU device initialization and management
 */

import { checkWebGPUSupport } from './types';

export interface WebGPUContext {
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
}

export async function initializeWebGPU(canvas: HTMLCanvasElement): Promise<WebGPUContext> {
  const support = checkWebGPUSupport();
  if (!support.supported) {
    throw new Error(support.error || 'WebGPU not supported');
  }

  const adapter = await navigator.gpu!.requestAdapter();
  if (!adapter) {
    throw new Error('No appropriate GPUAdapter found');
  }

  const device = await adapter.requestDevice();
  
  const context = canvas.getContext('webgpu');
  if (!context) {
    throw new Error('Failed to get WebGPU context');
  }

  const format = navigator.gpu!.getPreferredCanvasFormat();
  
  context.configure({
    device,
    format,
    alphaMode: 'premultiplied',
  });

  return { device, context, format };
}
