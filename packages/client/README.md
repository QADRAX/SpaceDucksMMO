# @spaceducks/client

Electron client app for SpaceDucks MMO. Renderer uses Three.js and TypeScript. The renderer is bundled with Vite.

## Clean Architecture (client)

The client codebase follows a layered design to keep domain and application logic decoupled from infrastructure (Three.js, IPC, network, etc.):

```
src/
	domain/              # Entities, value objects, ports (interfaces)
		ports/
			IRenderingEngine.ts
			IScene.ts        # 3D scene contract
			IScreen.ts       # UI screen contract
		scene/
			ISceneObject.ts
			SceneId.ts       # Scene identifiers (MainMenu, GameWorld, etc.)
		ui/
			ScreenId.ts      # Screen identifiers (Main, ServerList, Settings)
		types/
			Tick.ts
	application/         # Orchestrators/use-cases
		SceneService.ts      # Render loop orchestration
		SceneManager.ts      # 3D scene lifecycle & transitions
		ui/ScreenRouter.ts   # UI screen navigation
		SettingsService.ts
	infrastructure/      # Adapters for ports (Three.js, IPC, etc.)
		rendering/
			ThreeRenderer.ts
		scenes/              # 3D scene implementations
			MainMenuScene.ts
			GameWorldScene.ts
		ui/
			RendererBootstrap.ts  # Composition root
			UiLayer.ts
			screens/              # UI screen implementations
				MainScreen.ts
				ServerListScreen.ts
				SettingsScreen.ts
	renderer.ts          # Entry point (calls RendererBootstrap)
	main.ts              # Electron main process entry
	preload.ts           # Secure preload bridge
```

Key ideas:
- UI/renderer composes adapters and services; domain/application layers have no direct Three.js imports.
- `IRenderingEngine` is the rendering port. `ThreeRenderer` is the adapter.
- `IScene` defines 3D scene contract. `SceneManager` handles scene transitions.
- `IScreen` defines UI screen contract. `ScreenRouter` handles UI navigation.
- `SceneService` runs the render loop and delegates updates to SceneManager.

For a comprehensive guide on architecture, scene/screen lifecycle, and how to extend the client, see [CLIENT_ARCHITECTURE.md](./CLIENT_ARCHITECTURE.md).

## Quick start

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

## Scripts

- `npm run build` - builds both the main process (tsc) and the renderer (vite build)
- `npm run start` - builds and launches Electron
- `npm run dev:renderer` - starts Vite dev server (HMR)
- `npm run dev:main` - starts tsc in watch mode for main + preload
- `npm run dev:start` - waits for Vite and launches Electron
- `npm run dev:all` - runs renderer, main and electron in parallel (concurrently)

## Notes

- The renderer uses Vite for HMR in development. The Electron main process loads `http://localhost:5173` when running in dev and the built `dist/index.html` for production.
- For more advanced setups (packaging, native modules, secure preload bridge), we can extend this further.

## Aliases

Renderer and main/preload share the `@client` alias pointing to `src`. Vite (`vite.config.ts`) and TypeScript (`tsconfig.json`, `tsconfig.main.json`) are configured accordingly.

