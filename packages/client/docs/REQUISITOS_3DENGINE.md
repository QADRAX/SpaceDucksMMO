Documento de arquitectura propuesta — Sistema de escenas y objetos (español)

Resumen

Contexto: Cliente Electron con three.js (render 3D) y Preact (UI). El objetivo es un motor modular y extensible para permitir mods JavaScript/TypeScript y mantener rendimiento y testabilidad.
Problema actual: Acoplamiento entre lógica de juego y THREE.Object3D (ej.: VisualBody manipula directamente Mesh y componentes visuales realizan mutaciones sobre el objeto de render), lo que dificulta serialización, testeo, simulación en workers y creación de APIs estables para mods.
Objetivo: Diseñar un sistema que separe estado lógico y representación visual, soporte grupos (p. ej. sistemas solares), permita scripts/behaviours attachables a grupos/entidades, y posibilite migración incremental desde la implementación actual.
Requisitos funcionales (principales)

RF1 — Escena: IScene que gestione ciclo de vida (load, enter, exit, transitions), recursos y sistemas.
RF2 — Cámara: cada Scene debe exponer una cámara por defecto y permitir múltiples cámaras (por ejemplo para mini-mapas o snapshots).
RF3 — Objetos: Entity/ISceneObject lógico independiente del Object3D. Debe soportar transformar, jerarquía, tags y metadata.
RF4 — Representación: RenderComponent separada que enlaza con Object3D (p. ej. THREE.Mesh) y mantiene Transform sincronizado desde el estado lógico.
RF5 — Componentes: modelo de Component (Transform, Geometry, Texture, Light, Atmosphere, Orbit, Script, Group) attachable a una entidad.
RF6 — Agrupación: soporte para GroupEntity que encapsula muchas entidades (p. ej. un sistema solar) y puede tener su propio ScriptComponent o GroupBehavior.
RF7 — Scripts / Mod API: registro/versionado de componentes y sistemas, documentación para modders y hooks seguros para crear entidades, grupos y UI.
RF8 — Serialización: snapshots JSON versionados (entities + components).
RF9 — Systems: motor por sistemas (PhysicsSystem, RenderSyncSystem, AISystem, GroupSystem, ScriptSystem), ejecutables en orden controlado.
RF10 — Devtools: panel jerárquico y inspector que se integre con el modelo lógico (no con objetos three.js directos). Estas devtools estaran presentes en la UI html preact.

Requisitos no funcionales

RNF1 — Performance: paths críticos minimizados, pooling, LOD, culling.
RNF2 — Testabilidad: lógica desacoplada del renderer para tests unitarios (sin three.js).
RNF3 — Compatibilidad: mantener three.js y Preact; evitar romper API pública para mods (usar versionado y adaptadores).
RNF4 — Migración incremental: posible “adapter/wrapper” para usar VisualBody como RenderComponent provisional.
RNF5 — Seguridad de mods: documentar límites y patrones para sandboxing; proveer API limitada.