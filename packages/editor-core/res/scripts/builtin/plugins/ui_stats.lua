-- ═══════════════════════════════════════════════════════════════════════
-- ui_stats.lua
-- Sample Viewport Feature providing camera stats and info.
-- ═══════════════════════════════════════════════════════════════════════

---@class ViewportStatsProps
---@field visible boolean

---@type ViewportFeatureModule<ViewportStatsProps, {}>
return {
    schema = {
        name = "Viewport Stats",
        description = "Displays camera position and viewport ID.",
        properties = {
            visible = { type = "boolean", default = true }
        }
    },

    ---@param self ViewportFeatureInstance<ViewportStatsProps, {}>
    getUI = function(self, ctx)
        if not self.properties.visible then return nil end

        local vp = self.viewport
        local camPosText = "No Camera"

        if vp.cameraEntityId then
            local cam = ctx.session:getEntity(vp.cameraEntityId)
            if cam then
                local p = cam:getPosition()
                camPosText = string.format("X: %.2f Y: %.2f Z: %.2f", p.x, p.y, p.z)
            end
        end

        return {
            slot = "viewport:overlay:bottom-left",
            descriptor = {
                type = "container",
                props = {
                    id = "viewport-stats-" .. vp.id,
                },
                children = {
                    {
                        type = "text",
                        props = {
                            value = "VIEWPORT: " .. string.upper(vp.id),
                            style = { fontWeight = "bold", color = "#60a5fa" }
                        }
                    },
                    {
                        type = "text",
                        props = {
                            value = "CAMERA: " .. camPosText,
                        }
                    }
                }
            }
        }
    end
}
