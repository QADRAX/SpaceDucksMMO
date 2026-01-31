'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  checkWebGPUSupport,
  initializeWebGPU,
  loadMaterialTextures,
  createMaterialRenderPipeline,
  createMVPMatrix,
  type MaterialFile,
} from '@/lib/webgpu';

export interface MaterialPreviewSettings {
  // Lighting
  lightDirection?: { x: number; y: number; z: number };
  lightIntensity?: number;
  ambientIntensity?: number;
  
  // Material overrides
  metallicMultiplier?: number;
  roughnessMultiplier?: number;
  aoStrength?: number;
  normalStrength?: number;
  heightScale?: number;
  emissionStrength?: number;
  
  // Camera
  cameraDistance?: number;
  rotationSpeed?: number;
}

interface MaterialPreviewProps {
  assetKey: string;
  version: string;
  files: MaterialFile[];
  className?: string;
  settings?: MaterialPreviewSettings;
}

export function MaterialPreview({ assetKey, version, files, className, settings: initialSettings }: MaterialPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedTextures, setLoadedTextures] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const animationFrameRef = useRef<number>();
  const deviceRef = useRef<GPUDevice | null>(null);
  const renderPipelineRef = useRef<any>(null);
  const rotationSpeedRef = useRef(initialSettings?.rotationSpeed ?? 0.01);
  const assetIdRef = useRef<string | null>(null);
  
  // Store default settings loaded from DB
  const defaultSettingsRef = useRef({
    lightIntensity: 0.5,
    ambientIntensity: 0.15,
    metallicMultiplier: 1.0,
    roughnessMultiplier: 1.0,
    aoStrength: 1.0,
    normalStrength: 0.3,
    emissionStrength: 1.0,
    rotationSpeed: 0.01
  });
  
  // Local state for settings with defaults
  const [lightIntensity, setLightIntensity] = useState(initialSettings?.lightIntensity ?? 0.5);
  const [ambientIntensity, setAmbientIntensity] = useState(initialSettings?.ambientIntensity ?? 0.15);
  const [metallicMultiplier, setMetallicMultiplier] = useState(initialSettings?.metallicMultiplier ?? 1.0);
  const [roughnessMultiplier, setRoughnessMultiplier] = useState(initialSettings?.roughnessMultiplier ?? 1.0);
  const [aoStrength, setAoStrength] = useState(initialSettings?.aoStrength ?? 1.0);
  const [normalStrength, setNormalStrength] = useState(initialSettings?.normalStrength ?? 0.3);
  const [emissionStrength, setEmissionStrength] = useState(initialSettings?.emissionStrength ?? 1.0);
  const [rotationSpeed, setRotationSpeed] = useState(initialSettings?.rotationSpeed ?? 0.01);
  
  // Update rotation speed ref when state changes
  useEffect(() => {
    rotationSpeedRef.current = rotationSpeed;
  }, [rotationSpeed]);

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/admin/assets/${assetKey}/settings`);
        console.log('[MaterialPreview] Settings fetch response:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('[MaterialPreview] Settings data:', data);
          if (data) {
            // Data is already the parsed settings object (API returns settings.settings which is a JSON string that gets auto-parsed)
            const savedSettings = typeof data === 'string' ? JSON.parse(data) : data;
            console.log('[MaterialPreview] Parsed settings:', savedSettings);
            
            // Update default settings ref with loaded values
            defaultSettingsRef.current = {
              lightIntensity: savedSettings.lightIntensity ?? 0.5,
              ambientIntensity: savedSettings.ambientIntensity ?? 0.15,
              metallicMultiplier: savedSettings.metallicMultiplier ?? 1.0,
              roughnessMultiplier: savedSettings.roughnessMultiplier ?? 1.0,
              aoStrength: savedSettings.aoStrength ?? 1.0,
              normalStrength: savedSettings.normalStrength ?? 0.3,
              emissionStrength: savedSettings.emissionStrength ?? 1.0,
              rotationSpeed: savedSettings.rotationSpeed ?? 0.01
            };
            
            console.log('[MaterialPreview] Updated defaults ref:', defaultSettingsRef.current);
            
            // Set state to loaded values
            setLightIntensity(defaultSettingsRef.current.lightIntensity);
            setAmbientIntensity(defaultSettingsRef.current.ambientIntensity);
            setMetallicMultiplier(defaultSettingsRef.current.metallicMultiplier);
            setRoughnessMultiplier(defaultSettingsRef.current.roughnessMultiplier);
            setAoStrength(defaultSettingsRef.current.aoStrength);
            setNormalStrength(defaultSettingsRef.current.normalStrength);
            setEmissionStrength(defaultSettingsRef.current.emissionStrength);
            setRotationSpeed(defaultSettingsRef.current.rotationSpeed);
            assetIdRef.current = data.id;
          } else {
            console.log('[MaterialPreview] No settings found in response');
          }
        } else {
          console.log('[MaterialPreview] Settings fetch failed:', response.status);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };
    
    loadSettings();
  }, [assetKey]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!canvasRef.current || !settingsLoaded) {
        return;
      }

      try {
        // Check WebGPU support
        const support = checkWebGPUSupport();
        
        if (!support.supported) {
          throw new Error(support.error || 'WebGPU not supported');
        }

        // Initialize WebGPU
        const canvas = canvasRef.current;
        const { device, context, format } = await initializeWebGPU(canvas);
        deviceRef.current = device;

        // Load textures
        const baseUrl = `${window.location.origin}/api/assets/file/${assetKey}/${version}`;
        const { textures, loadedCount } = await loadMaterialTextures(device, files, baseUrl);
        
        if (mounted) {
          setLoadedTextures(loadedCount);
        }

        // Create pipeline with current settings (use ref values which are already loaded)
        const defaults = defaultSettingsRef.current;
        console.log('[MaterialPreview] Creating pipeline with defaults:', defaults);
        const pipelineSettings = {
          lightDirection: initialSettings?.lightDirection ?? { x: 1.0, y: 1.0, z: 1.0 },
          lightIntensity: defaults.lightIntensity,
          ambientIntensity: defaults.ambientIntensity,
          metallicMultiplier: defaults.metallicMultiplier,
          roughnessMultiplier: defaults.roughnessMultiplier,
          aoStrength: defaults.aoStrength,
          normalStrength: defaults.normalStrength,
          heightScale: initialSettings?.heightScale ?? 0.05,
          emissionStrength: defaults.emissionStrength,
        };
        console.log('[MaterialPreview] Pipeline settings:', pipelineSettings);
        
        const renderPipeline = createMaterialRenderPipeline(device, format, textures, pipelineSettings);
        renderPipelineRef.current = renderPipeline;

        if (!mounted) {
          device.destroy();
          return;
        }

        setLoading(false);

        // Render loop
        let rotation = 0;
        let frameCount = 0;
        const render = () => {
          if (!mounted || !deviceRef.current) return;

          rotation += rotationSpeedRef.current;
          frameCount++;

          // Update MVP matrix
          const mvpMatrix = createMVPMatrix(rotation);
          
          device.queue.writeBuffer(
            renderPipeline.uniformBuffer,
            0,
            mvpMatrix.buffer,
            mvpMatrix.byteOffset,
            mvpMatrix.byteLength
          );

          // Render
          const commandEncoder = device.createCommandEncoder();
          const textureView = context.getCurrentTexture().createView();

          const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
              view: textureView,
              clearValue: { r: 0.2, g: 0.3, b: 0.4, a: 1.0 },
              loadOp: 'clear',
              storeOp: 'store',
            }],
          };

          const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
          passEncoder.setPipeline(renderPipeline.pipeline);
          passEncoder.setBindGroup(0, renderPipeline.bindGroup);
          passEncoder.setVertexBuffer(0, renderPipeline.vertexBuffer);
          passEncoder.setIndexBuffer(renderPipeline.indexBuffer, 'uint16');
          passEncoder.drawIndexed(renderPipeline.indexCount);
          passEncoder.end();

          device.queue.submit([commandEncoder.finish()]);

          animationFrameRef.current = requestAnimationFrame(render);
        };

        render();
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (deviceRef.current) {
        deviceRef.current.destroy();
      }
    };
  }, [assetKey, version, files, settingsLoaded]);

  // Update uniforms when settings change (without recreating pipeline)
  useEffect(() => {
    if (!deviceRef.current || !renderPipelineRef.current) return;
    
    const device = deviceRef.current;
    const pipeline = renderPipelineRef.current;
    
    // Update uniform buffer with new settings (offset 64, after MVP matrix)
    const uniformData = new Float32Array([
      pipeline.textureFlags.hasNormal ? 1.0 : 0.0,
      pipeline.textureFlags.hasRoughness ? 1.0 : 0.0,
      pipeline.textureFlags.hasMetallic ? 1.0 : 0.0,
      pipeline.textureFlags.hasAO ? 1.0 : 0.0,
      1.0, 1.0, 1.0, // lightDir (normalized in shader)
      lightIntensity,
      ambientIntensity,
      metallicMultiplier,
      roughnessMultiplier,
      aoStrength,
      normalStrength,
      pipeline.settings.heightScale,
      emissionStrength,
      0.0, // padding
    ]);
    
    device.queue.writeBuffer(pipeline.uniformBuffer, 64, uniformData);
  }, [lightIntensity, ambientIntensity, metallicMultiplier, roughnessMultiplier, aoStrength, normalStrength, emissionStrength]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 border-2 border-black rounded-base ${className}`}>
        <div className="text-center p-4">
          <p className="text-red-600 font-bold mb-2">Preview Error</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 border-2 border-black rounded-base">
          <div className="text-center">
            <p className="font-bold mb-2">Loading preview...</p>
            <p className="text-sm text-gray-600">
              Loaded {loadedTextures} texture{loadedTextures !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="border-2 border-black rounded-base bg-gray-900"
        style={{ display: loading ? 'none' : 'block', width: '400px', height: '400px' }}
      />
      
      {!loading && (
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowControls(!showControls)}
            className="bg-white border-2 border-black rounded-base px-3 py-1 font-bold hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {showControls ? '✕' : '⚙️'}
          </button>
        </div>
      )}
      
      {showControls && !loading && (
        <div className="absolute top-12 right-2 bg-white border-2 border-black rounded-base p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-xs">
          <h3 className="font-bold mb-3 text-sm">Material Settings</h3>
          
          <div className="space-y-3 text-xs">
            {/* Light Intensity */}
            <div>
              <label className="block font-bold mb-1">
                Light Intensity: {lightIntensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={lightIntensity}
                onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            {/* Ambient Intensity */}
            <div>
              <label className="block font-bold mb-1">
                Ambient: {ambientIntensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientIntensity}
                onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            {/* Metallic Multiplier - Only show if metallic texture exists */}
            {renderPipelineRef.current?.textureFlags?.hasMetallic && (
              <div>
                <label className="block font-bold mb-1">
                  Metallic: {metallicMultiplier.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={metallicMultiplier}
                  onChange={(e) => setMetallicMultiplier(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Roughness Multiplier - Only show if roughness texture exists */}
            {renderPipelineRef.current?.textureFlags?.hasRoughness && (
              <div>
                <label className="block font-bold mb-1">
                  Roughness: {roughnessMultiplier.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={roughnessMultiplier}
                  onChange={(e) => setRoughnessMultiplier(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
            
            {/* AO Strength - Only show if AO texture exists */}
            {renderPipelineRef.current?.textureFlags?.hasAO && (
              <div>
                <label className="block font-bold mb-1">
                  AO Strength: {aoStrength.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={aoStrength}
                  onChange={(e) => setAoStrength(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Normal Strength - Only show if normal texture exists */}
            {renderPipelineRef.current?.textureFlags?.hasNormal && (
              <div>
                <label className="block font-bold mb-1">
                  Normal Strength: {normalStrength.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={normalStrength}
                  onChange={(e) => setNormalStrength(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Emission Strength - Only show if emission texture exists */}
            {files.some(f => f.mapType === 'emission') && (
              <div>
                <label className="block font-bold mb-1">
                  Emission: {emissionStrength.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={emissionStrength}
                  onChange={(e) => setEmissionStrength(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Rotation Speed */}
            <div>
              <label className="block font-bold mb-1">
                Rotation Speed: {rotationSpeed.toFixed(3)}
              </label>
              <input
                type="range"
                min="0"
                max="0.05"
                step="0.001"
                value={rotationSpeed}
                onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <button
              onClick={() => {
                // Reset to saved defaults from database
                const defaults = defaultSettingsRef.current;
                setLightIntensity(defaults.lightIntensity);
                setAmbientIntensity(defaults.ambientIntensity);
                setMetallicMultiplier(defaults.metallicMultiplier);
                setRoughnessMultiplier(defaults.roughnessMultiplier);
                setAoStrength(defaults.aoStrength);
                setNormalStrength(defaults.normalStrength);
                setEmissionStrength(defaults.emissionStrength);
                setRotationSpeed(defaults.rotationSpeed);
              }}
              className="w-full bg-gray-200 border-2 border-black rounded-base px-3 py-1 font-bold hover:bg-gray-300 transition-colors mt-2"
            >
              Reset to Saved
            </button>
            
            <button
              onClick={async () => {
                setSaving(true);
                setSaveSuccess(false);
                try {
                  const settingsData = {
                    lightIntensity,
                    ambientIntensity,
                    metallicMultiplier,
                    roughnessMultiplier,
                    aoStrength,
                    normalStrength,
                    emissionStrength,
                    rotationSpeed
                  };
                  
                  const response = await fetch(`/api/admin/assets/${assetKey}/settings`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ settings: JSON.stringify(settingsData) }),
                  });
                  
                  if (response.ok) {
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2000);
                  } else {
                    throw new Error('Failed to save settings');
                  }
                } catch (error) {
                  console.error('Error saving settings:', error);
                  alert('Failed to save settings');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className={`w-full border-2 border-black rounded-base px-3 py-1 font-bold transition-colors mt-2 ${
                saveSuccess 
                  ? 'bg-green-500 text-white' 
                  : saving 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {saving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
