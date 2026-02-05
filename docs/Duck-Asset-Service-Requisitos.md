# 🦆 Duck Engine Web Core -- Documento de Requisitos

## 1. Propósito del sistema

El **Duck Engine Web Core** es un servicio/app web centralizado para la
**gestión, versionado, catalogación y distribución de assets** y, progresivamente,
para soportar **persistencia y edición web de escenas (ECS)** en proyectos desarrollados con Duck Engine.

El sistema:

-   No trabaja en términos de juegos.
-   Mantiene un catálogo transversal de assets reutilizables.
-   Permite persistir, versionar y distribuir cualquier tipo de asset.
-   Expone los assets a través de HTTP REST.
-   Incluye una UI web de administración integrada.
-   Se despliega como una única pieza monolítica en Docker.
-   Usa Basic Auth como sistema inicial de autenticación.

------------------------------------------------------------------------

## 2. Alcance del sistema

### Incluido

-   Gestión de assets lógicos
-   Versionado inmutable de assets
-   Subida y almacenamiento de ficheros
-   Clasificación por categorías y tags
-   API REST de consumo por clientes de Duck Engine
-   UI web de administración
-   Autenticación por Basic Auth
-   Distribución de assets por HTTP
-   Manifiestos de assets
-   Despliegue mediante Docker con volumen persistente

### Excluido

-   No existe concepto de "juego"
-   No existen packs de assets
-   No autenticación avanzada
-   No CDN integrada

------------------------------------------------------------------------

## 3. Actores del sistema

### Administrador de assets

-   Uso de UI
-   Gestión completa del catálogo

### Cliente Duck Engine

-   Descarga de assets vía HTTP
-   Consumo de manifiestos
-   Uso por assetKey y versión

------------------------------------------------------------------------

## 4. Modelo de dominio

### Asset

-   id (UUID)
-   key (string, único)
-   displayName
-   type
-   category
-   tags
-   createdAt
-   updatedAt
-   isArchived

### AssetVersion

-   id
-   assetId
-   version
-   status
-   isDefault
-   notes
-   createdAt

Regla: Las versiones son inmutables a nivel de ficheros.

### AssetFile

-   id
-   assetVersionId
-   fileName
-   relativePath
-   contentType
-   size
-   hash

------------------------------------------------------------------------

## 5. Almacenamiento físico

/data/assets/{assetKey}/{version}/{fileName}

------------------------------------------------------------------------

## 6. Arquitectura técnica

-   Next.js + TypeScript
-   Runtime Node.js
-   Docker obligatorio
-   Volumen persistente
-   SQLite inicialmente

------------------------------------------------------------------------

## 7. Autenticación y seguridad

-   Basic Auth
-   Rutas protegidas:
    -   /admin/\*
    -   /api/admin/\*
-   Variables de entorno:
    -   ASSET_ADMIN_USER
    -   ASSET_ADMIN_PASS

------------------------------------------------------------------------

## 8. API de Administración

### Assets

-   GET /api/admin/assets
-   POST /api/admin/assets
-   GET /api/admin/assets/{assetId}
-   PATCH /api/admin/assets/{assetId}
-   DELETE /api/admin/assets/{assetId}

### Versiones

-   GET /api/admin/assets/{assetId}/versions
-   POST /api/admin/assets/{assetId}/versions
-   GET /api/admin/assets/{assetId}/versions/{versionId}
-   PATCH /api/admin/assets/{assetId}/versions/{versionId}
-   DELETE /api/admin/assets/{assetId}/versions/{versionId}

------------------------------------------------------------------------

## 9. UI de Administración

-   Dashboard
-   Listado y búsqueda de assets
-   Edición de assets
-   Gestión de versiones
-   Visualización de URLs
-   Visualización de manifiestos

------------------------------------------------------------------------

## 10. API Pública

### Manifiesto

-   GET /assets/manifest/by-query

### Descarga

-   GET /assets/file/{assetKey}/{version}/{fileName}
-   GET /assets/file/{assetKey}/latest/{fileName}

------------------------------------------------------------------------

## 11. Requisitos no funcionales

-   Streaming de ficheros
-   Logs estructurados
-   Configuración por entorno
