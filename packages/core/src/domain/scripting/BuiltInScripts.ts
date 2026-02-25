// Auto-generated file. Do not edit directly.
// Run 'npm run build:scripts' or similar to regenerate.

export const BuiltInScripts: Record<string, string> = {
    "builtin://first_person_move.lua": `---@type ScriptModule
return {
    schema = {
        name = "First Person Move (Kinematic)",
        description =
        "Handles unhindered WASD movement and flying without relying on the physics engine. Useful for standard ghosts, editors, and spectator cameras.",
        properties = {
            moveSpeed = { type = "number", default = 5, description = "Base walking speed." },
            sprintMultiplier = { type = "number", default = 2, description = "Speed multiplier when holding Shift." },
            flyMode = { type = "boolean", default = false, description = "If true, Space/Ctrl will move the entity up and down freely on the global Y axis." }
        }
    },

    update = function(self, dt)
        local keyboard = input

        local forwardKey = keyboard.isKeyPressed("w")
        local backKey = keyboard.isKeyPressed("s")
        local leftKey = keyboard.isKeyPressed("a")
        local rightKey = keyboard.isKeyPressed("d")
        local upKey = keyboard.isKeyPressed("space")
        local downKey = keyboard.isKeyPressed("control")
        local shift = keyboard.isKeyPressed("shift")

        local mv = { x = 0, y = 0, z = 0 }
        if forwardKey then mv.z = mv.z + 1 end
        if backKey then mv.z = mv.z - 1 end
        if leftKey then mv.x = mv.x - 1 end
        if rightKey then mv.x = mv.x + 1 end

        local props = self.properties or {}
        local moveSpeed = props.moveSpeed or 5
        local sprintMultiplier = props.sprintMultiplier or 2
        local flyMode = props.flyMode or false

        local secs = dt / 1000
        local speed = moveSpeed * (shift and sprintMultiplier or 1)

        if flyMode then
            if upKey then mv.y = mv.y + 1 end
            if downKey then mv.y = mv.y - 1 end
        end

        local len = math.sqrt(mv.x * mv.x + mv.y * mv.y + mv.z * mv.z)
        if len <= 0 then return end
        mv.x = mv.x / len
        mv.y = mv.y / len
        mv.z = mv.z / len

        local forward = self:getForward()
        local right = self:getRight()
        local worldUp = { x = 0, y = 1, z = 0 }

        if not flyMode then
            forward.y = 0
            local flen = math.sqrt(forward.x * forward.x + forward.z * forward.z)
            if flen == 0 then flen = 1 end
            forward.x = forward.x / flen
            forward.z = forward.z / flen
        end

        local moveWorld = {
            x = forward.x * mv.z + right.x * mv.x + (flyMode and worldUp.x * mv.y or 0),
            y = forward.y * mv.z + right.y * mv.x + (flyMode and worldUp.y * mv.y or 0),
            z = forward.z * mv.z + right.z * mv.x + (flyMode and worldUp.z * mv.y or 0)
        }

        local mlen = math.sqrt(moveWorld.x * moveWorld.x + moveWorld.y * moveWorld.y + moveWorld.z * moveWorld.z)
        if mlen == 0 then mlen = 1 end
        moveWorld.x = moveWorld.x / mlen
        moveWorld.y = moveWorld.y / mlen
        moveWorld.z = moveWorld.z / mlen

        local delta = {
            x = moveWorld.x * speed * secs,
            y = moveWorld.y * speed * secs,
            z = moveWorld.z * speed * secs
        }

        local cur = self:getPosition()
        if not cur then return end

        self:setPosition(cur.x + delta.x, cur.y + delta.y, cur.z + delta.z)
    end
}
`,
    "builtin://first_person_physics_move.lua": `local function clampMagnitude(v, maxLen)
    local len = math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
    if len <= 0 then return { x = 0, y = 0, z = 0 } end
    if len <= maxLen then return v end
    local s = maxLen / len
    return { x = v.x * s, y = v.y * s, z = v.z * s }
end

---@type ScriptModule
return {
    schema = {
        name = "First Person Physics Move",
        description =
        "Handles WASD movement strictly via the physics engine, requiring a Collider and RigidBody. It manipulates linear velocity and applies forces rather than teleporting position.",
        properties = {
            moveSpeed = { type = "number", default = 6, description = "Target linear velocity speed." },
            sprintMultiplier = { type = "number", default = 1.75, description = "Speed multiplier when holding Shift." },
            maxAcceleration = { type = "number", default = 30, description = "Maximum impulse to reach target speed." },
            brakeDeceleration = { type = "number", default = 40, description = "How fast the entity stops when no keys are pressed." },
            flyMode = { type = "boolean", default = false, description = "If true, Space/Ctrl controls Y velocity and physics gravity should be disabled." }
        }
    },

    update = function(self, dt)
        local keyboard = input

        local forwardKey = keyboard.isKeyPressed("w")
        local backKey = keyboard.isKeyPressed("s")
        local leftKey = keyboard.isKeyPressed("a")
        local rightKey = keyboard.isKeyPressed("d")
        local upKey = keyboard.isKeyPressed("space")
        local downKey = keyboard.isKeyPressed("control")
        local shift = keyboard.isKeyPressed("shift")

        local mv = { x = 0, y = 0, z = 0 }
        if forwardKey then mv.z = mv.z + 1 end
        if backKey then mv.z = mv.z - 1 end
        if leftKey then mv.x = mv.x - 1 end
        if rightKey then mv.x = mv.x + 1 end

        local props = self.properties or {}
        local moveSpeed = props.moveSpeed or 6
        local sprintMultiplier = props.sprintMultiplier or 1.75
        local maxAcceleration = math.max(0, props.maxAcceleration or 30)
        local brakeDeceleration = math.max(0, props.brakeDeceleration or 40)
        local flyMode = props.flyMode or false

        if flyMode then
            if upKey then mv.y = mv.y + 1 end
            if downKey then mv.y = mv.y - 1 end
        end

        local secs = math.max(0, dt) / 1000
        if secs <= 0 then return end

        local speed = moveSpeed * (shift and sprintMultiplier or 1)

        local forward = self:getForward()
        local right = self:getRight()
        local worldUp = { x = 0, y = 1, z = 0 }

        if not flyMode then
            forward.y = 0
            local flen = math.sqrt(forward.x * forward.x + forward.z * forward.z)
            if flen == 0 then flen = 1 end
            forward.x = forward.x / flen
            forward.z = forward.z / flen
        end

        local moveWorld = {
            x = forward.x * mv.z + right.x * mv.x + (flyMode and worldUp.x * mv.y or 0),
            y = forward.y * mv.z + right.y * mv.x + (flyMode and worldUp.y * mv.y or 0),
            z = forward.z * mv.z + right.z * mv.x + (flyMode and worldUp.z * mv.y or 0),
        }

        local mlen = math.sqrt(moveWorld.x * moveWorld.x + moveWorld.y * moveWorld.y + moveWorld.z * moveWorld.z)
        local curVel = self:getLinearVelocity() or { x = 0, y = 0, z = 0 }

        if mlen > 1e-6 then
            moveWorld.x = moveWorld.x / mlen
            moveWorld.y = moveWorld.y / mlen
            moveWorld.z = moveWorld.z / mlen

            local desiredVel = {
                x = moveWorld.x * speed,
                y = flyMode and (moveWorld.y * speed) or curVel.y,
                z = moveWorld.z * speed,
            }

            local velErr = {
                x = desiredVel.x - curVel.x,
                y = flyMode and (desiredVel.y - curVel.y) or 0,
                z = desiredVel.z - curVel.z,
            }

            local maxDeltaV = maxAcceleration * secs
            local deltaV = clampMagnitude(velErr, maxDeltaV)
            self:applyImpulse(deltaV.x, deltaV.y, deltaV.z)
            return
        end

        -- Brake
        local brakeTarget = {
            x = -curVel.x,
            y = flyMode and -curVel.y or 0,
            z = -curVel.z,
        }
        local maxBrakeDeltaV = brakeDeceleration * secs
        local brakeDeltaV = clampMagnitude(brakeTarget, maxBrakeDeltaV)
        self:applyImpulse(brakeDeltaV.x, brakeDeltaV.y, brakeDeltaV.z)
    end
}
`,
    "builtin://look_at_entity.lua": `---@type ScriptModule
return {
    schema = {
        name = "Look at Entity",
        description =
        "Continuously rotates the entity to face another target entity in the scene, optionally interpolating position if following is configured.",
        properties = {
            targetEntityId = { type = "entity", default = "", description = "The ID of the target entity to look at." },
            followSpeed = { type = "number", default = 0, description = "If > 0, the entity will smoothly lerp towards the target plus the offset." },
            offset = { type = "vec3", default = { 0, 0, 0 }, description = "The positional offset [x, y, z] to maintain relative to the target when following." },
            lookAtOffset = { type = "vec3", default = { 0, 0, 0 }, description = "The offset [x, y, z] applied to the target's position when looking at it (e.g., looking at their head instead of their feet)." }
        }
    },

    init = function(self)
        local props = self.properties or {}
        self.state.target = scene.getEntity(props.targetEntityId)
    end,

    onPropertyChanged = function(self, key, value)
        if key == "targetEntityId" then
            self.state.target = scene.getEntity(value)
        end
    end,

    update = function(self, dt)
        local target = self.state.target
        if not target then return end

        local props = self.properties or {}
        local followSpeed = props.followSpeed or 0
        local offset = props.offset or { 0, 0, 0 }
        local lookAtOffset = props.lookAtOffset or { 0, 0, 0 }

        local tp = target:getPosition()
        if not tp then return end

        local targetPoint = {
            x = tp.x + lookAtOffset[1],
            y = tp.y + lookAtOffset[2],
            z = tp.z + lookAtOffset[3]
        }

        -- Rotational logic
        self:lookAt(targetPoint.x, targetPoint.y, targetPoint.z)

        -- Positional following logic
        if followSpeed > 0 then
            local desired = {
                x = tp.x + offset[1],
                y = tp.y + offset[2],
                z = tp.z + offset[3]
            }
            local cur = self:getPosition()
            if not cur then return end

            local secs = dt / 1000
            local t = math.min(1, followSpeed * secs)

            self:setPosition(
                cur.x + (desired.x - cur.x) * t,
                cur.y + (desired.y - cur.y) * t,
                cur.z + (desired.z - cur.z) * t
            )
        end
    end
}
`,
    "builtin://look_at_point.lua": `---@type ScriptModule
return {
    schema = {
        name = "Look at Point",
        description =
        "Continuously rotates the entity so that its forward vector points towards a specific static 3D coordinate.",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 }, description = "The [x, y, z] world coordinate array to look at." }
        }
    },

    update = function(self, dt)
        local props = self.properties or {}
        local targetPoint = props.targetPoint
        if not targetPoint then return end

        self:lookAt(targetPoint[1], targetPoint[2], targetPoint[3])
    end
}
`,
    "builtin://mouse_look.lua": `---@type ScriptModule
return {
    schema = {
        name = "Mouse Look",
        description =
        "Handles mouse pointer lock and freely rotates the entity based on mouse delta vectors (typical First-Person Camera behavior).",
        properties = {
            sensitivityX = { type = "number", default = 0.002, description = "Horizontal mouse sensitivity." },
            sensitivityY = { type = "number", default = 0.002, description = "Vertical mouse sensitivity." },
            invertY = { type = "boolean", default = false, description = "Invert vertical look axis." }
        }
    },

    update = function(self, dt)
        input.requestPointerLock()

        local md = input.getMouseDelta()
        if md.x == 0 and md.y == 0 then return end

        local props = self.properties or {}
        local sensitivityX = props.sensitivityX or 0.002
        local sensitivityY = props.sensitivityY or 0.002
        local invertY = props.invertY or false

        if not self.state.yaw then self.state.yaw = 0 end
        if not self.state.pitch then self.state.pitch = 0 end

        self.state.yaw = self.state.yaw - (md.x * sensitivityX)
        local inv = invertY and 1 or -1
        self.state.pitch = self.state.pitch + (inv * md.y * sensitivityY)

        local limit = (math.pi / 2) - 0.01
        if self.state.pitch > limit then self.state.pitch = limit end
        if self.state.pitch < -limit then self.state.pitch = -limit end

        self:setRotation(self.state.pitch, self.state.yaw, 0)
    end
}
`,
    "builtin://orbit_camera.lua": `---@type ScriptModule
return {
    schema = {
        name = "Orbit Camera",
        description = "Rotates the entity in a continuous circular orbit around a target entity.",
        properties = {
            targetEntityId = { type = "entity", default = "", description = "The ID of the central entity to orbit around." },
            altitudeFromSurface = { type = "number", default = 0, description = "Distance buffer from the target's center." },
            speed = { type = "number", default = 0.5, description = "Speed of the circular orbit (radians per second)." },
            orbitPlane = { type = "string", default = "xz", description = "The 2D plane to orbit on: 'xz' (default), 'xy', or 'yz'." },
            initialAngle = { type = "number", default = 0, description = "Starting angle in radians." }
        }
    },

    init = function(self)
        local props = self.properties or {}
        self.state.target = scene.getEntity(props.targetEntityId)
        if not self.state.angle then
            self.state.angle = props.initialAngle or 0
        end
    end,

    onPropertyChanged = function(self, key, value)
        if key == "targetEntityId" then
            self.state.target = scene.getEntity(value)
        end
    end,

    update = function(self, dt)
        local target = self.state.target
        if not target then return end

        local props = self.properties or {}
        local altitudeFromSurface = props.altitudeFromSurface or 0
        local speed = props.speed or 0.5
        local orbitPlane = props.orbitPlane or "xz"

        -- Default target radius to 1 unit until geometry radii are fully bridged
        local targetRadius = 1
        local orbitDistance = targetRadius + altitudeFromSurface

        local secs = dt / 1000
        self.state.angle = self.state.angle + (speed * secs)

        local a = self.state.angle
        local tp = target:getPosition()
        if not tp then return end

        local x, y, z = tp.x, tp.y, tp.z

        if orbitPlane == "xz" then
            x = tp.x + math.cos(a) * orbitDistance
            z = tp.z + math.sin(a) * orbitDistance
        elseif orbitPlane == "xy" then
            x = tp.x + math.cos(a) * orbitDistance
            y = tp.y + math.sin(a) * orbitDistance
        elseif orbitPlane == "yz" then
            y = tp.y + math.cos(a) * orbitDistance
            z = tp.z + math.sin(a) * orbitDistance
        end

        self:setPosition(x, y, z)
    end
}
`,
};
