# @spaceducks/client

Electron client app for SpaceDucks MMO. Renderer uses Three.js and is written in TypeScript; the renderer bundle is created with `esbuild`.

Quick start


1. From repository root run `npm install` (installs dependencies for all workspaces).
2. From the `packages/client` folder you can run development scripts. Recommended workflow (three terminals):

Terminal A — start the Vite dev server (renderer):

```powershell
cd packages\client
npm run dev:renderer
```

Terminal B — watch main + preload (tsc):

```powershell
cd packages\client
npm run dev:main
```

Terminal C — start Electron after Vite is ready (wait-on is used):

```powershell
cd packages\client
npm run dev:start
```

Alternatively run everything from the package using `npm run dev:all` (this uses `concurrently` and `wait-on`).

Scripts

- `npm run build` - builds both the main process (tsc) and the renderer (vite build)
- `npm run start` - builds and launches Electron
- `npm run dev:renderer` - starts Vite dev server (HMR)
- `npm run dev:main` - starts tsc in watch mode for main + preload
- `npm run dev:start` - waits for Vite and launches Electron
- `npm run dev:all` - runs renderer, main and electron in parallel (concurrently)

Notes

- The renderer now uses Vite for true HMR in development. The Electron main process loads `http://localhost:5173` when running in dev and the built `dist/index.html` for production.
- This scaffold provides fast HMR for the renderer. For more advanced setups (packaging, native modules, secure preload bridge), we can extend this further.

Electron-vite

You can also use `electron-vite` to orchestrate the dev/build workflow. The package includes convenience scripts:

```powershell
cd packages\client
npm run ev:dev         # run electron-vite dev (dev server + electron)
npm run ev:build       # bundle for production with electron-vite build
```

For debugging with the inspector, use `ev:dev:debug` which launches electron with the Node inspector enabled on port 9229 and matches the VS Code `Attach to Electron Main` configuration in `.vscode/launch.json`.

