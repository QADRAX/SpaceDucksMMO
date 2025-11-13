# Game Screen Navigation System

## Overview

Sistema de navegación que abstrae el concepto de "pantalla de juego" combinando UI (Preact) y Scene (Three.js) en una unidad cohesiva.

## Architecture (Clean Architecture)

### Domain Layer (`domain/`)

**GameScreen.ts** - Concepto central
- `GameScreenConfig`: Configuración que define una pantalla completa (UI + Scene)
- `IGameScreenNavigator`: Port para navegación entre pantallas

**ScreenId.ts** - IDs de pantallas UI
- `Main`: Menú principal
- `Sandbox`: Entorno de pruebas
- `ServerList`, `Settings`: Otras pantallas

**SceneId.ts** - IDs de escenas 3D
- `MainMenu`: Escena de fondo del menú
- `Sandbox`: Escena de pruebas con helpers
- `GameWorld`, `ServerBrowser`: Otras escenas

### Application Layer (`application/`)

**GameScreenManager.ts** - Coordinador principal
- Implementa `IGameScreenNavigator`
- Coordina `ScreenRouter` (UI) y `SceneManager` (3D)
- Asegura transiciones atómicas
- Mantiene estado de pantalla actual

### Infrastructure Layer (`infrastructure/`)

#### Scenes (`scenes/`)
- **BaseScene.ts**: Clase base con texture reload y SceneBuilder
- **MainMenuScene.ts**: Escena del menú principal
- **SandboxScene.ts**: Escena de pruebas con helpers y objetos de ejemplo

#### UI Screens (`ui/screens/`)
- **MainScreen.tsx**: UI del menú principal con navegación
- **SandboxScreen.tsx**: UI del sandbox con info panel y controles

#### UI Components (`ui/components/lobby/`)
- **LobbyApp.tsx**: Componente principal del lobby con botón Sandbox

#### Bootstrap (`ui/`)
- **UIBootstrap.ts**: Inicializa UI, registra screens, crea GameScreenManager
- **RendererBootstrap.ts**: Orquesta servicios, rendering y UI

#### Rendering (`rendering/`)
- **RenderingBootstrap.ts**: Inicializa engine, registra scenes

## Usage Flow

### 1. Initialization (RendererBootstrap)

```ts
// 1. Build services
const services = serviceContainer.build();

// 2. Initialize rendering
renderingBootstrap.initialize(container);
// Registers: MainMenuScene, GameWorldScene, SandboxScene

// 3. Initialize UI
uiBootstrap.registerScreens(services, sceneManager);
// Registers: MainScreen, SandboxScreen
// Creates: GameScreenManager

// 4. Show initial screen
uiBootstrap.showInitialScreen();
// Navigates to: Main UI + MainMenu Scene
```

### 2. Navigation

**From Main Menu to Sandbox:**
```ts
// User clicks "Sandbox" button in LobbyApp
onNavigate({
  screenId: ScreenId.Sandbox,
  sceneId: SceneId.Sandbox,
  name: 'Sandbox'
});

// GameScreenManager coordinates:
// 1. screenRouter.show(ScreenId.Sandbox) → SandboxScreen mounts
// 2. sceneManager.switchTo(SceneId.Sandbox) → SandboxScene setup
```

**From Sandbox back to Main:**
```ts
// User clicks "Back to Menu" in SandboxScreen
navigate({
  screenId: ScreenId.Main,
  sceneId: SceneId.MainMenu,
  name: 'Main Menu'
});
```

## Key Benefits

### 1. **Abstraction**
- No necesitas pensar en UI y Scene por separado
- `GameScreenConfig` unifica el concepto
- Navegación simple: `navigate(config)`

### 2. **Clean Architecture**
- Domain: Ports e interfaces
- Application: Lógica de coordinación
- Infrastructure: Implementaciones concretas
- Separación clara de responsabilidades

### 3. **Type Safety**
- ScreenId y SceneId fuertemente tipados
- GameScreenConfig valida combinaciones
- TypeScript previene errores

### 4. **Extensibilidad**
- Añadir nueva pantalla = registrar Screen + Scene
- GameScreenManager maneja la coordinación
- No cambios en arquitectura base

## Adding a New Game Screen

### 1. Domain Layer

```ts
// domain/ui/ScreenId.ts
export enum ScreenId {
  // ...
  MyNewScreen = 'my-new-screen',
}

// domain/scene/SceneId.ts
enum SceneId {
  // ...
  MyNewScene = 'my-new-scene',
}
```

### 2. Infrastructure - Component

```tsx
// infrastructure/ui/components/mynew/MyNewComponent.tsx
interface MyNewComponentProps {
  onNavigate: (config: GameScreenConfig) => void;
}

export function MyNewComponent({ onNavigate }: MyNewComponentProps) {
  return (
    <div class="mynew-container">
      {/* Your UI here */}
      <button onClick={() => onNavigate(GameScreens.MainMenu)}>
        Back to Menu
      </button>
    </div>
  );
}
```

### 3. Infrastructure - Screen

```tsx
// infrastructure/ui/screens/MyNewScreen.tsx
export class MyNewScreen extends BaseScreen {
  constructor(navigate: (config: GameScreenConfig) => void) {
    super(ScreenId.MyNewScreen, navigate);
  }

  protected renderContent(): ComponentChild {
    return <MyNewComponent onNavigate={this.navigate} />;
  }
}
```

### 4. Infrastructure - Scene

```ts
// infrastructure/scenes/MyNewScene.ts
export class MyNewScene extends BaseScene {
  readonly id = SceneId.MyNewScene;
  
  setup(engine: IRenderingEngine): void {
    super.setup(engine);
    
    // Add your 3D objects
    this.setupScene(engine)
      .add(myObject, { position: [0, 0, 0] })
      .build();
  }
  
  update(dt: number): void {
    this.objects.forEach(obj => obj.update(dt));
  }
}
```

### 5. Register GameScreen

```ts
// domain/ui/GameScreenRegistry.ts
export const GameScreens = {
  MainMenu: { ... },
  Sandbox: { ... },
  
  // Add your new screen
  MyNewScreen: {
    screenId: ScreenId.MyNewScreen,
    sceneId: SceneId.MyNewScene,
    name: 'My New Screen'
  } as GameScreenConfig,
}
```

### 6. Register in Bootstraps

```ts
// infrastructure/rendering/RenderingBootstrap.ts
initialize(container: HTMLElement): void {
  this.sceneManager.register(new MyNewScene(deps...));
  // ...
}

// infrastructure/ui/UIBootstrap.ts
registerScreens(services: Services, sceneManager: SceneManager): void {
  const myScreen = new MyNewScreen(navigate);
  this.router.register(myScreen);
  // ...
}
```

### 7. Navigate

```ts
// From anywhere in your UI components
navigate(GameScreens.MyNewScreen);
```

## Sandbox Features

### Scene (SandboxScene.ts)
- ✅ Grid helper (XZ plane, 1-unit spacing)
- ✅ Axes helper (RGB = XYZ)
- ✅ Auto-orbiting camera
- ✅ Ambient + Directional lighting
- ✅ Example objects (Planet, Moon, Star)
- ✅ SceneBuilder fluent API

### UI (SandboxScreen.tsx)
- ✅ Back to menu button
- ✅ Info panel (toggleable)
- ✅ Quick start guide
- ✅ Usage tips
- 🚧 Object spawner (future)
- 🚧 Camera controls (future)
- 🚧 Scene stats (future)

## File Structure

```
domain/
  ui/
    GameScreen.ts          ← Core abstraction
    GameScreenRegistry.ts  ← Single source of truth ✨ NEW
    ScreenId.ts            ← UI screen IDs
  scene/
    SceneId.ts             ← 3D scene IDs

application/
  ui/
    GameScreenManager.ts   ← Navigation coordinator
    ScreenRouter.ts        ← UI screen lifecycle
  SceneManager.ts          ← 3D scene lifecycle

infrastructure/
  scenes/
    BaseScene.ts           ← Base with texture reload + SceneBuilder
    MainMenuScene.ts       ← Main menu 3D scene
    SandboxScene.ts        ← Testing 3D scene ✨ NEW
  ui/
    UIBootstrap.ts         ← UI initialization ⚡ UPDATED
    screens/
      BaseScreen.tsx       ← Generic screen base class ✨ NEW
      MainScreen.tsx       ← Main menu screen ⚡ UPDATED
      SandboxScreen.tsx    ← Sandbox screen ⚡ UPDATED
    components/
      lobby/
        LobbyApp.tsx       ← Lobby with Sandbox button ⚡ UPDATED
      sandbox/
        SandboxComponent.tsx  ← Sandbox UI component ✨ NEW
  rendering/
    RenderingBootstrap.ts  ← Rendering init ⚡ UPDATED
```

## Example: Complete Navigation Flow

```
User Action: Click "Sandbox" button
  ↓
LobbyApp.handleSandboxClick()
  ↓
onNavigate({ screenId: Sandbox, sceneId: Sandbox, ... })
  ↓
GameScreenManager.navigateTo(config)
  ↓
  ├─→ ScreenRouter.show(ScreenId.Sandbox)
  │     ↓
  │   MainScreen.unmount()
  │     ↓
  │   SandboxScreen.mount()
  │
  └─→ SceneManager.switchTo(SceneId.Sandbox)
        ↓
      MainMenuScene.teardown()
        ↓
      SandboxScene.setup()
        ↓
      ✨ User sees Sandbox UI + 3D scene
```

## Testing in Sandbox

### Quick Start
1. Launch app → Main Menu
2. Click "🧪 Sandbox" button
3. See example objects (Planet, Moon, Star)
4. Camera auto-orbits for 360° view

### Adding Test Objects
```ts
// SandboxScene.ts - in setup()

const myTestObject = PlanetBuilder.create('test-id', this.textureResolver, {
  radius: 1.5,
  tintColor: 0xff0000,
  tintIntensity: 0.6,
  hasAtmosphere: true,
  atmosphereColor: 0xff4400,
  rotationSpeed: 0.04,
});

this.setupScene(engine)
  .add(myTestObject, { position: [5, 0, 0] })
  .build();
```

### Grid & Axes Reference
- **Grid**: XZ plane, white lines every 1 unit
- **Axes**: 
  - Red = X axis (right)
  - Green = Y axis (up)
  - Blue = Z axis (forward)

### Camera Control
- Auto-orbit: Slow rotation around origin
- Adjust `cameraDistance` for zoom
- Modify `cameraAngle` speed in `update()`

## Best Practices

### ✅ DO
- Use `GameScreenManager.navigateTo()` for screen transitions
- Define screens as GameScreenConfig objects
- Keep UI and Scene logic separated
- Follow Clean Architecture layers
- Use SceneBuilder fluent API for object setup

### ❌ DON'T
- Don't call `screenRouter.show()` and `sceneManager.switchTo()` separately
- Don't mix UI logic in Scene classes
- Don't mix 3D logic in Screen classes
- Don't bypass GameScreenManager for navigation
- Don't forget to register screens/scenes in bootstraps

## Future Enhancements

### Sandbox UI
- [ ] Object spawner panel
- [ ] Camera control (orbit, pan, zoom)
- [ ] Scene stats (FPS, objects, triangles)
- [ ] Visual component library browser
- [ ] Save/load scene configurations
- [ ] Screenshot/recording tools

### GameScreenManager
- [ ] Transition animations
- [ ] Loading screens
- [ ] Navigation history (back/forward)
- [ ] State persistence
- [ ] Lifecycle hooks (onBeforeNavigate, onAfterNavigate)

### Architecture
- [ ] Middleware system for navigation
- [ ] Lazy loading for screens/scenes
- [ ] Prefetching/preloading
- [ ] Analytics hooks
