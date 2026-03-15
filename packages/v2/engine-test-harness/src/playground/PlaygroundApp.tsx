import { useEffect, useRef, useState } from 'react';
import { createWorkerBackedResourceLoader } from '../infrastructure/createWorkerBackedResourceLoader';
import { createHarnessEngine } from '../infrastructure/createHarnessEngine';
import {
  initHarnessScene,
  loadSceneYaml,
  startUpdateLoop,
  stopUpdateLoop,
  type HarnessAppState,
} from '../infrastructure/createHarnessApp';
import {
  setHarnessState,
  createHarnessTestAPI,
  installHarnessTestAPI,
  installHarnessTestAPIStub,
} from './harnessTestAPI';
import { startRafRecording } from '../infrastructure/startRafRecording';

export function PlaygroundApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<HarnessAppState | null>(null);

  useEffect(() => {
    installHarnessTestAPIStub();
  }, []);
  const [state, setState] = useState<HarnessAppState | null>(null);
  const [yaml, setYaml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadSuccess, setLoadSuccess] = useState<string | null>(null);
  const isTestModeUrl = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'test';
  const [showLogs, setShowLogs] = useState(isTestModeUrl);
  const [sceneList] = useState<string[]>(['gold-sphere', 'orbit-sphere']);

  useEffect(() => {
    let mounted = true;
    let disposeInput: (() => void) | undefined;

    (async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';
        const resourceLoader = createWorkerBackedResourceLoader({ baseUrl });
        const { api, viewportRectProvider, logStack, performanceReport, disposeInput: di } =
          await createHarnessEngine({
            resourceLoader,
            mode: 'playground',
            canvasElement: canvas,
          });
        disposeInput = di;

        if (!mounted) return;

        const appState = initHarnessScene(api, viewportRectProvider, canvas, logStack, {
          performanceReport,
        });
      stateRef.current = appState;
      setState(appState);
      setHarnessState(appState);
      installHarnessTestAPI(createHarnessTestAPI());

      if (performanceReport) {
        startRafRecording(performanceReport);
      }

      const freeze = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('freeze') === '1';
      if (freeze) appState.frozen = true;

      startUpdateLoop(appState);
      } catch (e) {
        const err = e as Error;
        (window as any).__harnessError = err?.message ?? String(e);
        setError(err?.message ?? 'Engine init failed');
      }
    })();

    return () => {
      mounted = false;
      setHarnessState(null);
      const s = stateRef.current;
      if (s) stopUpdateLoop(s);
      stateRef.current = null;
      disposeInput?.();
    };
  }, []);

  const handleLoad = () => {
    if (!state) return;
    setError(null);
    setLoadSuccess(null);
    const result = loadSceneYaml(state, yaml);
    if (!result.ok) {
      setError(result.error ?? 'Load failed');
    } else {
      setLoadSuccess('Scene loaded');
      setTimeout(() => setLoadSuccess(null), 2000);
    }
  };

  const isTestMode = isTestModeUrl;

  const [, setLogRefresh] = useState(0);
  useEffect(() => {
    if (!showLogs || !state?.logStack) return;
    const id = setInterval(() => setLogRefresh((n) => n + 1), 150);
    return () => clearInterval(id);
  }, [showLogs, state?.logStack]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '8px 16px', background: '#1a1a2e', color: '#eee', display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Engine Test Harness</h1>
        {isTestMode && <span style={{ background: '#444', padding: '2px 8px', borderRadius: 4 }}>Test Mode</span>}
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <aside style={{ width: 320, padding: 16, background: '#16213e', color: '#eee', overflowY: 'auto' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14 }}>Scenes</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {sceneList.length === 0 ? (
              <li style={{ color: '#888', fontSize: 12 }}>No scenes in public/scenes/</li>
            ) : (
              sceneList.map((name) => (
                <li key={name} style={{ marginBottom: 4 }}>
                  <button
                    style={{ background: 'transparent', border: 'none', color: '#7dd3fc', cursor: 'pointer', padding: 0, fontSize: 13 }}
                    onClick={async () => {
                      if (!state) return;
                      try {
                        setError(null);
                        setLoadSuccess(null);
                        const url = `/scenes/${name}.yaml`;
                        const res = await fetch(url);
                        if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
                        const text = await res.text();
                        setYaml(text);
                        const loadResult = loadSceneYaml(state, text);
                        if (!loadResult.ok) setError(loadResult.error ?? 'Load failed');
                        else {
                          setLoadSuccess(`Loaded ${name}`);
                          setTimeout(() => setLoadSuccess(null), 2000);
                        }
                      } catch (e) {
                        setError(`Failed to fetch scene: ${(e as Error).message}`);
                      }
                    }}
                  >
                    {name}
                  </button>
                </li>
              ))
            )}
          </ul>

          <h2 style={{ margin: '16px 0 12px', fontSize: 14 }}>YAML Editor</h2>
          <textarea
            value={yaml}
            onChange={(e) => setYaml(e.target.value)}
            style={{
              width: '100%',
              minHeight: 200,
              padding: 8,
              fontFamily: 'monospace',
              fontSize: 12,
              background: '#0f3460',
              color: '#eee',
              border: '1px solid #333',
              borderRadius: 4,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
            spellCheck={false}
          />
          <button
            onClick={handleLoad}
            style={{
              marginTop: 8,
              padding: '10px 20px',
              background: '#e94560',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Load Scene
          </button>
          {error && (
            <div style={{ marginTop: 8, padding: 8, background: 'rgba(248,113,113,0.2)', color: '#f87171', fontSize: 12, borderRadius: 4 }}>{error}</div>
          )}
          {loadSuccess && (
            <div style={{ marginTop: 8, color: '#4ade80', fontSize: 12 }}>✓ {loadSuccess}</div>
          )}

          <h2 style={{ margin: '16px 0 12px', fontSize: 14 }}>Diagnostics</h2>
          <button
            onClick={() => setShowLogs((v) => !v)}
            style={{
              padding: '6px 12px',
              background: showLogs ? '#e94560' : '#0f3460',
              color: '#eee',
              border: '1px solid #333',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {showLogs ? 'Hide' : 'Show'} Logs
          </button>
          {showLogs && state?.logStack && (
            <div
              style={{
                marginTop: 8,
                maxHeight: 320,
                overflow: 'auto',
                padding: 8,
                background: '#0a0a14',
                fontSize: 11,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'normal',
                border: '1px solid #333',
                borderRadius: 4,
              }}
            >
              {state.logStack.getEntries().length === 0 ? (
                <span style={{ color: '#666' }}>No log entries yet</span>
              ) : (
                state.logStack.getEntries().map((e, i) => (
                  <div key={i} style={{ marginBottom: 4, color: e.level === 'error' ? '#f87171' : e.level === 'warn' ? '#fbbf24' : '#94a3b8' }}>
                    [{new Date(e.timestamp).toISOString().slice(11, 23)}] [{e.level}] {e.message}
                    {e.context && ` ${JSON.stringify(e.context)}`}
                  </div>
                ))
              )}
            </div>
          )}
        </aside>

        <main style={{ flex: 1, position: 'relative', background: '#0f0f23' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
            width={800}
            height={600}
          />
        </main>
      </div>
    </div>
  );
}
