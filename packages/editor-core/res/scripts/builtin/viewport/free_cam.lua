-- ═══════════════════════════════════════════════════════════════════════
-- free_cam.lua
-- Standard Editor Free Camera.
-- Uses core's mouse_look and first_person_move components.
-- Reactive: Updates speed and sensitivity on-the-fly.
-- ═══════════════════════════════════════════════════════════════════════

---@class FreeCamProps
---@field moveSpeed? number Movement speed (units per second).
---@field lookSensitivity? number Mouse look sensitivity.

---@type ViewportModule<FreeCamProps, {}>
return {
    schema = {
        name = "Free Camera",
        description = "Standard Editor Camera. WASD to move, Right-Click + Mouse to look.",
        properties = {
            moveSpeed = { type = "number", default = 5.0, description = "Movement speed multiplier." },
            lookSensitivity = { type = "number", default = 0.002, description = "Mouse sensitivity." }
        }
    },

    ---@param self ViewportScriptInstance<FreeCamProps, {}>
    init = function(self, ctx)
        log:info("Viewport", "Initializing Free Camera for " .. self.viewport.id)

        local vp = self.viewport
        -- Spawn and register as "camera"
        local cam = vp:spawnEntity("EditorFreeCam", "camera")

        cam:addComponent("cameraView")

        cam:addComponent("firstPersonMove", {
            moveSpeed = self.properties.moveSpeed,
            flyMode = true
        })

        cam:addComponent("mouseLook", {
            sensitivityX = self.properties.lookSensitivity,
            sensitivityY = self.properties.lookSensitivity
        })

        vp.cameraEntityId = cam.id
    end,

    ---Reactive Property Updates
    ---@param self ViewportScriptInstance<FreeCamProps, {}>
    ---@param props FreeCamProps
    ---@param prevProps FreeCamProps
    onPropertyChanged = function(self, props, prevProps, ctx)
        local cam = self.entities.camera
        if not cam or not cam:isValid() then return end

        if props.moveSpeed ~= prevProps.moveSpeed then
            local move = cam:getComponent("firstPersonMove")
            if move then move.moveSpeed = props.moveSpeed end
        end

        if props.lookSensitivity ~= prevProps.lookSensitivity then
            local look = cam:getComponent("mouseLook")
            if look then
                look.sensitivityX = props.lookSensitivity
                look.sensitivityY = props.lookSensitivity
            end
        end
    end,

    onDestroy = function(self, ctx)
        log:info("Viewport", "Free Camera destroyed for " .. self.viewport.id)
    end
}
