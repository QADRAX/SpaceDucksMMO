---@meta

-- =========================================================================
-- DuckEngine Lua API Definitions
-- Include this file in your IDE's Lua workspace to enable autocomplete
-- =========================================================================

---@class ScriptSelf : LuaEntity
---@field slotId string The unique ID of this script slot component
---@field state table<string, any> A persistent storage table specific to this script slot
---@field properties table<string, any> Read-only parameters passed from the ECS component

---@class LuaEntity
---@field id string The ECS Entity ID string
---@field getPosition fun(self: LuaEntity): Vec3|nil
---@field setPosition fun(self: LuaEntity, x: number, y: number, z: number)
---@field getRotation fun(self: LuaEntity): Vec3|nil
---@field setRotation fun(self: LuaEntity, pitch: number, yaw: number, roll: number)
---@field getScale fun(self: LuaEntity): Vec3|nil
---@field setScale fun(self: LuaEntity, x: number, y: number, z: number)
---@field getForward fun(self: LuaEntity): Vec3
---@field getRight fun(self: LuaEntity): Vec3
---@field getUp fun(self: LuaEntity): Vec3
---@field lookAt fun(self: LuaEntity, x: number, y: number, z: number)
---@field applyImpulse fun(self: LuaEntity, x: number, y: number, z: number)
---@field getLinearVelocity fun(self: LuaEntity): Vec3|nil
---@field getComponent fun(self: LuaEntity, type: string): table|nil Returns a static snapshot of another component

---@class ScriptSchemaProperty
---@field type "number"|"string"|"boolean"|"entity"|"vec3"
---@field default any
---@field description string

---@class ScriptSchema
---@field name string
---@field description string
---@field properties table<string, ScriptSchemaProperty>

---@class ScriptModule
---@field schema ScriptSchema|nil Definition of properties available for the UI Inspector
---@field init fun(self: ScriptSelf)|nil Called once when the script is first attached
---@field onEnable fun(self: ScriptSelf)|nil Called when the component becomes active
---@field onPropertyChanged fun(self: ScriptSelf, key: string, value: any)|nil Called when a property is changed in the inspector
---@field earlyUpdate fun(self: ScriptSelf, dt: number)|nil Called before physics and inputs
---@field update fun(self: ScriptSelf, dt: number)|nil Called every logic frame
---@field lateUpdate fun(self: ScriptSelf, dt: number)|nil Called after physics and layout
---@field onCollisionEnter fun(self: ScriptSelf, otherEntityId: string)|nil Called on physics overlap start
---@field onCollisionExit fun(self: ScriptSelf, otherEntityId: string)|nil Called on physics overlap end
---@field onDestroy fun(self: ScriptSelf)|nil Called just before the script is removed

---@class Vec3
---@field x number
---@field y number
---@field z number

---@class TransformAPI
---@field getPosition fun(target: ScriptSelf|string): Vec3|nil
---@field setPosition fun(target: ScriptSelf|string, x: number, y: number, z: number)
---@field getRotation fun(target: ScriptSelf|string): Vec3|nil
---@field setRotation fun(target: ScriptSelf|string, pitch: number, yaw: number, roll: number)
---@field getScale fun(target: ScriptSelf|string): Vec3|nil
---@field setScale fun(target: ScriptSelf|string, x: number, y: number, z: number)
---@field getForward fun(target: ScriptSelf|string): Vec3
---@field getRight fun(target: ScriptSelf|string): Vec3
---@field getUp fun(target: ScriptSelf|string): Vec3
---@field lookAt fun(target: ScriptSelf|string, x: number, y: number, z: number)
transform = {} ---@type TransformAPI

---@class PhysicsAPI
---@field getLinearVelocity fun(target: ScriptSelf|string): Vec3|nil
---@field setLinearVelocity fun(target: ScriptSelf|string, x: number, y: number, z: number)
---@field getAngularVelocity fun(target: ScriptSelf|string): Vec3|nil
---@field setAngularVelocity fun(target: ScriptSelf|string, x: number, y: number, z: number)
---@field applyImpulse fun(target: ScriptSelf|string, x: number, y: number, z: number)
---@field applyTorqueImpulse fun(target: ScriptSelf|string, x: number, y: number, z: number)
physics = {} ---@type PhysicsAPI

---@class InputAPI
---@field isKeyPressed fun(key: string): boolean
---@field getMouseButtons fun(): number
---@field getMousePosition fun(): {x: number, y: number}
---@field getMouseDelta fun(): {x: number, y: number}
---@field requestPointerLock fun()
---@field exitPointerLock fun()
input = {} ---@type InputAPI

---@class SceneAPI
---@field findEntityByName fun(name: string): string|nil Returns the ID of the first entity matching the name
---@field getEntity fun(id: string): LuaEntity|nil Returns an entity object with transform/physics methods
---@field getEntitiesWithComponent fun(componentType: string): string[] Returns a list of entity IDs
---@field instantiatePrefab fun(prefabId: string, position: Vec3, rotation: Vec3): string|nil Returns the instantiated entity ID
---@field destroyEntity fun(entityId: string)
scene = {} ---@type SceneAPI

---@class TimeAPI
---@field getDeltaTime fun(): number Returns delta time in milliseconds
---@field getElapsedTime fun(): number Returns elapsed total milliseconds since start
time = {} ---@type TimeAPI
