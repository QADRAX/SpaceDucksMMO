# Roadmap de Implementación - Rendering Engine Refactor

## 📊 Estado Actual

```
FASE 1: rendering-base                    ✅ COMPLETADA
  └─ Domain (70% código)
  └─ Application (25% coordinadores)
  └─ Infrastructure (5% utilities)
  └─ Compilación: ✅ Sin errores
  └─ Próximo: Integración con rendering-webgpu

FASE 2: rendering-webgpu (actual three)  ⏳ PENDIENTE
  └─ Rename: rendering-three → rendering-webgpu
  └─ Extend from base
  └─ WebGPU-specific domain
  └─ Features as IRenderFeature adapters
  └─ RenderSyncSystem inheritance

FASE 3: rendering-webgl                 ⏳ FUTURO
  └─ Create parallel to WebGPU
  └─ WebGL-specific implementation
  └─ Shared features logic
  └─ Fallback support

FASE 4: rendering-facade                ⏳ FUTURO
  └─ WebGPU detection
  └─ Renderer switching
  └─ Fallback orchestration
  └─ Unified API
```

## 🎯 Estrategia de Migración del Monolito

### Opción A: Gradual (Recomendada)
```
1. FASE 2: rendering-webgpu hereda de rendering-base
   - rendering-three se queda como está (temporalmente)
   - New code usa rendering-webgpu
   
2. Coexistencia temporal
   - Old: rendering-three
   - New: rendering-webgpu + rendering-base
   - Client valida que ambos funcionan
   
3. Migración de clientes
   - Actualizar imports gradualmente
   - Deprecate rendering-three en próxima versión
   - Remover rendering-three después de 2-3 versiones
```

### Opción B: Big Bang (Más rápido pero riesgoso)
```
1. Refactor rendering-three → rendering-webgpu en paralelo
2. Update all imports/deps at same time
3. Single cut-over
4. Requiere más testing
```

## 📋 FASE 2: Roadmap Detallado

### Sprint 2.1: Setup & Rename (2-3 días)
- [ ] Crear rendering-webgpu como copia de rendering-three
- [ ] Update package.json (name, version, exports)
- [ ] Add @duckengine/rendering-base as dependency
- [ ] Update npm scripts

### Sprint 2.2: Domain WebGPU-specific (2-3 días)
- [ ] Crear domain/entities/ThreeObject.ts
- [ ] Crear domain/entities/WebGPURenderPass.ts
- [ ] Crear domain/ports/IThreeFactory.ts
- [ ] Crear domain/ports/IPostProcessing.ts

### Sprint 2.3: Application WebGPU (3-4 días)
- [ ] RenderFrameUseCase.ts - Orquesta un frame
- [ ] WebGPURenderService.ts - Servicio principal
- [ ] PostProcessingManager.ts - Gestor de PP
- [ ] Update coordinators si es necesario

### Sprint 2.4: Infrastructure Refactoring (5-7 días)
- [ ] ThreeRendererBase extends RendererBase (from base)
- [ ] ThreeRenderer/ThreeMultiRenderer refactor
- [ ] RenderSyncSystem extends coordinador base
- [ ] Features implement IRenderFeature

### Sprint 2.5: Testing & Validation (3-5 días)
- [ ] Update all tests
- [ ] Render tests de integración
- [ ] Performance comparison con three
- [ ] Verify monolith still works

## 🔄 Decisión de Diseño: Mantener o Reemplazar

### ❓ Pregunta Clave
¿Reemplazamos el monolito `rendering-three` o mantenemos coexistencia?

### Recomendación
**Opción A: Coexistencia → Gradual Migrate**
- Menos riesgoso
- Facilita testing de ambos
- Clientes pueden migrar poco a poco  
- Deprecación clara en CHANGELOG
- Remover rendering-three en v0.2.0

### Ventajas
1. **Validación** - Ambos renderers en producción
2. **Rollback** - Si hay problemas, rollback fácil
3. **Testing** - Suite de tests paralela
4. **Performance** - Comparación directa

## 📈 Métricas de Éxito

### Antes (Monolito)
- Tamaño: ~4000 LOC en 1 package
- Acoplamiento a Three.js: 100%
- Testabilidad: Media (muchos mocks)
- Extensibilidad: Baja (hardcoded WebGPU)

### Después (Modular)
- rendering-base: ~2000 LOC, 0% Three.js
- rendering-webgpu: ~3000 LOC, isolated
- rendering-webgl: ~3000 LOC, parallel
- Acoplamiento: Inyectable
- Testabilidad: Alta (domain unit testeable)
- Extensibilidad: Alta (new renderers = new packages)

## 🚀 Próximo Paso

**¿Comenzamos con FASE 2: rendering-webgpu?**

Opción: 
1. **Inmediato** - Empezar mañana refactor rendering-three
2. **Esperar** - Validación más de rendering-base primero
3. **En paralelo** - Ambas simulta­neamente

Recomendación de equipo?
