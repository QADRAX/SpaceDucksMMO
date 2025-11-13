# BaseScreen and Services Pattern

## Overview

`BaseScreen` provides a generic, reusable foundation for creating UI screens in the application. It handles:
- DOM lifecycle (mount/unmount)
- Services injection via React Context
- Navigation callback
- Preact rendering boilerplate

## Architecture

```
BaseScreen (Generic)
  ├─ Services Context Provider
  ├─ Navigation callback
  └─ Abstract renderContent() → Implemented by subclasses

Concrete Screen (e.g., SandboxScreen)
  ├─ Extends BaseScreen
  └─ Returns Component

Component (e.g., SandboxComponent)
  ├─ Uses hooks: useServices(), useI18n(), etc.
  └─ Pure Preact component
```

## Benefits

### 1. **Separation of Concerns**
- **Screen**: Lifecycle management, integration point
- **Component**: Pure UI logic, reusable

### 2. **Services Access**
Components can access services via hooks:

```tsx
// In any component rendered by BaseScreen
function MyComponent() {
  const services = useServices();
  const { t } = useI18n();
  const settings = services?.settings.getSettings();
  
  const handleSave = () => {
    services?.settings.update({ ... });
  };
  
  return <div>{t('my.key')}</div>;
}
```

### 3. **Minimal Boilerplate**
Create new screens with just a few lines:

```tsx
export class MyScreen extends BaseScreen {
  constructor(navigate: (config: GameScreenConfig) => void) {
    super(ScreenId.MyScreen, navigate);
  }

  protected renderContent(): ComponentChild {
    return <MyComponent onNavigate={this.navigate} />;
  }
}
```

## Services Available

Through `useServices()` hook, components can access:

```ts
interface Services {
  settings: SettingsService;      // App settings
  i18n: I18nService;              // Internationalization
  textureResolver: TextureResolver; // Texture loading
  window: WindowService;          // Window management
  scene: SceneService;            // Scene coordination
}
```

### Example: Using SettingsService

```tsx
import useServices from '@client/infrastructure/ui/hooks/useServices';

function SettingsPanel() {
  const services = useServices();
  const [settings, setSettings] = useState(services?.settings.getSettings());

  useEffect(() => {
    // Subscribe to settings changes
    const unsubscribe = services?.settings.subscribe(newSettings => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, [services]);

  const toggleFullscreen = () => {
    services?.settings.update({
      graphics: {
        ...settings.graphics,
        fullscreen: !settings.graphics.fullscreen
      }
    });
  };

  return (
    <button onClick={toggleFullscreen}>
      {settings?.graphics.fullscreen ? 'Windowed' : 'Fullscreen'}
    </button>
  );
}
```

### Example: Using I18nService

```tsx
import useI18n from '@client/infrastructure/ui/hooks/useI18n';

function LocalizedButton() {
  const { t } = useI18n();
  
  return (
    <button>{t('button.play')}</button>
  );
}
```

### Example: Using SceneService

```tsx
import useServices from '@client/infrastructure/ui/hooks/useServices';

function SceneDebugPanel() {
  const services = useServices();
  const sceneService = services?.scene;
  
  const logCurrentScene = () => {
    const currentScene = sceneService?.getCurrentScene();
    console.log('Current scene:', currentScene?.id);
  };
  
  return <button onClick={logCurrentScene}>Log Scene</button>;
}
```

## Pattern Comparison

### ❌ Old Pattern (Tightly Coupled)

```tsx
export class OldScreen implements IScreen {
  private root: HTMLElement | null = null;
  private services?: Services;
  
  mount(container: HTMLElement): void {
    this.root = document.createElement('div');
    // Manual rendering, context setup, lifecycle management
    render(
      <ServicesContext.Provider value={this.services}>
        <MyComponent />
      </ServicesContext.Provider>,
      this.root
    );
    container.appendChild(this.root);
  }
  
  unmount(): void {
    if (this.root) {
      render(null, this.root);
      this.root.remove();
      this.root = null;
    }
  }
}
```

**Problems:**
- Boilerplate repeated in every screen
- Manual lifecycle management
- Tight coupling between screen and rendering logic
- Services injection is manual and error-prone

### ✅ New Pattern (Generic + Composition)

```tsx
// Screen: Just wiring
export class NewScreen extends BaseScreen {
  constructor(navigate: (config: GameScreenConfig) => void) {
    super(ScreenId.NewScreen, navigate);
  }

  protected renderContent(): ComponentChild {
    return <MyComponent onNavigate={this.navigate} />;
  }
}

// Component: Pure UI
function MyComponent({ onNavigate }: Props) {
  const services = useServices();  // ← Automatic via BaseScreen
  const { t } = useI18n();          // ← Works because of context
  
  return <div>{/* UI */}</div>;
}
```

**Benefits:**
- No boilerplate
- Automatic services injection
- Clear separation: Screen = wiring, Component = UI
- Easy to test components in isolation

## Creating a Complex Screen with Services

Example: A stats panel that uses multiple services

```tsx
// 1. Create the component
// components/stats/StatsPanel.tsx
function StatsPanel({ onNavigate }: StatsProps) {
  const services = useServices();
  const { t } = useI18n();
  const [fps, setFps] = useState(0);
  const [settings, setSettings] = useState(services?.settings.getSettings());

  useEffect(() => {
    // Update FPS from scene service
    const interval = setInterval(() => {
      const scene = services?.scene.getCurrentScene();
      // Get FPS somehow
    }, 1000);
    return () => clearInterval(interval);
  }, [services]);

  useEffect(() => {
    // Subscribe to settings
    const unsub = services?.settings.subscribe(setSettings);
    return unsub;
  }, [services]);

  return (
    <div class="stats-panel">
      <h2>{t('stats.title')}</h2>
      <div>FPS: {fps}</div>
      <div>Fullscreen: {settings?.graphics.fullscreen ? 'Yes' : 'No'}</div>
      <button onClick={() => onNavigate(GameScreens.MainMenu)}>
        {t('button.back')}
      </button>
    </div>
  );
}

// 2. Create the screen (minimal)
// screens/StatsScreen.tsx
export class StatsScreen extends BaseScreen {
  constructor(navigate: (config: GameScreenConfig) => void) {
    super(ScreenId.Stats, navigate);
  }

  protected renderContent(): ComponentChild {
    return <StatsPanel onNavigate={this.navigate} />;
  }
}

// 3. Register in GameScreenRegistry
export const GameScreens = {
  // ...
  Stats: {
    screenId: ScreenId.Stats,
    sceneId: SceneId.MainMenu, // Reuse existing scene
    name: 'Statistics'
  } as GameScreenConfig,
}

// 4. Register in UIBootstrap
const statsScreen = new StatsScreen(navigate);
this.router.register(statsScreen);

// 5. Navigate from anywhere
navigate(GameScreens.Stats);
```

## Testing Benefits

With this pattern, components are easy to test:

```tsx
// Component test (without Screen wrapper)
import { render } from '@testing-library/preact';
import { ServicesContext } from '../hooks/useServices';
import StatsPanel from './StatsPanel';

test('renders FPS', () => {
  const mockServices = {
    settings: mockSettingsService,
    scene: mockSceneService,
    // ...
  };
  
  const { getByText } = render(
    <ServicesContext.Provider value={mockServices}>
      <StatsPanel onNavigate={jest.fn()} />
    </ServicesContext.Provider>
  );
  
  expect(getByText(/FPS:/)).toBeInTheDocument();
});
```

## Summary

| Aspect | Old Pattern | New Pattern (BaseScreen) |
|--------|-------------|-------------------------|
| Boilerplate | ~30 lines per screen | ~8 lines per screen |
| Services Access | Manual injection | Automatic via context |
| Testability | Hard (coupled) | Easy (components isolated) |
| Reusability | Low | High |
| Maintainability | Manual lifecycle | Automatic |
| Type Safety | Manual | Enforced by BaseScreen |

**Result:** 
- Screens are now just "wiring" between navigation and components
- Components are pure, testable, and have automatic access to services
- Less code, fewer bugs, better architecture 🎉
