-- ═══════════════════════════════════════════════════════════════════════
-- ui_stats.lua
-- Sample Viewport UI Plugin providing camera stats and info.
-- ═══════════════════════════════════════════════════════════════════════

---@class ViewportStatsProps
---@field visible boolean

---@type ViewportPluginModule<ViewportStatsProps, {}>
return {
    schema = {
        name = "Viewport Stats",
        description = "Displays camera position and viewport ID.",
        properties = {
            visible = { type = "boolean", default = true }
        }
    },

    ---@param self ViewportPluginInstance<ViewportStatsProps, {}>
    getUI = function(self, ctx)
        if not self.properties.visible then return nil end

        local vp = self.viewport
        local camPosText = "No Camera"

        if vp.cameraEntityId then
            local cam = ctx.engine.getEntity(vp.cameraEntityId)
            if cam then
                local p = cam:getPosition()
                camPosText = string.format("X: %.2f Y: %.2f Z: %.2f", p.x, p.y, p.z)
            end
        end

        return {
            {
                slot = "overlay",
                descriptor = {
                    type = "container",
                    props = {
                        id = "viewport-stats-" .. vp.id,
                        style = {
                            position = "absolute",
                            bottom = "20px",
                            left = "20px",
                            padding = "12px",
                            backgroundColor = "rgba(15, 15, 20, 0.8)",
                            backdropFilter = "blur(4px)",
                            borderRadius = "8px",
                            border = "1px solid rgba(255, 255, 255, 0.1)",
                            color = "#e0e0e0",
                            fontFamily = "'Inter', sans-serif",
                            fontSize = "11px",
                            pointerEvents = "none",
                            display = "flex",
                            flexDirection = "column",
                            gap = "4px",
                            boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)"
                        }
                    },
                    children = {
                        {
                            type = "text",
                            props = {
                                value = "VIEWPORT: " .. string.upper(vp.id),
                                style = { fontWeight = "bold", color = "#60a5fa", letterSpacing = "0.05em" }
                            }
                        },
                        {
                            type = "text",
                            props = {
                                value = "CAMERA: " .. camPosText,
                                style = { opacity = 0.8 }
                            }
                        }
                    }
                }
            }
        }
    end
}
