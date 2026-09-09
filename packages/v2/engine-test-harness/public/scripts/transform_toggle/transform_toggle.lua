-- =======================================================================
-- transform_toggle.lua (custom script resource)
-- Phase-toggles this entity's transform3d.enabled (spatial participation).
-- Even phases (0,2,…) = enabled; odd phases = disabled.
-- Emits stable Log markers for e2e (no host toggle bridge).
-- =======================================================================

---@class TransformTogglePropsV2
---@field interval number Seconds per phase. Default: 3.

---@class TransformToggleStateV2
---@field elapsed number Seconds since init.
---@field enabled boolean Last applied enabled flag.

---@class TransformToggleScript : ScriptInstanceV2
---@field properties TransformTogglePropsV2
---@field state TransformToggleStateV2
local TransformToggle = {
    schema = {
        name = "Transform Toggle (V2)",
        description = "Phase-toggles transform3d.enabled (enter/leave space).",
        properties = {
            interval = { type = "number", default = 3, description = "Seconds per enabled/disabled phase." }
        }
    }
}

function TransformToggle:init()
    local enabled = self.Transform.isEnabled()
    if enabled == nil then
        enabled = true
    end
    self.state = {
        elapsed = 0,
        enabled = enabled
    }
    self.Log.info("transform-toggle: ready")
end

function TransformToggle:update(dt)
    local interval = self.properties.interval
    if type(interval) ~= "number" or interval <= 0 then
        interval = 3
    end

    self.state.elapsed = self.state.elapsed + dt
    local phaseEnabled = (math.floor(self.state.elapsed / interval) % 2) == 0
    if phaseEnabled == self.state.enabled then
        return
    end

    self.state.enabled = phaseEnabled
    self.Transform.setEnabled(phaseEnabled)
    if phaseEnabled then
        self.Log.info("transform-toggle: enabled")
    else
        self.Log.info("transform-toggle: disabled")
    end
end

return TransformToggle
