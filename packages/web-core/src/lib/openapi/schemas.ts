/**
 * Shared OpenAPI schema definitions.
 *
 * This file is intentionally "docs-only": it exports nothing at runtime and is
 * only picked up by swagger-jsdoc via `apis` globs.
 *
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       required: [error]
 *       properties:
 *         error:
 *           type: string
 *         message:
 *           type: string
 *         details:
 *           type: object
 *           additionalProperties: true
 *
 *     Resource:
 *       type: object
 *       required: [id, key, displayName, kind, activeVersion, createdAt, updatedAt]
 *       properties:
 *         id:
 *           type: string
 *         key:
 *           type: string
 *         displayName:
 *           type: string
 *         kind:
 *           type: string
 *         activeVersion:
 *           type: integer
 *         thumbnailFileAssetId:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ResourceSummary:
 *       description: Resource row with Prisma `_count` for versions.
 *       allOf:
 *         - $ref: '#/components/schemas/Resource'
 *         - type: object
 *           required: [_count]
 *           properties:
 *             _count:
 *               type: object
 *               required: [versions]
 *               properties:
 *                 versions:
 *                   type: integer
 *
 *     ResourceVersion:
 *       type: object
 *       required: [id, resourceId, version, componentType, componentData, createdAt]
 *       properties:
 *         id:
 *           type: string
 *         resourceId:
 *           type: string
 *         version:
 *           type: integer
 *         componentType:
 *           type: string
 *         componentData:
 *           type: string
 *           description: JSON string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     FileAsset:
 *       type: object
 *       required: [id, fileName, contentType, size, sha256, storagePath, createdAt]
 *       properties:
 *         id:
 *           type: string
 *         fileName:
 *           type: string
 *         contentType:
 *           type: string
 *         size:
 *           type: integer
 *         sha256:
 *           type: string
 *         storagePath:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ResourceBinding:
 *       type: object
 *       required: [id, resourceVersionId, slot, fileAssetId, createdAt]
 *       properties:
 *         id:
 *           type: string
 *         resourceVersionId:
 *           type: string
 *         slot:
 *           type: string
 *         fileAssetId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ResourceBindingWithFile:
 *       allOf:
 *         - $ref: '#/components/schemas/ResourceBinding'
 *         - type: object
 *           required: [fileAsset]
 *           properties:
 *             fileAsset:
 *               $ref: '#/components/schemas/FileAsset'
 *
 *     ResourceVersionWithBindings:
 *       allOf:
 *         - $ref: '#/components/schemas/ResourceVersion'
 *         - type: object
 *           required: [bindings]
 *           properties:
 *             bindings:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ResourceBindingWithFile'
 *
 *     ResourceWithVersions:
 *       allOf:
 *         - $ref: '#/components/schemas/Resource'
 *         - type: object
 *           required: [versions]
 *           properties:
 *             versions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ResourceVersionWithBindings'
 *
 *     CreateResourceRequest:
 *       type: object
 *       required: [kind, key, displayName]
 *       properties:
 *         kind:
 *           type: string
 *         key:
 *           type: string
 *         displayName:
 *           type: string

 *     CreateResourceFromZipResponse:
 *       type: object
 *       required: [resource, version]
 *       properties:
 *         resource:
 *           $ref: '#/components/schemas/Resource'
 *         version:
 *           $ref: '#/components/schemas/ResourceVersion'
 *
 *     PatchResourceRequest:
 *       type: object
 *       additionalProperties: false
 *       properties:
 *         displayName:
 *           type: string
 *
 *     ResolvedFile:
 *       type: object
 *       required: [id, fileName, contentType, size, sha256, url]
 *       properties:
 *         id:
 *           type: string
 *         fileName:
 *           type: string
 *         contentType:
 *           type: string
 *         size:
 *           type: integer
 *         sha256:
 *           type: string
 *         url:
 *           type: string
 *
 *     ResolvedResource:
 *       type: object
 *       required: [key, resourceId, version, componentType, componentData, files]
 *       properties:
 *         key:
 *           type: string
 *         resourceId:
 *           type: string
 *         version:
 *           type: integer
 *         componentType:
 *           type: string
 *         componentData:
 *           type: object
 *           additionalProperties: true
 *         files:
 *           type: object
 *           additionalProperties:
 *             $ref: '#/components/schemas/ResolvedFile'

 *     ResourceKindsResponse:
 *       type: object
 *       required: [data]
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             type: string
 *             description: Resource kind identifier
 */

export {};
