---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API v2 — Scene
-- Scene instantiation, destruction, and entity broadcasting.
-- ═══════════════════════════════════════════════════════════════════════

---Scene system bridge for instantiation and entity management.
---@class SceneV2
---@field instantiate fun(templateId: string, worldPos?: Vec3V2, worldRot?: QuatV2): string
---@field destroy fun(entityId: string): nil
---@field exists fun(entityId: string): boolean
scene = {}

---Instantiate an entity from a prefab or template.
---@param templateId string Template ID to instantiate.
---@param worldPos Vec3V2|nil World position (defaults to origin).
---@param worldRot QuatV2|nil World rotation (defaults to identity).
---@return string entityId The ID of the newly instantiated entity.
function scene.instantiate(templateId, worldPos, worldRot) end

---Broadcast an event to all scripts in the scene.
---@param eventName string Event name to broadcast.
---@param data table|nil Optional event data payload.
function scene.broadcast(eventName, data) end

---Destroy an entity and all its components.
---@param entityId string Entity ID to destroy.
function scene.destroy(entityId) end

---Check if an entity exists in the scene.
---@param entityId string Entity ID to check.
---@return boolean
function scene.exists(entityId) end
