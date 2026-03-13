-- =======================================================================
-- spawn_on_interval.lua
-- Periodically instantiates a prefab at this entity's position + offset.
-- Respects a maximum instance count (does not track despawned instances).
-- =======================================================================

---@class SpawnOnIntervalState
---@field timer     number
---@field count     number

---@type ScriptBlueprint<SpawnOnIntervalProps, SpawnOnIntervalState>
return {
    schema = {
        name = "Spawn on Interval",
        description = "Spawns a prefab periodically at this entity's position.",
        properties = {
            prefab   = { type = "prefab",  required = true, default = "", description = "Prefab to instantiate." },
            interval = { type = "number",  default = 2,   description = "Seconds between spawns." },
            maxCount = { type = "number",  default = 10,  description = "Maximum number of spawned instances." },
            offset   = { type = "vec3",    default = { 0, 0, 0 }, description = "Spawn offset from this entity." }
        }
    },

    ---@param self ScriptInstance<SpawnOnIntervalProps, SpawnOnIntervalState>
    init = function(self)
        self.state.timer = 0
        self.state.count = 0
    end,

    ---@param self ScriptInstance<SpawnOnIntervalProps, SpawnOnIntervalState>
    ---@param dt number
    update = function(self, dt)
        local props = self.properties
        local state = self.state

        state.timer = state.timer + dt
        if state.timer < props.interval then return end
        state.timer = state.timer - props.interval

        if state.count >= props.maxCount then return end

        local prefab = props.prefab
        if not prefab then return end

        local spawnPos = self:getPosition() + props.offset
        local spawned  = prefab:instantiate({ position = spawnPos:toArray() })
        if spawned then
            state.count = state.count + 1
        end
    end
}
