/**
 * Isolated test entry: canvas + engine only. No React.
 * Used by Playwright for screenshots and video — pure engine output.
 */
import { createWorkerBackedResourceLoader } from './infrastructure/createWorkerBackedResourceLoader';
import { createHarnessEngine } from './infrastructure/createHarnessEngine';
import {
  initHarnessScene,
  startUpdateLoop,
  stopUpdateLoop,
} from './infrastructure/createHarnessApp';
import type { RenderingBackend } from '@duckengine/rendering-three-v2';
import {
  setHarnessState,
  createHarnessTestAPI,
  installHarnessTestAPI,
  installHarnessTestAPIStub,
} from './playground/harnessTestAPI';
import { startRafRecording } from './infrastructure/startRafRecording';

function parseBackendFromUrl(): RenderingBackend {
  const params = new URLSearchParams(window.location.search);
  const b = params.get('backend');
  if (b === 'webgpu' || b === 'webgl') return b;
  return 'auto';
}

installHarnessTestAPIStub();

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
if (!canvas) throw new Error('Canvas not found');

(async () => {
  try {
    const baseUrl = `${window.location.origin}/`;
    const resourceLoader = createWorkerBackedResourceLoader({ baseUrl });
    const preferBackend = parseBackendFromUrl();
    const { api, viewportRectProvider, logStack, performanceReport, disposeInput } =
      await createHarnessEngine({
        resourceLoader,
        mode: 'test',
        canvasElement: null,
        preferBackend,
      });

    const appState = initHarnessScene(api, viewportRectProvider, canvas, logStack, {
      performanceReport,
    });
    setHarnessState(appState);
    installHarnessTestAPI(createHarnessTestAPI());

    if (performanceReport) {
      startRafRecording(performanceReport);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('freeze') === '1') appState.frozen = true;

    startUpdateLoop(appState);

    (window as any).__harnessDispose = () => {
      stopUpdateLoop(appState);
      disposeInput?.();
    };
  } catch (e) {
    const err = e as Error;
    (window as any).__harnessError = err?.message ?? String(e);
  }
})();
