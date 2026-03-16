-- =======================================================================
-- respawn_below_height.lua (custom script resource)
-- When entity's Y position falls below threshold, teleports to spawn position.
-- Use on dynamic balls that fall off a balance - respawns them back on top.
-- =======================================================================

---@class RespawnBelowHeightPropsV2
---@field respawnHeight number Y threshold. If position.y < this, respawn. Default: 1.
---@field spawnX number Spawn world X. Default: 0.
---@field spawnY number Spawn world Y. Default: 5.
---@field spawnZ number Spawn world Z. Default: 0.

---@class RespawnBelowHeightScript : ScriptInstanceV2
---@field properties RespawnBelowHeightPropsV2
local RespawnBelowHeight = {
    schema = {
        name = "Respawn Below Height (V2)",
        description = "Teleports entity to spawn position when Y falls below threshold.",
        properties = {
            respawnHeight = { type = "number", default = 1,   description = "Y threshold." },
            spawnX       = { type = "number", default = 0,    description = "Spawn X." },
            spawnY       = { type = "number", default = 5,    description = "Spawn Y." },
            spawnZ       = { type = "number", default = 0,    description = "Spawn Z." }
        }
    }
}

function RespawnBelowHeight:update(_dt)
    local pos = self.entity.components.transform.getPosition()
    if not pos then return end

    local props = self.properties
    if pos.y < props.respawnHeight then
        local eid = tostring(self.entity.id)
        self.Physics.teleportBody(eid, {
            x = props.spawnX,
            y = props.spawnY,
            z = props.spawnZ
        })
    end
end

return RespawnBelowHeight
