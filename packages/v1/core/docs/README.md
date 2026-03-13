# Duck Engine Core Documentation

Welcome to the Duck Engine Core documentation! This guide will help you understand the architecture, systems, and APIs of the Duck Engine's core package.

## 📚 Documentation Structure

### For Developers New to Duck Engine

Start here to understand the fundamentals:

1. **[Architecture Overview](./ARCHITECTURE.md)** ⭐ **Start Here**
   - Design philosophy and principles
   - Package structure and organization
   - Core systems overview
   - Extension points and customization

2. **[ECS System](./ECS.md)**
   - Entity-Component architecture
   - Component lifecycle and validation
   - Transform system and hierarchy
   - Built-in components reference

3. **[Scripting Guide](./SCRIPTING_GUIDE.md)**
   - Writing your first script
   - Practical examples and patterns
   - Complete API reference
   - Common use cases

### For Advanced Development

Deep dive into specific systems:

4. **[Lua Scripting System](./SCRIPTING.md)**
   - Sandbox architecture
   - Script compilation and storage
   - Hook lifecycle
   - Bridge system internals
   - Performance optimization

5. **[System Flows & Diagrams](./FLOWS.md)**
   - Visual architecture diagrams
   - Data flow charts
   - Lifecycle flows
   - Performance optimization points

## 🎯 Quick Reference

### Common Tasks

| Task | Documentation |
|------|---------------|
| Create an entity | [ECS - Entity Class](./ECS.md#entity-class) |
| Add components | [ECS - Component Management](./ECS.md#component-management) |
| Write a Lua script | [Scripting Guide - Your First Script](./SCRIPTING_GUIDE.md#your-first-script) |
| Handle input | [Scripting Guide - Input Handling](./SCRIPTING_GUIDE.md#input-handling) |
| Physics & collision | [Scripting Guide - Physics & Collision](./SCRIPTING_GUIDE.md#physics--collision) |
| Camera scripts | [Scripting Guide - Camera Scripts](./SCRIPTING_GUIDE.md#camera-scripts) |
| Debug visualization | [Scripting Guide - Debug Visualization](./SCRIPTING_GUIDE.md#debug-visualization) |
| Cross-entity events | [Scripting Guide - Custom Events](./SCRIPTING_GUIDE.md#custom-events) |

### API References

| API | Documentation |
|-----|---------------|
| Transform | [Scripting Guide - Transform API](./SCRIPTING_GUIDE.md#transform-api) |
| Physics | [Scripting Guide - Physics API](./SCRIPTING_GUIDE.md#physics-api) |
| Input | [Scripting Guide - Input API](./SCRIPTING_GUIDE.md#input-api) |
| Scene | [Scripting Guide - Scene API](./SCRIPTING_GUIDE.md#scene-api) |
| Math | [Scripting Guide - Math API](./SCRIPTING_GUIDE.md#math-api) |
| Time | [Scripting Guide - Time API](./SCRIPTING_GUIDE.md#time-api) |
| Gizmos | [Scripting Guide - Gizmo API](./SCRIPTING_GUIDE.md#gizmo-api-debug) |

## 🔍 Find by Topic

### Architecture & Design

- **Design Philosophy** → [Architecture - Design Philosophy](./ARCHITECTURE.md#design-philosophy)
- **Dependency Injection** → [Architecture - Dependency Injection](./ARCHITECTURE.md#dependency-injection--inversion-of-control)
- **Event-Driven Architecture** → [Architecture - Event-Driven Architecture](./ARCHITECTURE.md#event-driven-architecture)
- **Error Handling** → [Architecture - Error Handling](./ARCHITECTURE.md#error-handling)
- **Extension Points** → [Architecture - Extension Points](./ARCHITECTURE.md#extension-points)

### Entity-Component-System

- **Entity Basics** → [ECS - Entity Class](./ECS.md#entity-class)
- **Component Basics** → [ECS - Component Base Class](./ECS.md#component-base-class)
- **Component Metadata** → [ECS - Component Metadata](./ECS.md#component-metadata)
- **Observable Pattern** → [ECS - Observable Pattern](./ECS.md#observable-pattern)
- **Transform System** → [ECS - Transform System](./ECS.md#transform-system)
- **Component Factory** → [ECS - Component Factory](./ECS.md#component-factory)
- **Scene Graph** → [ECS - Scene Graph Hierarchy](./ECS.md#scene-graph-hierarchy)

### Lua Scripting

- **Scripting Overview** → [Scripting - Overview](./SCRIPTING.md#overview)
- **Sandbox Security** → [Scripting - Sandboxed Environment](./SCRIPTING.md#sandboxed-environment)
- **Lifecycle Hooks** → [Scripting - Script Lifecycle Hooks](./SCRIPTING.md#script-lifecycle-hooks)
- **Script Properties** → [Scripting - Script Properties](./SCRIPTING.md#script-properties)
- **Built-in Scripts** → [Scripting - Built-in Scripts](./SCRIPTING.md#built-in-scripts)
- **Type Definitions** → [Scripting - Type Definitions](./SCRIPTING.md#type-definitions)
- **Testing Scripts** → [Scripting - Testing Scripts](./SCRIPTING.md#testing-scripts)

### System Internals

- **Script Compilation** → [Scripting - Script Compilation & Storage](./SCRIPTING.md#script-compilation--storage)
- **Bridge System** → [Scripting - Lua Bridges](./SCRIPTING.md#lua-bridges-javascript-apis)
- **Component Observers** → [Flows - Component Observer Pattern](./FLOWS.md#component-observer-pattern-flow)
- **Collision Events** → [Flows - Collision Event Flow](./FLOWS.md#collision-event-flow)
- **Transform Propagation** → [Flows - Transform Hierarchy](./FLOWS.md#transform-hierarchy-propagation)

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                    Duck Engine Core                     │
│                  (@duckengine/core)                     │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │     ECS      │  │  Scripting   │  │   Physics   │  │
│  │   Entities   │  │  Lua Sandbox │  │  Abstracts  │  │
│  │  Components  │  │    Bridges   │  │  Collision  │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │   Ports (Interfaces)                              │ │
│  │   - IRenderingEngine  - IPhysicsSystem            │ │
│  │   - ITextureResolver  - ISettingsService          │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Key Principles:**
- ✅ Renderer-agnostic (no Three.js dependency)
- ✅ Physics-agnostic (abstracted interfaces)
- ✅ Type-safe (TypeScript + Lua type definitions)
- ✅ Testable (dependency injection, mocks)
- ✅ Extensible (custom components, bridges, systems)

## 💡 Conceptual Model

### Entity-Component-System

Think of it like building with LEGO:
- **Entity** = The LEGO base plate (holds everything together)
- **Components** = Individual LEGO bricks (mesh, physics, scripts)
- **Systems** = Your hands (external logic that operates on entities)

### Lua Scripting

Think of it like plugins for your browser:
- **Script** = A plugin that adds behavior to a webpage (entity)
- **Hooks** = Events the plugin can listen to (init, update, etc.)
- **Sandbox** = Security restrictions (no file system access)
- **Bridges** = APIs the plugin can call (DOM in browsers, Transform/Physics in Duck Engine)

### Component Observers

Think of it like spreadsheet formulas:
- **Component property change** = Cell value changes
- **Observer notification** = Dependent cells recalculate
- **Reactive update** = UI updates automatically

## 🚀 Learning Paths

### Path 1: Game Developer (Using Duck Engine)

1. Read [Scripting Guide - Getting Started](./SCRIPTING_GUIDE.md#getting-started)
2. Try [Basic Examples](./SCRIPTING_GUIDE.md#basic-examples)
3. Explore [Built-in Scripts](./SCRIPTING.md#built-in-scripts)
4. Check [API Reference](./SCRIPTING_GUIDE.md#complete-api-reference)
5. Study [Common Patterns](./SCRIPTING_GUIDE.md#common-patterns)

### Path 2: Engine Developer (Extending Duck Engine)

1. Read [Architecture Overview](./ARCHITECTURE.md)
2. Study [ECS System](./ECS.md)
3. Understand [Scripting System Internals](./SCRIPTING.md)
4. Review [System Flows](./FLOWS.md)
5. Explore [Extension Points](./ARCHITECTURE.md#extension-points)

### Path 3: AI Agent (Understanding Context)

1. Skim [Architecture Overview](./ARCHITECTURE.md) for structure
2. Review [System Flows](./FLOWS.md) for data flow
3. Check [ECS System](./ECS.md) for entity composition
4. Reference [API docs](./SCRIPTING_GUIDE.md#complete-api-reference) as needed

## 📝 Code Examples Location

- **Lua script examples** → [res/scripts/builtin/](../res/scripts/builtin/)
- **Type definitions** → [res/scripts/types/](../res/scripts/types/)
- **Test examples** → [src/__tests__/](../src/__tests__/)
- **Component examples** → [src/domain/ecs/components/](../src/domain/ecs/components/)

## 🔧 Development Workflow

### Adding a New Component

1. Create class extending `Component` → [ECS - Component Base Class](./ECS.md#component-base-class)
2. Define metadata → [ECS - Component Metadata](./ECS.md#component-metadata)
3. Implement validation (optional) → [ECS - Component Management](./ECS.md#component-management)
4. Register in `ComponentFactory` → [ECS - Component Factory](./ECS.md#component-factory)
5. Add to exports in `src/domain/ecs/components/index.ts`

### Adding a New Lua Bridge

1. Create bridge file in `src/domain/scripting/bridge/`
2. Implement `register*Bridge(engine: LuaEngine, ctx: BridgeContext)`
3. Register in `ScriptBridgeRegistry` → [Scripting - Lua Bridges](./SCRIPTING.md#lua-bridges-javascript-apis)
4. Add type definitions in `res/scripts/types/`
5. Document in scripting guide

### Writing a Custom System

1. Implement `IComponentObserver` (optional) → [ECS - Observable Pattern](./ECS.md#observable-pattern)
2. Subscribe to component changes → [Flows - Component Observer](./FLOWS.md#component-observer-pattern-flow)
3. Integrate into scene lifecycle → [Flows - Scene Lifecycle](./FLOWS.md#scene-lifecycle-flow)

## 🐛 Troubleshooting

**Common issues and solutions:**
- [Scripting Guide - Troubleshooting](./SCRIPTING_GUIDE.md#troubleshooting)
- [Architecture - Error Handling](./ARCHITECTURE.md#error-handling)
- [Flows - Error Handling Flow](./FLOWS.md#error-handling-flow)

## 🤝 Contributing

When contributing to Duck Engine Core:

1. **Understand the architecture** → Read [Architecture Overview](./ARCHITECTURE.md)
2. **Follow coding patterns** → Study existing code in similar areas
3. **Write tests** → Add unit and integration tests
4. **Update documentation** → Keep docs in sync with code changes
5. **Maintain agnosticism** → Never depend on specific renderers/physics engines

## 📮 Getting Help

- **Architecture questions** → [Architecture Overview](./ARCHITECTURE.md)
- **ECS questions** → [ECS System](./ECS.md)
- **Scripting questions** → [Scripting Guide](./SCRIPTING_GUIDE.md)
- **System internals** → [System Flows](./FLOWS.md)
- **Specific APIs** → [API Reference](./SCRIPTING_GUIDE.md#complete-api-reference)

## 📄 Document Index

| Document | Purpose | Audience |
|----------|---------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design and structure | All developers, AI agents |
| [ECS.md](./ECS.md) | Entity-Component-System details | Game developers, engine developers |
| [SCRIPTING.md](./SCRIPTING.md) | Lua scripting internals | Engine developers, advanced users |
| [SCRIPTING_GUIDE.md](./SCRIPTING_GUIDE.md) | Practical scripting examples | Game developers, content creators |
| [FLOWS.md](./FLOWS.md) | Visual system flows | All developers, AI agents |

---

**Ready to dive in?** Start with the [Architecture Overview](./ARCHITECTURE.md)!
