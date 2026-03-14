# Jerarquía de entidades, colliders y rigid bodies

## Composición de varios colliders bajo una entidad con rigidBody

En core-v2 cada entidad tiene **como máximo un** componente de tipo collider (box, sphere, capsule, etc.); los tipos son mutuamente excluyentes. La composición de **varios colliders** se hace con la **jerarquía de entidades**:

- La entidad que tiene **rigidBody** es el “dueño” del cuerpo físico (un único `RigidBody` en Rapier).
- Cualquier **descendiente** (hijo, nieto, etc.) que tenga un **collider** aporta ese collider al **mismo** cuerpo.
- La pose de cada collider se calcula como la **pose local** del nodo del collider respecto al dueño del cuerpo (`getLocalPoseRelativeTo(bodyOwner, entity)`).

```
Root (rigidBody)                    → 1 Rapier RigidBody
├── ChildA (boxCollider)            → collider colgado del body de Root, pose local A respecto a Root
├── ChildB (sphereCollider)         → collider colgado del body de Root, pose local B respecto a Root
└── Mid (sin rigidBody, sin collider)
    └── ChildC (capsuleCollider)   → collider colgado del body de Root, pose local C respecto a Root
```

Flujo actual:

1. **addEntity** / **ensureCollidersInSubtree**: para cada entidad con collider se busca el **ancestro más cercano con rigidBody** (`findNearestRigidBodyOwner`). Ese ancestro tiene (o se le crea) el Rapier body; el collider se crea con `world.createCollider(desc, body)` y pose local respecto a ese body owner.
2. **getLocalPoseRelativeTo(bodyOwner, entity)**: compone posición, rotación y escala desde `entity` hasta `bodyOwner` en el árbol, dando la transformación local del collider respecto al cuerpo.

Así, “varios colliders bajo una entidad con rigidBody” = un rigidBody por entidad dueña + N colliders (de hijos/descendientes) colgando de ese mismo body con sus poses locales. No hace falta un body por collider.

---

## Árbol con varios rigidBody: comportamiento en cadena

Si en el árbol hay **varias entidades con rigidBody**, hoy ocurre lo siguiente:

- Cada una de esas entidades recibe **su propio** Rapier `RigidBody` (uno por entidad con componente `rigidBody`).
- Los colliders de los descendientes se cuelgan del **ancestro con rigidBody más cercano** (igual que arriba).
- Los cuerpos de padre e hijo **no están vinculados**: son independientes y pueden atravesarse.

Ejemplo:

```
A (rigidBody)     → Body A
└── B (rigidBody) → Body B (independiente de A)
    └── C (boxCollider) → collider en Body B
```

Para que “un árbol de entidades con diferentes rigidBody se comporte como una **cadena**”, hace falta que cada rigid body hijo esté **linkeado** al rigid body del padre mediante un **joint** en Rapier.

- **Objetivo**: si la entidad `B` tiene rigidBody y su padre `A` también tiene rigidBody, el body de `B` debe estar unido al body de `A` (por ejemplo con un **fixed joint** que respete la pose jerárquica).
- **Rapier**: se usa `ImpulseJointSet` y `world.createImpulseJoint(JointData.fixed(...), bodyParent, bodyChild, true)` (o equivalente en la API JS). Los marcos locales del joint se derivan de la pose de la entidad hijo respecto al padre (`getLocalPoseRelativeTo(A, B)`).

Con eso, cada “rigidBody entity” queda linkeada a la de su padre cuando este también tiene rigidBody, y el árbol de rigid bodies se comporta como una cadena articulada (por defecto fija; después se pueden añadir otros tipos de joint si se expone en datos de componente).

---

## Resumen

| Caso | Comportamiento actual | Notas |
|------|----------------------|--------|
| Varios colliders bajo una entidad con rigidBody | Soportado | Varios nodos hijos (cada uno con un collider) → un solo body, N colliders con pose local. |
| Varios rigidBody en el árbol sin linkear | Soportado | Cada entidad con rigidBody tiene su propio body; no hay joints. |
| Cadena de rigidBody (padre–hijo linkeados) | Implementado | Al crear el body de un hijo cuyo padre tiene rigidBody, se crea un **fixed joint** entre ambos (anchor/frame del hijo = pose local respecto al padre). Los cuerpos quedan linkeados en cadena. |
