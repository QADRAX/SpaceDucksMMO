// Auto-generated file. Do not edit directly.
// Run 'npm run build:scripts' or similar to regenerate.

export const BuiltInScripts: Record<string, string> = {
    "builtin://first_person_move.lua": `-- =======================================================================
-- first_person_move.lua
-- Kinematic WASD movement for spectator cameras, ghosts, and editors.
-- Does NOT require a physics rigid body — directly sets entity position.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "First Person Move (Kinematic)",
        description = "WASD movement and optional flying. Moves the entity directly without physics.",
        properties = {
            moveSpeed        = { type = "number", default = 5, description = "Base walking speed (units per second)." },
            sprintMultiplier = { type = "number", default = 2, description = "Speed multiplier when holding Shift." },
            flyMode          = { type = "boolean", default = false, description = "If true, Space/Ctrl move vertically." }
        }
    },

    update = function(self, dt)
        -- 1. Read input
        local w     = input.isKeyPressed("w")
        local s     = input.isKeyPressed("s")
        local a     = input.isKeyPressed("a")
        local d     = input.isKeyPressed("d")
        local up    = input.isKeyPressed("space")
        local down  = input.isKeyPressed("control")
        local shift = input.isKeyPressed("shift")

        -- 2. Build local-space movement vector
        local mv    = { x = 0, y = 0, z = 0 }
        if w then mv.z = mv.z + 1 end
        if s then mv.z = mv.z - 1 end
        if a then mv.x = mv.x - 1 end
        if d then mv.x = mv.x + 1 end

        local props            = self.properties or {}
        local moveSpeed        = props.moveSpeed or 5
        local sprintMultiplier = props.sprintMultiplier or 2
        local flyMode          = props.flyMode or false

        if flyMode then
            if up then mv.y = mv.y + 1 end
            if down then mv.y = mv.y - 1 end
        end

        -- 3. Normalize to prevent faster diagonal movement
        local len = math.sqrt(mv.x * mv.x + mv.y * mv.y + mv.z * mv.z)
        if len <= 0 then return end
        mv.x          = mv.x / len
        mv.y          = mv.y / len
        mv.z          = mv.z / len

        -- 4. Transform to world space using entity orientation
        local forward = self:getForward()
        local right   = self:getRight()

        if not flyMode then
            -- Flatten forward onto XZ plane so vertical look doesn't affect speed
            forward.y = 0
            local flen = math.sqrt(forward.x * forward.x + forward.z * forward.z)
            if flen == 0 then flen = 1 end
            forward.x = forward.x / flen
            forward.z = forward.z / flen
        end

        local worldMove = {
            x = forward.x * mv.z + right.x * mv.x + (flyMode and mv.y or 0) * 0,
            y = forward.y * mv.z + right.y * mv.x + (flyMode and mv.y or 0),
            z = forward.z * mv.z + right.z * mv.x + (flyMode and mv.y or 0) * 0
        }

        -- Re-normalize after world transform
        local mlen = math.sqrt(worldMove.x * worldMove.x + worldMove.y * worldMove.y + worldMove.z * worldMove.z)
        if mlen == 0 then return end
        worldMove.x = worldMove.x / mlen
        worldMove.y = worldMove.y / mlen
        worldMove.z = worldMove.z / mlen

        -- 5. Apply movement
        local secs  = dt / 1000
        local speed = moveSpeed * (shift and sprintMultiplier or 1)
        local cur   = self:getPosition()

        self:setPosition(
            cur.x + worldMove.x * speed * secs,
            cur.y + worldMove.y * speed * secs,
            cur.z + worldMove.z * speed * secs
        )
    end
}
`,
    "builtin://first_person_physics_move.lua": `-- =======================================================================
-- first_person_physics_move.lua
-- Physics-based WASD movement. Requires a RigidBody + Collider.
-- Uses impulses to reach target velocity, ensuring proper collisions.
-- =======================================================================

---Clamps a velocity vector's magnitude.
---@param v Vec3
---@param maxLen number
---@return Vec3
local function clampMagnitude(v, maxLen)
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
        description = "WASD physics movement via impulses. Requires rigidBody + collider.",
        properties = {
            moveSpeed         = { type = "number", default = 6, description = "Target linear velocity (units/s)." },
            sprintMultiplier  = { type = "number", default = 1.75, description = "Speed multiplier when holding Shift." },
            maxAcceleration   = { type = "number", default = 30, description = "Max acceleration impulse per frame." },
            brakeDeceleration = { type = "number", default = 40, description = "Deceleration when no input." },
            flyMode           = { type = "boolean", default = false, description = "If true, Space/Ctrl controls Y velocity." }
        }
    },

    update = function(self, dt)
        -- 1. Read input
        local w     = input.isKeyPressed("w")
        local s     = input.isKeyPressed("s")
        local a     = input.isKeyPressed("a")
        local d     = input.isKeyPressed("d")
        local up    = input.isKeyPressed("space")
        local down  = input.isKeyPressed("control")
        local shift = input.isKeyPressed("shift")

        local mv    = { x = 0, y = 0, z = 0 }
        if w then mv.z = mv.z + 1 end
        if s then mv.z = mv.z - 1 end
        if a then mv.x = mv.x - 1 end
        if d then mv.x = mv.x + 1 end

        local props             = self.properties or {}
        local moveSpeed         = props.moveSpeed or 6
        local sprintMultiplier  = props.sprintMultiplier or 1.75
        local maxAcceleration   = math.max(0, props.maxAcceleration or 30)
        local brakeDeceleration = math.max(0, props.brakeDeceleration or 40)
        local flyMode           = props.flyMode or false

        if flyMode then
            if up then mv.y = mv.y + 1 end
            if down then mv.y = mv.y - 1 end
        end

        local secs = math.max(0, dt) / 1000
        if secs <= 0 then return end

        local speed   = moveSpeed * (shift and sprintMultiplier or 1)
        local forward = self:getForward()
        local right   = self:getRight()

        -- Flatten forward for grounded movement
        if not flyMode then
            forward.y = 0
            local flen = math.sqrt(forward.x * forward.x + forward.z * forward.z)
            if flen == 0 then flen = 1 end
            forward.x = forward.x / flen
            forward.z = forward.z / flen
        end

        -- 2. Transform local input to world-space direction
        local moveWorld = {
            x = forward.x * mv.z + right.x * mv.x,
            y = forward.y * mv.z + right.y * mv.x + (flyMode and mv.y or 0),
            z = forward.z * mv.z + right.z * mv.x,
        }

        local mlen      = math.sqrt(moveWorld.x * moveWorld.x + moveWorld.y * moveWorld.y + moveWorld.z * moveWorld.z)
        local curVel    = self:getLinearVelocity() or { x = 0, y = 0, z = 0 }

        -- 3. Accelerate towards desired velocity
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

            local deltaV = clampMagnitude(velErr, maxAcceleration * secs)
            self:applyImpulse(deltaV.x, deltaV.y, deltaV.z)
            return
        end

        -- 4. Brake: no input, slow down
        local brakeTarget = {
            x = -curVel.x,
            y = flyMode and -curVel.y or 0,
            z = -curVel.z,
        }
        local brakeDeltaV = clampMagnitude(brakeTarget, brakeDeceleration * secs)
        self:applyImpulse(brakeDeltaV.x, brakeDeltaV.y, brakeDeltaV.z)
    end
}
`,
    "builtin://follow_entity.lua": `-- =======================================================================
-- follow_entity.lua
-- Kinematic follow with time-delayed position buffering.
-- The entity trails behind the target by a configurable delay, creating
-- a smooth "camera lag" effect commonly used for chase cameras.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "Follow Entity (Kinematic)",
        description = "Follows a target entity with smoothing and optional time delay.",
        requires = { "targetEntityId" },
        properties = {
            targetEntityId = { type = "entity", default = "", description = "Target entity to follow." },
            delay          = { type = "number", default = 0.5, description = "How far behind (seconds) to trail the target." },
            speed          = { type = "number", default = 5, description = "Smoothing speed for position interpolation." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from the target." }
        }
    },

    init = function(self)
        -- History ring buffer of { t = timestamp, x, y, z }
        self.state.history = {}
    end,

    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.requires
        local target = self.targetEntityId

        local props  = self.properties or {}
        local delay  = props.delay or 0
        local speed  = props.speed or 5
        local offset = props.offset or { 0, 0, 0 }

        -- 1. Record current target position with timestamp
        local tp     = target:getPosition()
        local now    = time.now()
        table.insert(self.state.history, { t = now, x = tp.x, y = tp.y, z = tp.z })

        -- 2. Evict stale entries (keep only entries within the delay window)
        while #self.state.history > 1 and (now - self.state.history[2].t) > delay do
            table.remove(self.state.history, 1)
        end

        -- 3. Pick the oldest buffered position (= delayed target)
        local targetPos = { x = tp.x, y = tp.y, z = tp.z }
        if delay > 0 and #self.state.history > 0 then
            targetPos = self.state.history[1]
        end

        -- 4. Smoothly interpolate towards delayed target + offset
        local desired = {
            x = targetPos.x + offset[1],
            y = targetPos.y + offset[2],
            z = targetPos.z + offset[3]
        }

        local cur     = self:getPosition()
        local t       = math.min(1, speed * (dt / 1000))

        self:setPosition(
            math.ext.lerp(cur.x, desired.x, t),
            math.ext.lerp(cur.y, desired.y, t),
            math.ext.lerp(cur.z, desired.z, t)
        )
    end
}
`,
    "builtin://follow_entity_physics.lua": `-- =======================================================================
-- follow_entity_physics.lua
-- Physics-based entity following using proportional impulses.
-- Requires a RigidBody. The entity accelerates towards the target
-- instead of teleporting, making it interact with obstacles naturally.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "Follow Entity (Physics)",
        description = "Follows a target entity via physics impulses. Requires rigidBody.",
        requires = { "targetEntityId" },
        properties = {
            targetEntityId = { type = "entity", default = "", description = "Target entity to follow." },
            strength       = { type = "number", default = 10, description = "Force multiplier for the attraction." },
            damping        = { type = "number", default = 0.9, description = "Velocity damping factor (0..1). Lower = more damping." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from the target." }
        }
    },

    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.requires
        local target   = self.targetEntityId

        local props    = self.properties or {}
        local strength = props.strength or 10
        local offset   = props.offset or { 0, 0, 0 }

        -- 1. Calculate desired world position
        local tp       = target:getPosition()
        local desired  = {
            x = tp.x + offset[1],
            y = tp.y + offset[2],
            z = tp.z + offset[3]
        }

        -- 2. Get direction and distance to desired position
        local cur      = self:getPosition()
        local dir      = {
            x = desired.x - cur.x,
            y = desired.y - cur.y,
            z = desired.z - cur.z
        }

        -- 3. Apply proportional impulse (P-controller)
        local secs     = dt / 1000
        self:applyImpulse(
            dir.x * strength * secs,
            dir.y * strength * secs,
            dir.z * strength * secs
        )
    end
}
`,
    "builtin://look_at_entity.lua": `-- =======================================================================
-- look_at_entity.lua
-- Smoothly rotates the entity to face a target entity.
-- Only affects rotation — does NOT move the entity.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "Look at Entity",
        description = "Smoothly rotates this entity to face a target entity. Rotation only.",
        requires = { "targetEntityId" },
        properties = {
            targetEntityId = { type = "entity", default = "", description = "Target entity to look at." },
            speed          = { type = "number", default = 5, description = "Rotation smoothing speed." },
            lookAtOffset   = { type = "vec3", default = { 0, 0, 0 }, description = "World-space offset applied to the target position." }
        }
    },

    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.requires
        local target = self.targetEntityId

        local tp     = target:getPosition()
        local props  = self.properties or {}
        local offset = props.lookAtOffset or { 0, 0, 0 }

        self:lookAt(
            tp.x + offset[1],
            tp.y + offset[2],
            tp.z + offset[3]
        )
    end
}
`,
    "builtin://look_at_point.lua": `-- =======================================================================
-- look_at_point.lua
-- Continuously rotates the entity to face a fixed world-space coordinate.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "Look at Point",
        description = "Continuously rotates this entity to face a static 3D world coordinate.",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 }, description = "World [x, y, z] coordinate to look at." }
        }
    },

    update = function(self, dt)
        local props       = self.properties or {}
        local targetPoint = props.targetPoint
        if not targetPoint then return end

        self:lookAt(targetPoint[1], targetPoint[2], targetPoint[3])
    end
}
`,
    "builtin://mouse_look.lua": `-- =======================================================================
-- mouse_look.lua
-- First-person mouse look with pointer lock. Controls entity rotation
-- via yaw (horizontal) and pitch (vertical) stored in state.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "Mouse Look",
        description = "First-person camera rotation via pointer lock and mouse delta.",
        properties = {
            sensitivityX = { type = "number", default = 0.002, description = "Horizontal mouse sensitivity." },
            sensitivityY = { type = "number", default = 0.002, description = "Vertical mouse sensitivity." },
            invertY      = { type = "boolean", default = false, description = "Invert vertical look axis." }
        }
    },

    update = function(self, dt)
        -- Request pointer lock so the cursor is hidden and deltas are infinite
        input.requestPointerLock()

        local md = input.getMouseDelta()
        if md.x == 0 and md.y == 0 then return end

        local props        = self.properties or {}
        local sensitivityX = props.sensitivityX or 0.002
        local sensitivityY = props.sensitivityY or 0.002
        local invertY      = props.invertY or false

        -- Initialize accumulated angles on first frame
        if not self.state.yaw then self.state.yaw = 0 end
        if not self.state.pitch then self.state.pitch = 0 end

        -- Accumulate rotation
        self.state.yaw   = self.state.yaw - (md.x * sensitivityX)
        self.state.pitch = self.state.pitch + ((invertY and 1 or -1) * md.y * sensitivityY)

        -- Clamp pitch to prevent flipping
        local limit      = (math.pi / 2) - 0.01
        self.state.pitch = math.ext.clamp(self.state.pitch, -limit, limit)

        self:setRotation(self.state.pitch, self.state.yaw, 0)
    end
}
`,
    "builtin://move_to_point.lua": `-- =======================================================================
-- move_to_point.lua
-- Moves the entity from its current position to a target point over
-- a configurable duration, using an easing curve. Once arrived, stops.
-- Can be restarted by changing the target point property.
-- Useful for cutscene waypoints, elevators, and animated platforms.
-- =======================================================================

---Selects an easing function by name, falling back to smoothstep.
---@param name string
---@return fun(t: number): number
local function getEasing(name)
    local fn = math.ext.easing[name]
    if fn then return fn end
    return math.ext.easing.smoothstep
end

---@type ScriptModule
return {
    schema = {
        name = "Move to Point (Eased)",
        description = "Moves the entity to a target point over time using an easing curve.",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 }, description = "Destination world coordinate." },
            duration    = { type = "number", default = 2.0, description = "Travel time in seconds." },
            easing      = { type = "string", default = "cubicInOut", description = "Easing curve: cubicInOut, bounceOut, sineInOut, etc." },
            delay       = { type = "number", default = 0, description = "Delay in seconds before starting movement." }
        }
    },

    init = function(self)
        self.state.startPos = self:getPosition()
        self.state.elapsed  = 0
        self.state.started  = false
    end,

    ---Restart the animation when the target point changes.
    onPropertyChanged = function(self, key, value)
        if key == "targetPoint" then
            self.state.startPos = self:getPosition()
            self.state.elapsed  = 0
            self.state.started  = false
        end
    end,

    update = function(self, dt)
        local props  = self.properties or {}
        local target = props.targetPoint
        if not target then return end

        local duration     = math.max(0.01, props.duration or 2.0)
        local delay        = math.max(0, props.delay or 0)
        local ease         = getEasing(props.easing or "cubicInOut")

        local secs         = dt / 1000
        self.state.elapsed = self.state.elapsed + secs

        -- Wait through the delay period
        if self.state.elapsed < delay then return end

        -- Calculate progress within the active movement window
        local active = self.state.elapsed - delay
        local raw    = math.ext.clamp(active / duration, 0, 1)
        local t      = ease(raw)

        -- Interpolate from starting position to target
        local sp     = self.state.startPos
        self:setPosition(
            math.ext.lerp(sp.x, target[1], t),
            math.ext.lerp(sp.y, target[2], t),
            math.ext.lerp(sp.z, target[3], t)
        )
    end
}
`,
    "builtin://orbit_camera.lua": `-- =======================================================================
-- orbit_camera.lua
-- Orbits the entity around a target entity on a configurable plane.
-- =======================================================================

---@type ScriptModule
return {
    schema = {
        name = "Orbit Camera",
        description = "Orbits this entity around a target at a fixed distance and speed.",
        requires = { "targetEntityId" },
        properties = {
            targetEntityId      = { type = "entity", default = "", description = "Central entity to orbit around." },
            altitudeFromSurface = { type = "number", default = 0, description = "Distance buffer from the target's center." },
            speed               = { type = "number", default = 0.5, description = "Orbit speed (radians per second)." },
            orbitPlane          = { type = "string", default = "xz", description = "Orbit plane: 'xz', 'xy', or 'yz'." },
            initialAngle        = { type = "number", default = 0, description = "Starting angle in radians." }
        }
    },

    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.requires
        local target              = self.targetEntityId

        local props               = self.properties or {}
        local altitudeFromSurface = props.altitudeFromSurface or 0
        local speed               = props.speed or 0.5
        local orbitPlane          = props.orbitPlane or "xz"

        -- Initialize angle from property on first frame
        if not self.state.angle then
            self.state.angle = props.initialAngle or 0
        end

        local orbitDistance = 1 + altitudeFromSurface
        local secs          = dt / 1000
        self.state.angle    = self.state.angle + (speed * secs)

        local a             = self.state.angle
        local tp            = target:getPosition()
        if not tp then return end

        local x, y, z = tp.x, tp.y, tp.z

        -- Calculate orbital position on the chosen plane
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
    "builtin://smooth_follow.lua": `-- =======================================================================
-- smooth_follow.lua
-- Eased follow with configurable curve and arrival behavior.
-- Uses easing functions for smooth acceleration/deceleration as the
-- entity approaches or leaves its target. Great for cinematic cameras.
-- =======================================================================

---Selects an easing function by name, falling back to smoothstep.
---@param name string
---@return fun(t: number): number
local function getEasing(name)
    local fn = math.ext.easing[name]
    if fn then return fn end
    return math.ext.easing.smoothstep
end

---@type ScriptModule
return {
    schema = {
        name = "Smooth Follow (Eased)",
        description = "Follows a target using configurable easing curves for cinematic motion.",
        requires = { "targetEntityId" },
        properties = {
            targetEntityId = { type = "entity", default = "", description = "Target entity to follow." },
            duration       = { type = "number", default = 1.0, description = "Time in seconds to reach the target." },
            easing         = { type = "string", default = "quadOut", description = "Easing function: linear, quadOut, cubicInOut, bounceOut, smoothstep, etc." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from target." }
        }
    },

    init = function(self)
        self.state.startPos = nil -- captured when target moves
        self.state.elapsed  = 0
        self.state.lastGoal = nil
    end,

    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.requires
        local target   = self.targetEntityId

        local props    = self.properties or {}
        local duration = math.max(0.01, props.duration or 1.0)
        local ease     = getEasing(props.easing or "quadOut")
        local offset   = props.offset or { 0, 0, 0 }

        -- Calculate goal position (target + offset)
        local tp       = target:getPosition()
        local goal     = {
            x = tp.x + offset[1],
            y = tp.y + offset[2],
            z = tp.z + offset[3]
        }

        -- Detect if goal changed significantly → restart easing
        local last     = self.state.lastGoal
        if not last or not self.state.startPos then
            self.state.startPos = self:getPosition()
            self.state.elapsed  = 0
            self.state.lastGoal = goal
        else
            local dx = goal.x - last.x
            local dy = goal.y - last.y
            local dz = goal.z - last.z
            local dist = math.sqrt(dx * dx + dy * dy + dz * dz)
            if dist > 0.01 then
                -- Target moved — restart easing from current pos
                self.state.startPos = self:getPosition()
                self.state.elapsed  = 0
                self.state.lastGoal = goal
            end
        end

        -- Advance the easing timer
        local secs         = dt / 1000
        self.state.elapsed = self.state.elapsed + secs

        -- Calculate normalized time (0..1) and apply easing curve
        local raw          = math.ext.clamp(self.state.elapsed / duration, 0, 1)
        local t            = ease(raw)

        -- Interpolate from start position to goal using the eased \`t\`
        local sp           = self.state.startPos
        self:setPosition(
            math.ext.lerp(sp.x, goal.x, t),
            math.ext.lerp(sp.y, goal.y, t),
            math.ext.lerp(sp.z, goal.z, t)
        )
    end
}
`,
    "builtin://smooth_look_at.lua": `-- =======================================================================
-- smooth_look_at.lua
-- Eased rotation towards a target entity. Instead of snapping instantly,
-- the entity smoothly rotates over a configurable duration using an
-- easing curve. Useful for turrets, cinematic cameras, and NPCs.
-- =======================================================================

---Selects an easing function by name, falling back to smoothstep.
---@param name string
---@return fun(t: number): number
local function getEasing(name)
    local fn = math.ext.easing[name]
    if fn then return fn end
    return math.ext.easing.smoothstep
end

---Interpolates between two Euler rotation values, handling wrap-around.
---@param a number
---@param b number
---@param t number
---@return number
local function lerpAngle(a, b, t)
    local diff = b - a
    -- Normalize to -pi..pi
    while diff > math.pi do diff = diff - 2 * math.pi end
    while diff < -math.pi do diff = diff + 2 * math.pi end
    return a + diff * t
end

---@type ScriptModule
return {
    schema = {
        name = "Smooth Look At",
        description = "Smoothly rotates to face a target using easing curves.",
        requires = { "targetEntityId" },
        properties = {
            targetEntityId = { type = "entity", default = "", description = "Target entity to look at." },
            speed          = { type = "number", default = 3, description = "Rotation speed (higher = faster convergence)." },
            easing         = { type = "string", default = "sineOut", description = "Easing function: sineOut, quadOut, cubicInOut, etc." },
            offset         = { type = "vec3", default = { 0, 0, 0 }, description = "Offset applied to target position." }
        }
    },

    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.requires
        local target         = self.targetEntityId

        local props          = self.properties or {}
        local speed          = props.speed or 3
        local ease           = getEasing(props.easing or "sineOut")
        local offset         = props.offset or { 0, 0, 0 }

        local tp             = target:getPosition()
        local cur            = self:getPosition()

        -- Direction from self to target+offset
        local dx             = (tp.x + offset[1]) - cur.x
        local dy             = (tp.y + offset[2]) - cur.y
        local dz             = (tp.z + offset[3]) - cur.z

        -- Calculate desired yaw and pitch from direction
        local desiredYaw     = math.atan(dx, dz)
        local horizontalDist = math.sqrt(dx * dx + dz * dz)
        local desiredPitch   = -math.atan(dy, horizontalDist)

        -- Get current rotation
        local rot            = self:getRotation()

        -- Calculate interpolation factor with easing
        local secs           = dt / 1000
        local raw            = math.ext.clamp(speed * secs, 0, 1)
        local t              = ease(raw)

        -- Smoothly interpolate angles
        local newPitch       = lerpAngle(rot.x, desiredPitch, t)
        local newYaw         = lerpAngle(rot.y, desiredYaw, t)

        self:setRotation(newPitch, newYaw, 0)
    end
}
`,
};
