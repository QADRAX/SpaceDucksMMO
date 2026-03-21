/**
 * Exposes harness API on window for Playwright tests.
 * Set by PlaygroundApp when engine is ready.
 */
import type { HarnessAppState } from '../infrastructure/createHarnessApp';
import { loadSceneYaml } from '../infrastructure/createHarnessApp';

export interface PerformanceReport {
  frames: Array<{ frame: number; t: number; delta: number; fps: number }>;
  phases: Array<{ frame: number; phase: string; duration: number }>;
  subsystemSlices: Array<{
    frame: number;
    scope: 'engine' | 'scene';
    sceneId?: string;
    subsystemId: string;
    phase: string;
    duration: number;
  }>;
  frameTotals: Array<{ frame: number; duration: number }>;
}

export interface HarnessTestAPI {
  loadSceneYaml(yaml: string): { ok: boolean; error?: string };
  readyForScreenshot(): Promise<void>;
  getLogs?(): unknown[];
  getPerformanceReport?(): PerformanceReport | null;
  stopPerformanceRecording?(): void;
}

let harnessState: HarnessAppState | null = null;

export function setHarnessState(state: HarnessAppState | null): void {
  harnessState = state;
}

export function getHarnessState(): HarnessAppState | null {
  return harnessState;
}

export function createHarnessTestAPI(): HarnessTestAPI {
  return {
    loadSceneYaml(yaml: string) {
      if (!harnessState) return { ok: false, error: 'Harness not ready' };
      return loadSceneYaml(harnessState, yaml);
    },
    getLogs() {
      return harnessState?.logStack ? [...harnessState.logStack.getEntries()] : [];
    },
    getPerformanceReport(): PerformanceReport | null {
      const pr = harnessState?.performanceReport;
      if (!pr || pr.frames.length === 0) return null;
      return {
        frames: [...pr.frames],
        phases: [...pr.phases],
        subsystemSlices: [...pr.subsystemSlices],
        frameTotals: [...pr.frameTotals],
      };
    },
    stopPerformanceRecording() {
      harnessState?.performanceReport?.stopRaf?.();
    },
    readyForScreenshot(): Promise<void> {
      return new Promise((resolve) => {
        if (!harnessState) {
          resolve();
          return;
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });
    },
  };
}

export function installHarnessTestAPI(api: HarnessTestAPI): void {
  const w = window as unknown as {
    loadSceneYaml?: (y: string) => { ok: boolean; error?: string };
    readyForScreenshot?: () => Promise<void>;
    getLogs?: () => unknown[];
    getPerformanceReport?: () => PerformanceReport | null;
    stopPerformanceRecording?: () => void;
    __harnessReady?: boolean;
  };
  w.loadSceneYaml = api.loadSceneYaml.bind(api);
  w.readyForScreenshot = api.readyForScreenshot.bind(api);
  w.getLogs = api.getLogs?.bind(api);
  w.getPerformanceReport = api.getPerformanceReport?.bind(api);
  w.stopPerformanceRecording = api.stopPerformanceRecording?.bind(api);
  w.__harnessReady = true;
}

/** Install stub API immediately so tests can detect harness. Replaced when engine is ready. */
export function installHarnessTestAPIStub(): void {
  const w = window as unknown as {
    loadSceneYaml?: (y: string) => { ok: boolean; error?: string };
    readyForScreenshot?: () => Promise<void>;
    __harnessReady?: boolean;
  };
  w.loadSceneYaml = () => ({ ok: false, error: 'Harness not ready' });
  w.readyForScreenshot = () => Promise.resolve();
  w.__harnessReady = false;
}
