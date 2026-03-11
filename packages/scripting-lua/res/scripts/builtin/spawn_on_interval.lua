-- =======================================================================
-- spawn_on_interval.lua (V2)
-- Periodically instantiates a prefab at this entity's position + offset.
-- Respects a maximum instance count (does not track despawned instances).
-- =======================================================================

---@class SpawnOnIntervalPropsV2
---@field prefab string Prefab ID to instantiate (prefabRef).
---@field interval number Seconds between spawns. Default: 2.
---@field maxCount number Maximum number of spawned instances. Default: 10.
---@field offset Vec3V2|table Spawn offset from this entity. Default: {0,0,0}.

---@class SpawnOnIntervalStateV2
---@field timer number Time accumulator.
---@field count number Number of instances spawned.

---@class SpawnOnIntervalScript : ScriptInstanceV2
---@field properties SpawnOnIntervalPropsV2
---@field state SpawnOnIntervalStateV2
local SpawnOnInterval = {
    schema = {
        name = "Spawn on Interval (V2)",
        description = "Spawns a prefab periodically at this entity's position.",
        properties = {
            prefab   = { type = "prefabRef", default = "", description = "Prefab to instantiate." },
            interval = { type = "number",  default = 2,   description = "Seconds between spawns." },
            maxCount = { type = "number",  default = 10,  description = "Maximum number of spawned instances." },
            offset   = { type = "vec3",    default = { 0, 0, 0 }, description = "Spawn offset from this entity." }
        }
    }
}

function SpawnOnInterval:init()
    self.state = {
        timer = 0,
        count = 0
    }
end

function SpawnOnInterval:update(dt)
    local props  = self.properties
    local state  = self.state

    state.timer = state.timer + dt
    if state.timer < props.interval then return end
    state.timer = state.timer - props.interval

    if state.count >= props.maxCount then return end

    local prefabId = props.prefab
    if not prefabId or prefabId == "" then return end

    local posRaw = self.entity.components.transform.getPosition()
    local offset = props.offset or { x = 0, y = 0, z = 0 }
    local spawnPos = {
        x = posRaw.x + (offset.x or offset[1] or 0),
        y = posRaw.y + (offset.y or offset[2] or 0),
        z = posRaw.z + (offset.z or offset[3] or 0)
    }

    local spawned = self.Scene.instantiate(prefabId, spawnPos)
    if spawned then
        state.count = state.count + 1
    end
end

return SpawnOnInterval
