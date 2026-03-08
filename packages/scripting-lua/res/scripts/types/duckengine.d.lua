-- DuckEngine Scripting v2 Type Definitions
-- Copy this file to your project and set it as a fallback Lua library in your IDE
-- for full type checking and intellisense in Lua scripts.
-- NOTE: All classes are suffixed with V2 to avoid conflicts with core v1

---@class TransformV2
---@field position Vec3V2
---@field rotation QuatV2
---@field scale Vec3V2
---@field parent string|nil
TransformV2 = {}

---@param pos Vec3V2
function TransformV2.setPosition(pos) end

---@param rot QuatV2
function TransformV2.setRotation(rot) end

---@param s Vec3V2
function TransformV2.setScale(s) end

---@param target Vec3V2
---@param worldUp Vec3V2|nil
function TransformV2.lookAt(target, worldUp) end

---@param axis Vec3V2
---@param angle number in radians
function TransformV2.rotate(axis, angle) end

---@param x number in radians
---@param y number in radians
---@param z number in radians
function TransformV2.rotate(x, y, z) end

--- Scene system bridge for instantiation and events.
---@class SceneV2
SceneV2 = {}

--- Instantiate an entity from a prefab or template.
---@param templateId string
---@param worldPos Vec3V2|nil (defaults to origin)
---@param worldRot QuatV2|nil (defaults to identity)
---@return string entityId
function SceneV2.instantiate(templateId, worldPos, worldRot) end

--- Broadcast an event to all scripts in the scene.
---@param eventName string
---@param data table|nil
function SceneV2.broadcast(eventName, data) end

--- Destroy an entity.
---@param entityId string
function SceneV2.destroy(entityId) end

--- Physics system bridge.
---@class PhysicsV2
PhysicsV2 = {}

---@param force Vec3V2
function PhysicsV2.applyForce(force) end

---@param impulse Vec3V2
function PhysicsV2.applyImpulse(impulse) end

--- Cast a ray and return the first hit.
---@param ray RaycastQueryV2
---@return RaycastHitV2|nil
function PhysicsV2.raycast(ray) end

--- Input system bridge.
---@class InputV2
InputV2 = {}

---@param key string e.g. "w", "space", "leftclick"
---@return boolean
function InputV2.isKeyPressed(key) end

--- Get mouse movement delta in screen space.
---@return Vec2V2
function InputV2.getMouseDelta() end

--- Get mouse button states.
---@return MouseButtonsV2
function InputV2.getMouseButtons() end

--- Time bridge (read-only during frame execution).
---@class TimeV2
TimeV2 = {}
---@type number
TimeV2.delta = 0
---@type number
TimeV2.elapsed = 0
---@type number
TimeV2.frameCount = 0
---@type number
TimeV2.scale = 1

--- Gizmo system for debug visualization.
---@class GizmoV2
GizmoV2 = {}

---@param from Vec3V2
---@param to Vec3V2
---@param color string|nil (hex or name)
function GizmoV2.drawLine(from, to, color) end

---@param center Vec3V2
---@param radius number
---@param color string|nil
function GizmoV2.drawSphere(center, radius, color) end

---@param center Vec3V2
---@param size Vec3V2
---@param color string|nil
function GizmoV2.drawBox(center, size, color) end

---@param text string
---@param position Vec3V2
---@param color string|nil
function GizmoV2.drawLabel(text, position, color) end

function GizmoV2.clear() end

--- Event bus for script-to-script communication.
---@class EventsV2
EventsV2 = {}

---@param eventName string
---@param data table
function EventsV2.fire(eventName, data) end

---@param eventName string
---@param callback fun(data: table): void
---@return fun(): void unsubscribe function
function EventsV2.on(eventName, callback) end

--- Vector3 with operator overloading and utility methods.
---@class Vec3V2
---@field x number
---@field y number
---@field z number
Vec3V2 = {}

---@return number
function Vec3V2:length() end

---@return Vec3V2
function Vec3V2:normalize() end

---@param other Vec3V2
---@return number
function Vec3V2:dot(other) end

---@param other Vec3V2
---@return Vec3V2
function Vec3V2:cross(other) end

---@param other Vec3V2
---@return number
function Vec3V2:distanceTo(other) end

---@return Vec3V2
function Vec3V2:clone() end

---@param other Vec3V2
---@param t number (0-1)
---@return Vec3V2
function Vec3V2:lerp(other, t) end

---@return number[]
function Vec3V2:toArray() end

--- Create a new Vec3V2.
---@param x number|nil
---@param y number|nil
---@param z number|nil
---@return Vec3V2
function math.vec3(x, y, z) end

--- Zero vector (0, 0, 0).
---@return Vec3V2
function math.vec3.zero() end

--- Unit vector (1, 1, 1).
---@return Vec3V2
function math.vec3.one() end

--- Up vector (0, 1, 0).
---@return Vec3V2
function math.vec3.up() end

--- Forward vector (0, 0, -1).
---@return Vec3V2
function math.vec3.forward() end

--- Right vector (1, 0, 0).
---@return Vec3V2
function math.vec3.right() end

--- Math extensions and utilities.
---@class MathExtV2
math.ext = {}

---@param a number
---@param b number
---@param t number (0-1)
---@return number
function math.ext.lerp(a, b, t) end

---@param v number
---@param lo number
---@param hi number
---@return number
function math.ext.clamp(v, lo, hi) end

---@param a number
---@param b number
---@param v number
---@return number
function math.ext.inverseLerp(a, b, v) end

---@param iLo number
---@param iHi number
---@param oLo number
---@param oHi number
---@param v number
---@return number
function math.ext.remap(iLo, iHi, oLo, oHi, v) end

---@param x number
---@return number -1, 0, or 1
function math.ext.sign(x) end

---@param current number
---@param target number
---@param maxDelta number
---@return number
function math.ext.moveTowards(current, target, maxDelta) end

--- Easing function library.
---@class EasingFunctionsV2
math.ext.easing = {}

---@param t number (0-1)
---@return number
function math.ext.easing.linear(t) end

function math.ext.easing.smoothstep(t) end
function math.ext.easing.quadIn(t) end
function math.ext.easing.quadOut(t) end
function math.ext.easing.cubicIn(t) end
function math.ext.easing.cubicOut(t) end
function math.ext.easing.sineIn(t) end
function math.ext.easing.sineOut(t) end

--- Quaternion (rotation).
---@class QuatV2
---@field x number
---@field y number
---@field z number
---@field w number

--- 2D vector.
---@class Vec2V2
---@field x number
---@field y number

--- Raycast query.
---@class RaycastQueryV2
---@field origin Vec3V2
---@field direction Vec3V2 (normalized)
---@field maxDistance number

--- Raycast hit result.
---@class RaycastHitV2
---@field entityId string
---@field point Vec3V2
---@field distance number

--- Mouse button state.
---@class MouseButtonsV2
---@field left boolean
---@field right boolean
---@field middle boolean

--- Script instance self parameter (passed to hooks).
---@class ScriptInstanceV2
---@field id string Entity ID
---@field __slotKey string Internal: slot key
---@field state table Your custom state object
---@field properties table Properties synced from ECS

--- Lifecycle hooks your script can define.
---@class ScriptHooksV2
---@field init fun(self: ScriptInstanceV2): void Called once on script initialization
---@field onEnable fun(self: ScriptInstanceV2): void Called when script/entity becomes enabled
---@field earlyUpdate fun(self: ScriptInstanceV2, dt: number): void First frame hook
---@field update fun(self: ScriptInstanceV2, dt: number): void Main update hook
---@field lateUpdate fun(self: ScriptInstanceV2, dt: number): void Last frame hook
---@field onDrawGizmos fun(self: ScriptInstanceV2): void Debug drawing
---@field onCollisionEnter fun(self: ScriptInstanceV2, ...: any): void Collision begin
---@field onCollisionExit fun(self: ScriptInstanceV2, ...: any): void Collision end
---@field onPropertyChanged fun(self: ScriptInstanceV2, key: string, newValue: any): void Property sync from ECS
---@field onDisable fun(self: ScriptInstanceV2): void Called when script/entity becomes disabled
---@field onDestroy fun(self: ScriptInstanceV2): void Called when script is destroyed
