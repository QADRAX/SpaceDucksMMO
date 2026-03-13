// Auto-generated file. Do not edit directly.
// Run 'npm run build:scripts' to regenerate.

export const BuiltInScripts: Record<string, string> = {
    "builtin://billboard.lua": `-- =======================================================================
-- billboard.lua
-- Makes the entity always face the camera entity.
-- Optionally locks rotation to the Y axis only (cylindrical billboard).
-- =======================================================================

---@type ScriptBlueprint<BillboardProps, {}>
return {
    schema = {
        name = "Billboard",
        description = "Entity always faces the camera. Optionally Y-locked.",
        properties = {
            cameraEntity = { type = "entity", required = true, default = "", description = "The camera entity to face." },
            lockY        = { type = "boolean", default = false, description = "Only rotate around the Y axis." }
        }
    },

    ---@param self ScriptInstance<BillboardProps, {}>
    ---@param dt number
    lateUpdate = function(self, dt)
        local cam = self.properties.cameraEntity
        if not cam or not cam:isValid() then return end

        local myPos  = self:getPosition()
        local camPos = cam:getPosition()

        if self.properties.lockY then
            -- Y-locked: only rotate around Y axis
            local dir = math.vec3(camPos.x - myPos.x, 0, camPos.z - myPos.z)
            if dir:lengthSq() < 1e-8 then return end
            local target = myPos + dir
            self:lookAt(target)
        else
            self:lookAt(camPos)
        end
    end
}
`,
    "builtin://bounce.lua": `-- =======================================================================
-- bounce.lua
-- Sinusoidal hover/bounce on a single axis.
-- Uses time.getElapsed() for smooth, consistent oscillation.
-- =======================================================================

---@class BounceState
---@field origin Vec3?

---@type ScriptBlueprint<BounceProps, BounceState>
return {
    schema = {
        name = "Bounce",
        description = "Oscillates the entity on a single axis using a sine wave.",
        properties = {
            axis      = { type = "string",  default = "y", description = "Axis to bounce on: 'x', 'y', or 'z'." },
            amplitude = { type = "number",  default = 0.5, description = "Maximum displacement in world units." },
            frequency = { type = "number",  default = 1,   description = "Oscillation frequency in Hz." }
        }
    },

    ---@param self ScriptInstance<BounceProps, BounceState>
    init = function(self)
        self.state.origin = self:getPosition():clone()
    end,

    ---@param self ScriptInstance<BounceProps, BounceState>
    ---@param dt number
    update = function(self, dt)
        local props  = self.properties
        local origin = self.state.origin
        if not origin then return end

        local t      = time.getElapsed() / 1000   -- elapsed is in ms; convert to seconds
        local offset = math.sin(t * props.frequency * 2 * math.pi) * props.amplitude

        local pos = origin:clone()
        local axis = props.axis
        if axis == "x" then
            pos.x = pos.x + offset
        elseif axis == "z" then
            pos.z = pos.z + offset
        else
            pos.y = pos.y + offset
        end
        self:setPosition(pos)
    end
}
`,
    "builtin://destroy_after.lua": `-- =======================================================================
-- destroy_after.lua
-- Self-destructs the entity after a configurable lifetime.
-- Uses self:destroy() which calls scene.destroyEntity(self.id).
-- =======================================================================

---@class DestroyAfterState
---@field timer number

---@type ScriptBlueprint<DestroyAfterProps, DestroyAfterState>
return {
    schema = {
        name = "Destroy After",
        description = "Automatically destroys this entity after a given number of seconds.",
        properties = {
            lifetime = { type = "number", default = 5, description = "Seconds until self-destruct." }
        }
    },

    ---@param self ScriptInstance<DestroyAfterProps, DestroyAfterState>
    init = function(self)
        self.state.timer = 0
    end,

    ---@param self ScriptInstance<DestroyAfterProps, DestroyAfterState>
    ---@param dt number
    update = function(self, dt)
        self.state.timer = self.state.timer + dt
        if self.state.timer >= self.properties.lifetime then
            self:destroy()
        end
    end
}
`,
    "builtin://first_person_move.lua": `-- =======================================================================
-- first_person_move.lua
-- Kinematic WASD movement for spectator cameras, ghosts, and editors.
-- Does NOT require a physics rigid body — directly sets entity position.
-- =======================================================================

---@class FirstPersonMoveState
---@field flyModeEnabled boolean

---@type ScriptBlueprint<FirstPersonMoveProps, FirstPersonMoveState>
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

    ---@param self ScriptInstance<FirstPersonMoveProps, FirstPersonMoveState>
    ---@param dt number
    update = function(self, dt)
        -- 1. Read input
        local w       = input.isKeyPressed("w")
        local s       = input.isKeyPressed("s")
        local a       = input.isKeyPressed("a")
        local d       = input.isKeyPressed("d")
        local up      = input.isKeyPressed("space")
        local down    = input.isKeyPressed("leftcontrol") or input.isKeyPressed("c")
        local shift   = input.isKeyPressed("leftshift")

        local flyMode = self.properties.flyMode

        -- 2. Build local movement vector
        local mv      = math.vec3.zero()
        if w then mv.z = -1 end
        if s then mv.z = 1 end
        if a then mv.x = -1 end
        if d then mv.x = 1 end

        if flyMode then
            if up then mv.y = 1 end
            if down then mv.y = -1 end
        end

        -- 3. Normalize to prevent faster diagonal movement
        if mv:length() <= 0 then return end
        mv            = mv:normalize()

        -- 4. Transform to world space using entity orientation
        local forward = self:getForward()
        local right   = self:getRight()

        if not flyMode then
            -- Flatten forward onto XZ plane so vertical look doesn't affect speed
            forward.y = 0
            if forward.x == 0 and forward.z == 0 then forward.z = 1 end
            forward = forward:normalize()

            -- Keep right strictly horizontal as well
            right.y = 0
            right = right:normalize()
        end

        local worldMove = (forward * mv.z) + (right * mv.x)
        if flyMode then
            worldMove.y = worldMove.y + mv.y
        end

        -- Re-normalize after world transform
        if worldMove:length() == 0 then return end
        worldMove   = worldMove:normalize()

        -- 5. Apply movement
        local secs  = dt / 1000
        local speed = self.properties.moveSpeed * (shift and self.properties.sprintMultiplier or 1)
        local cur   = self:getPosition()

        -- Look at how clean this is compared to manually adding x, y, z!
        self:setPosition(cur + (worldMove * speed * secs))
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
    local len = v:length()
    if len <= 0 then return math.vec3.zero() end
    if len <= maxLen then return v:clone() end
    return v * (maxLen / len)
end

---@class FirstPersonPhysicsMoveState
---@field flyModeEnabled boolean

---@type ScriptBlueprint<FirstPersonPhysicsMoveProps, FirstPersonPhysicsMoveState>
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

    ---@param self ScriptInstance<FirstPersonPhysicsMoveProps, FirstPersonPhysicsMoveState>
    ---@param dt number
    update = function(self, dt)
        -- 1. Read input
        local w                 = input.isKeyPressed("w")
        local s                 = input.isKeyPressed("s")
        local a                 = input.isKeyPressed("a")
        local d                 = input.isKeyPressed("d")
        local up                = input.isKeyPressed("space")
        local down              = input.isKeyPressed("leftcontrol") or input.isKeyPressed("c")
        local shift             = input.isKeyPressed("leftshift")

        local flyMode           = self.properties.flyMode
        local moveSpeed         = self.properties.moveSpeed
        local sprintMultiplier  = self.properties.sprintMultiplier
        local maxAcceleration   = self.properties.maxAcceleration
        local brakeDeceleration = self.properties.brakeDeceleration

        -- 2. Build local-space movement vector
        local mv                = math.vec3.zero()
        if w then mv.z = -1 end
        if s then mv.z = 1 end
        if a then mv.x = -1 end
        if d then mv.x = 1 end

        if flyMode then
            if up then mv.y = 1 end
            if down then mv.y = -1 end
        end

        -- 3. Prepare vectors
        local forward = self:getForward()
        local right   = self:getRight()

        if not flyMode then
            forward.y = 0
            if forward.x == 0 and forward.z == 0 then forward.z = 1 end
            forward = forward:normalize()

            right.y = 0
            right = right:normalize()
        end

        local worldMove = (forward * mv.z) + (right * mv.x)
        if flyMode then
            worldMove.y = worldMove.y + mv.y
        end

        if worldMove:length() > 0 then
            worldMove = worldMove:normalize()
        end

        -- 4. Calculate desired vs current velocity
        local speed     = moveSpeed * (shift and sprintMultiplier or 1)
        local targetVel = worldMove * speed
        local curVel    = self:getLinearVelocity()

        if not flyMode then
            targetVel.y = curVel.y -- Preserve gravity
        end

        -- 5. Accelerate / Brake using impulses
        local secs = dt / 1000

        if worldMove:length() > 0 or (flyMode and mv.y ~= 0) then
            -- Accelerating
            local velErr = targetVel - curVel
            if not flyMode then velErr.y = 0 end

            local deltaV = clampMagnitude(velErr, maxAcceleration * secs)
            if deltaV.x == deltaV.x and deltaV.y == deltaV.y and deltaV.z == deltaV.z then
                self:applyImpulse(deltaV)
            end
            return
        end

        -- 6. Brake: no input, slow down
        local brakeTarget = curVel * -1
        if not flyMode then brakeTarget.y = 0 end
        local brakeDeltaV = clampMagnitude(brakeTarget, brakeDeceleration * secs)
        self:applyImpulse(brakeDeltaV)
    end
}
`,
    "builtin://follow_entity.lua": `-- =======================================================================
-- follow_entity.lua
-- Kinematic follow with time-delayed position buffering.
-- The entity trails behind the target by a configurable delay, creating
-- a smooth "camera lag" effect commonly used for chase cameras.
-- =======================================================================

---@class FollowEntityState
---@field history        table[]

---@type ScriptBlueprint<FollowEntityProps, FollowEntityState>
return {
    schema = {
        name = "Follow Entity (Kinematic)",
        description = "Follows a target entity with smoothing and optional time delay.",
        properties = {
            targetEntityId = { type = "entity", required = true, default = "", description = "Target entity to follow." },
            delay          = { type = "number", default = 0.5, description = "How far behind (seconds) to trail the target." },
            speed          = { type = "number", default = 5, description = "Smoothing speed for position interpolation." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from the target." }
        }
    },

    ---@param self ScriptInstance<FollowEntityProps, FollowEntityState>
    init = function(self)
        -- History ring buffer of { t = timestamp, x, y, z }
        self.state.history = {}
    end,

    ---@param self ScriptInstance<FollowEntityProps, FollowEntityState>
    ---@param dt number
    update = function(self, dt)
        local props  = self.properties
        local target = props.targetEntityId
        if not target then return end
        local delay  = props.delay
        local speed  = props.speed
        local offset = props.offset
        if not offset then return end



        -- 1. Record current target position with timestamp
        local tp  = target:getPosition()
        local now = time.now()
        if not tp then return end
        table.insert(self.state.history, { t = now, pos = tp:clone() })

        -- 2. Evict stale entries (keep only entries within the delay window)
        while #self.state.history > 1 and (now - self.state.history[2].t) > delay do
            table.remove(self.state.history, 1)
        end

        -- 3. Pick the oldest buffered position (= delayed target)
        local targetPos = tp
        if delay > 0 and #self.state.history > 0 then
            targetPos = self.state.history[1].pos
        end

        -- 4. Smoothly interpolate towards delayed target + offset
        local desired   = targetPos + offset

        local cur       = self:getPosition()
        local t         = math.min(1, speed * (dt / 1000))

        self:setPosition(math.vec3(
            math.ext.lerp(cur.x, desired.x, t),
            math.ext.lerp(cur.y, desired.y, t),
            math.ext.lerp(cur.z, desired.z, t)
        ))
    end
}
`,
    "builtin://follow_entity_physics.lua": `-- =======================================================================
-- follow_entity_physics.lua
-- Physics-based entity following using proportional impulses.
-- Requires a RigidBody. The entity accelerates towards the target
-- instead of teleporting, making it interact with obstacles naturally.
-- =======================================================================

---@type ScriptBlueprint<FollowEntityPhysicsProps, any>
return {
    schema = {
        name = "Follow Entity (Physics)",
        description = "Follows a target entity via physics impulses. Requires rigidBody.",
        properties = {
            targetEntityId = { type = "entity", required = true, default = "", description = "Target entity to follow." },
            strength       = { type = "number", default = 10, description = "Force multiplier for the attraction." },
            damping        = { type = "number", default = 0.9, description = "Velocity damping factor (0..1). Lower = more damping." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from the target." }
        }
    },

    ---@param self ScriptInstance<FollowEntityPhysicsProps, any>
    ---@param dt number
    update = function(self, dt)
        -- targetEntityId is guaranteed valid by schema.required flag
        local props    = self.properties
        local target   = props.targetEntityId
        local strength = props.strength
        local offset   = props.offset
        if not offset then return end


        -- 1. Calculate desired world position
        local tp = target:getPosition()
        if not tp then return end

        local desired   = tp + offset

        -- 2. Get direction and distance to desired position
        local cur       = self:getPosition()
        local dir       = desired - cur

        -- 3. Apply proportional impulse (P-controller)
        local secs      = dt / 1000
        self:applyImpulse(dir * strength * secs)
    end
}
`,
    "builtin://look_at_entity.lua": `-- =======================================================================
-- look_at_entity.lua
-- Smoothly rotates the entity to face a target entity.
-- Only affects rotation — does NOT move the entity.
-- =======================================================================

---@type ScriptBlueprint<LookAtEntityProps, any>
return {
    schema = {
        name = "Look at Entity",
        description = "Smoothly rotates this entity to face a target entity. Rotation only.",
        properties = {
            targetEntityId = { type = "entity", required = true, default = "", description = "Target entity to look at." },
            speed          = { type = "number", default = 5, description = "Rotation smoothing speed." },
            lookAtOffset   = { type = "vec3", default = { 0, 0, 0 }, description = "World-space offset applied to the target position." }
        }
    },

    ---@param self ScriptInstance<LookAtEntityProps, any>
    ---@param dt number
    update = function(self, dt)
        local props  = self.properties
        local target = props.targetEntityId
        if not target then return end


        local tp = target:getPosition()
        if not tp then return end

        local offset = props.lookAtOffset
        if not offset then return end
        self:lookAt(tp + offset)
    end
}
`,
    "builtin://look_at_point.lua": `-- =======================================================================
-- look_at_point.lua
-- Continuously rotates the entity to face a fixed world-space coordinate.
-- =======================================================================

---@type ScriptBlueprint<LookAtPointProps, any>
return {
    schema = {
        name = "Look at Point",
        description = "Continuously rotates this entity to face a static 3D world coordinate.",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 }, description = "World [x, y, z] coordinate to look at." }
        }
    },

    ---@param self ScriptInstance<LookAtPointProps, any>
    ---@param dt number
    update = function(self, dt)
        local props = self.properties
        local targetPoint = props.targetPoint
        if not targetPoint then return end

        self:lookAt(targetPoint)
    end
}
`,
    "builtin://mouse_look.lua": `-- =======================================================================
-- mouse_look.lua
-- First-person mouse look with pointer lock. Controls entity rotation
-- via yaw (horizontal) and pitch (vertical) stored in state.
-- =======================================================================

---@class MouseLookState
---@field yaw          number
---@field pitch        number

---@type ScriptBlueprint<MouseLookProps, MouseLookState>
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

    ---@param self ScriptInstance<MouseLookProps, MouseLookState>
    ---@param dt number
    update = function(self, dt)
        -- Request pointer lock so the cursor is hidden and deltas are infinite
        input.requestPointerLock()

        local md = input.getMouseDelta()
        if md.x == 0 and md.y == 0 then return end

        local props        = self.properties
        local sensitivityX = props.sensitivityX
        local sensitivityY = props.sensitivityY
        local invertY      = props.invertY



        -- Initialize accumulated angles on first frame
        if not self.state.yaw then self.state.yaw = 0 end
        if not self.state.pitch then self.state.pitch = 0 end

        -- Accumulate rotation
        self.state.yaw   = self.state.yaw - (md.x * sensitivityX)
        self.state.pitch = self.state.pitch + ((invertY and 1 or -1) * md.y * sensitivityY)

        -- Clamp pitch to prevent flipping
        local limit      = (math.pi / 2) - 0.01
        self.state.pitch = math.ext.clamp(self.state.pitch, -limit, limit)

        self:setRotation(math.vec3(self.state.pitch, self.state.yaw, 0))
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

---@class MoveToPointState
---@field startPos       Vec3?
---@field elapsed        number
---@field active         boolean

---@type ScriptBlueprint<MoveToPointProps, MoveToPointState>
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

    ---@param self ScriptInstance<MoveToPointProps, MoveToPointState>
    init = function(self)
        self.state.startPos = self:getPosition()
        self.state.elapsed  = 0
        self.state.active   = false
    end,

    ---Restart the animation when the target point changes.
    ---@param self ScriptInstance<MoveToPointProps, MoveToPointState>
    onPropertyChanged = function(self, key, value)
        if key == "targetPoint" then
            self.state.startPos = self:getPosition()
            self.state.elapsed  = 0
            self.state.active   = false
        end
    end,

    ---@param self ScriptInstance<MoveToPointProps, MoveToPointState>
    ---@param dt number
    update = function(self, dt)
        local props  = self.properties
        local target = props.targetPoint
        if not target then return end

        local duration = math.max(0.01, props.duration)
        local delay    = math.max(0, props.delay)
        local secs         = dt / 1000
        self.state.elapsed = self.state.elapsed + secs

        -- Wait through the delay period
        if self.state.elapsed < delay then return end

        -- Calculate progress within the active movement window
        local active = self.state.elapsed - delay
        local raw    = math.ext.clamp(active / duration, 0, 1)
        local t      = math.ext.ease(props.easing or "cubicInOut", raw)

        -- Interpolate from starting position to target
        local sp     = self.state.startPos
        if not sp then return end

        self:setPosition(math.vec3(
            math.ext.lerp(sp.x, target.x, t),
            math.ext.lerp(sp.y, target.y, t),
            math.ext.lerp(sp.z, target.z, t)
        ))
    end
}
`,
    "builtin://orbit_camera.lua": `-- =======================================================================
-- orbit_camera.lua
-- Orbits the entity around a target entity on a configurable plane.
-- =======================================================================

---@class OrbitCameraState
---@field angle               number

---@type ScriptBlueprint<OrbitCameraProps, OrbitCameraState>
return {
    schema = {
        name = "Orbit Camera",
        description = "Orbits this entity around a target at a fixed distance and speed.",
        properties = {
            targetEntityId      = { type = "entity", required = true, default = "", description = "Central entity to orbit around." },

            altitudeFromSurface = { type = "number", default = 0, description = "Distance buffer from the target's center." },
            speed               = { type = "number", default = 0.5, description = "Orbit speed (radians per second)." },
            orbitPlane          = { type = "string", default = "xz", description = "Orbit plane: 'xz', 'xy', or 'yz'." },
            initialAngle        = { type = "number", default = 0, description = "Starting angle in radians." }
        }
    },

    ---@param self ScriptInstance<OrbitCameraProps, OrbitCameraState>
    ---@param dt number
    update = function(self, dt)
        local props               = self.properties
        local target              = props.targetEntityId
        local altitudeFromSurface = props.altitudeFromSurface
        local speed               = props.speed
        local orbitPlane          = props.orbitPlane



        -- Initialize angle from property on first frame
        if not self.state.angle then
            self.state.angle = props.initialAngle
        end

        local orbitDistance = 1 + altitudeFromSurface
        local secs          = dt / 1000
        self.state.angle    = self.state.angle + (speed * secs)

        local a             = self.state.angle
        local tp            = target:getPosition()
        if not tp then return end

        local offset = math.vec3.zero()

        -- Calculate orbital position on the chosen plane
        if orbitPlane == "xz" then
            offset.x = math.cos(a) * orbitDistance
            offset.z = math.sin(a) * orbitDistance
        elseif orbitPlane == "xy" then
            offset.x = math.cos(a) * orbitDistance
            offset.y = math.sin(a) * orbitDistance
        elseif orbitPlane == "yz" then
            offset.y = math.cos(a) * orbitDistance
            offset.z = math.sin(a) * orbitDistance
        end

        self:setPosition(tp + offset)
    end
}
`,
    "builtin://rotate_continuous.lua": `-- =======================================================================
-- rotate_continuous.lua
-- Continuously rotates the entity at a constant speed on each axis.
-- Speed is specified in degrees per second for each axis.
-- =======================================================================

---@type ScriptBlueprint<RotateContinuousProps, {}>
return {
    schema = {
        name = "Rotate Continuous",
        description = "Spins the entity at a constant rate in degrees per second.",
        properties = {
            speedX = { type = "number", default = 0,  description = "Rotation speed around the X axis (degrees/sec)." },
            speedY = { type = "number", default = 45, description = "Rotation speed around the Y axis (degrees/sec)." },
            speedZ = { type = "number", default = 0,  description = "Rotation speed around the Z axis (degrees/sec)." }
        }
    },

    ---@param self ScriptInstance<RotateContinuousProps, {}>
    ---@param dt number
    update = function(self, dt)
        local props = self.properties
        local toRad = math.pi / 180
        local rot   = self:getRotation()

        rot.x = rot.x + props.speedX * toRad * dt
        rot.y = rot.y + props.speedY * toRad * dt
        rot.z = rot.z + props.speedZ * toRad * dt

        self:setRotation(rot)
    end
}
`,
    "builtin://smooth_follow.lua": `-- =======================================================================
-- smooth_follow.lua
-- Eased follow with configurable curve and arrival behavior.
-- Uses easing functions for smooth acceleration/deceleration as the
-- entity approaches or leaves its target. Great for cinematic cameras.
-- =======================================================================

---@class SmoothFollowState
---@field startPos       Vec3?
---@field elapsed        number
---@field lastGoal       Vec3?

---@type ScriptBlueprint<SmoothFollowProps, SmoothFollowState>
return {
    schema = {
        name = "Smooth Follow (Eased)",
        description = "Follows a target using configurable easing curves for cinematic motion.",
        properties = {
            targetEntityId = { type = "entity", required = true, default = "", description = "Target entity to follow." },
            duration       = { type = "number", default = 1.0, description = "Time in seconds to reach the target." },
            easing         = { type = "string", default = "quadOut", description = "Easing function: linear, quadOut, cubicInOut, bounceOut, smoothstep, etc." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from target." }
        }
    },

    ---@param self ScriptInstance<SmoothFollowProps, SmoothFollowState>
    init = function(self)
        self.state.startPos = nil -- captured when target moves
        self.state.elapsed  = 0
        self.state.lastGoal = nil
    end,


    ---@param self ScriptInstance<SmoothFollowProps, SmoothFollowState>
    ---@param dt number
    update = function(self, dt)
        local props    = self.properties
        local target   = props.targetEntityId
        local duration = math.max(0.01, props.duration)
        local offset   = props.offset
        if not offset then return end



        -- Calculate goal position (target + offset)
        local tp = target:getPosition()
        if not tp then return end
        local goal      = tp + offset

        -- Detect if goal changed significantly → restart easing
        local last      = self.state.lastGoal
        if not last or not self.state.startPos then
            self.state.startPos = self:getPosition()
            self.state.elapsed  = 0
            self.state.lastGoal = goal
        else
            local dist = goal:distanceTo(last)
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
        local t            = math.ext.ease(props.easing or "quadOut", raw)

        -- Interpolate from start position to goal using the eased \`t\`
        local sp           = self.state.startPos
        if not sp then return end
        self:setPosition(math.vec3(
            math.ext.lerp(sp.x, goal.x, t),
            math.ext.lerp(sp.y, goal.y, t),
            math.ext.lerp(sp.z, goal.z, t)
        ))
    end
}
`,
    "builtin://smooth_look_at.lua": `-- =======================================================================
-- smooth_look_at.lua
-- Eased rotation towards a target entity. Instead of snapping instantly,
-- the entity smoothly rotates over a configurable duration using an
-- easing curve. Useful for turrets, cinematic cameras, and NPCs.
-- =======================================================================

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

---@class SmoothLookAtState
---@field lastAngle number?

---@type ScriptBlueprint<SmoothLookAtProps, SmoothLookAtState>
return {
    schema = {
        name = "Smooth Look At",
        description = "Smoothly rotates to face a target using easing curves.",
        properties = {
            targetEntityId = { type = "entity", required = true, default = "", description = "Target entity to look at." },

            speed          = { type = "number", default = 3, description = "Rotation speed (higher = faster convergence)." },
            easing         = { type = "string", default = "sineOut", description = "Easing function: sineOut, quadOut, cubicInOut, etc." },
            offset         = { type = "vec3", default = { 0, 0, 0 }, description = "Offset applied to target position." }
        }
    },

    ---@param self ScriptInstance<SmoothLookAtProps, SmoothLookAtState>
    ---@param dt number
    update = function(self, dt)
        local props  = self.properties
        local target = props.targetEntityId
        local speed  = props.speed or 3

        local offset = props.offset

        local tp     = target:getPosition()
        if not tp then return end
        local cur            = self:getPosition()

        -- Direction from self to target+offset
        local desired        = offset and (tp + offset) or tp
        local dir            = desired - cur

        -- Calculate desired yaw and pitch from direction
        local desiredYaw     = math.atan(dir.x, dir.z)
        local horizontalDist = math.sqrt(dir.x * dir.x + dir.z * dir.z)
        local desiredPitch   = -math.atan(dir.y, horizontalDist)

        -- Get current rotation
        local rot            = self:getRotation()

        -- Calculate interpolation factor with easing
        local secs           = dt / 1000
        local raw            = math.ext.clamp(speed * secs, 0, 1)
        local t              = math.ext.ease(props.easing or "sineOut", raw)

        -- Smoothly interpolate angles
        local newPitch       = lerpAngle(rot.x, desiredPitch, t)
        local newYaw         = lerpAngle(rot.y, desiredYaw, t)

        self:setRotation(math.vec3(newPitch, newYaw, 0))
    end
}
`,
    "builtin://spawn_on_interval.lua": `-- =======================================================================
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
`,
    "builtin://waypoint_path.lua": `-- =======================================================================
-- waypoint_path.lua
-- Orchestrates movement through a list of waypoint entities by driving
-- a sibling move_to_point script.  Each waypoint is a scene entity
-- whose transform.position is read at runtime, so waypoints can be
-- moved while the path is being followed.
--
-- REQUIRES: a "Move to Point (Eased)" script slot on the same entity.
-- waypoint_path sets targetPoint / duration / easing / delay on it.
-- =======================================================================

---@class WaypointPathState
---@field index       number   Index of the waypoint we are currently moving TOWARDS (1-based).
---@field moving      boolean  True after we have pushed a target to move_to_point.
---@field segTime     number   Expected duration (seconds) for the current segment.
---@field elapsed     number   Seconds elapsed since we pushed the current target.

---@type ScriptBlueprint<WaypointPathProps, WaypointPathState>
return {
    schema = {
        name = "Waypoint Path",
        description = "Follows a sequence of waypoint entities by driving a sibling Move-to-Point script.",
        properties = {
            speed            = { type = "number",      default = 3,           description = "Movement speed in units/sec." },
            loop             = { type = "boolean",     default = true,        description = "Loop back to start when the end is reached." },
            waypoints        = { type = "entityArray", default = {},          description = "Ordered list of waypoint entities." },
            easing           = { type = "string",      default = "cubicInOut", description = "Easing curve forwarded to Move-to-Point." },
            arrivalThreshold = { type = "number",      default = 0.15,        description = "Distance at which the waypoint is considered reached." }
        }
    },

    ---@param self ScriptInstance<WaypointPathProps, WaypointPathState>
    init = function(self)
        self.state.index   = 1
        self.state.moving  = false
        self.state.segTime = 0
        self.state.elapsed = 0
    end,

    ---@param self ScriptInstance<WaypointPathProps, WaypointPathState>
    ---@param dt number
    update = function(self, dt)
        local wps   = self.properties.waypoints
        if not wps then return end

        local count = #wps
        if count < 1 then return end

        -- Access sibling move_to_point script via cross-script proxy
        local mtp = self.scripts[Script.MoveToPoint]
        if not mtp then return end

        local secs = dt / 1000

        -- ── Skip waypoints we are already on top of ─────────────────
        -- This handles the common case where the entity starts at
        -- the first waypoint and needs to immediately target the next.
        while not self.state.moving do
            local idx = self.state.index
            local wp  = wps[idx]
            if not wp or not wp:isValid() then return end

            local target = wp:getPosition()
            local dist   = self:getPosition():distanceTo(target)

            if dist < (self.properties.arrivalThreshold or 0.15) then
                -- Already at this waypoint — advance
                local nextIdx = idx + 1
                if nextIdx > count then
                    if self.properties.loop then
                        nextIdx = 1
                    else
                        return -- path complete
                    end
                end
                self.state.index = nextIdx
            else
                -- Push target to move_to_point
                local duration = dist / math.max(0.01, self.properties.speed)

                mtp.targetPoint = target:toArray()
                mtp.duration    = duration
                mtp.easing      = self.properties.easing or "cubicInOut"
                mtp.delay       = 0

                self.state.moving  = true
                self.state.segTime = duration
                self.state.elapsed = 0
                return  -- Wait for move_to_point to pick up the new target
            end
        end

        -- ── Check arrival ────────────────────────────────────────────
        self.state.elapsed = self.state.elapsed + secs

        local idx    = self.state.index
        local wp     = wps[idx]
        if not wp or not wp:isValid() then return end

        local target = wp:getPosition()
        local dist   = self:getPosition():distanceTo(target)

        if dist < (self.properties.arrivalThreshold or 0.15) then
            -- Advance to next waypoint
            local nextIdx = idx + 1
            if nextIdx > count then
                if self.properties.loop then
                    nextIdx = 1
                else
                    return -- path complete
                end
            end
            self.state.index  = nextIdx
            self.state.moving = false
        end
    end
}
`,
};

export const SystemScripts: Record<string, string> = {
    "math_ext.lua": `-- =======================================================================
-- math_ext.lua
-- System library extending standard math functionality with vector types
-- and Object-Oriented metatable behaviors.
-- =======================================================================

---@diagnostic disable-next-line: undefined-global
math.ext = math_ext

-- Inject Object-Oriented Vector API
local Vec3 = {}
Vec3.__index = Vec3

function Vec3:__add(other)
    return math.vec3(self.x + other.x, self.y + other.y, self.z + other.z)
end

function Vec3:__sub(other)
    return math.vec3(self.x - other.x, self.y - other.y, self.z - other.z)
end

function Vec3:__mul(val)
    if type(val) == "number" then
        return math.vec3(self.x * val, self.y * val, self.z * val)
    elseif type(self) == "number" then
        return math.vec3(val.x * self, val.y * self, val.z * self)
    end
    -- Element-wise vector multiplication
    return math.vec3(self.x * val.x, self.y * val.y, self.z * val.z)
end

function Vec3:__div(val)
    if type(val) == "number" then
        return math.vec3(self.x / val, self.y / val, self.z / val)
    end
    -- Element-wise vector division
    return math.vec3(self.x / val.x, self.y / val.y, self.z / val.z)
end

function Vec3:__unm()
    return math.vec3(-self.x, -self.y, -self.z)
end

function Vec3:__eq(other)
    local epsilon = 1e-6
    return math.abs(self.x - other.x) < epsilon and
        math.abs(self.y - other.y) < epsilon and
        math.abs(self.z - other.z) < epsilon
end

function Vec3:__tostring()
    return string.format("Vec3(%.3f, %.3f, %.3f)", self.x, self.y, self.z)
end

function Vec3:lengthSq()
    return self.x * self.x + self.y * self.y + self.z * self.z
end

function Vec3:length()
    return math.sqrt(self:lengthSq())
end

function Vec3:normalize()
    local len = self:length()
    if len > 0 then
        return math.vec3(self.x / len, self.y / len, self.z / len)
    end
    return math.vec3(0, 0, 0)
end

function Vec3:dot(other)
    return self.x * other.x + self.y * other.y + self.z * other.z
end

function Vec3:cross(other)
    return math.vec3(
        self.y * other.z - self.z * other.y,
        self.z * other.x - self.x * other.z,
        self.x * other.y - self.y * other.x
    )
end

function Vec3:distanceTo(other)
    local dx = self.x - other.x
    local dy = self.y - other.y
    local dz = self.z - other.z
    return math.sqrt(dx * dx + dy * dy + dz * dz)
end

function Vec3:clone()
    return math.vec3(self.x, self.y, self.z)
end

function Vec3:lerp(other, t)
    return math.vec3(
        self.x + (other.x - self.x) * t,
        self.y + (other.y - self.y) * t,
        self.z + (other.z - self.z) * t
    )
end

function Vec3:reflect(normal)
    local d = 2 * self:dot(normal)
    return math.vec3(self.x - d * normal.x, self.y - d * normal.y, self.z - d * normal.z)
end

function Vec3:project(other)
    local d = other:dot(other)
    if d < 1e-12 then return math.vec3(0, 0, 0) end
    local s = self:dot(other) / d
    return math.vec3(other.x * s, other.y * s, other.z * s)
end

function Vec3:angleTo(other)
    local d = self:dot(other)
    local lenProduct = self:length() * other:length()
    if lenProduct < 1e-12 then return 0 end
    local cosAngle = math.ext.clamp(d / lenProduct, -1, 1)
    return math.acos(cosAngle)
end

function Vec3:min(other)
    return math.vec3(math.min(self.x, other.x), math.min(self.y, other.y), math.min(self.z, other.z))
end

function Vec3:max(other)
    return math.vec3(math.max(self.x, other.x), math.max(self.y, other.y), math.max(self.z, other.z))
end

function Vec3:abs()
    return math.vec3(math.abs(self.x), math.abs(self.y), math.abs(self.z))
end

function Vec3:floor()
    return math.vec3(math.floor(self.x), math.floor(self.y), math.floor(self.z))
end

function Vec3:ceil()
    return math.vec3(math.ceil(self.x), math.ceil(self.y), math.ceil(self.z))
end

function Vec3:set(x, y, z)
    self.x = x or self.x
    self.y = y or self.y
    self.z = z or self.z
    return self
end

function Vec3:toArray()
    return { self.x, self.y, self.z }
end

-- smoothDamp: spring-damper smooth interpolation (returns value, newVelocity)
if math.ext then
    function math.ext.smoothDamp(current, target, velocity, smoothTime, dt, maxSpeed)
        smoothTime = math.max(0.0001, smoothTime)
        maxSpeed = maxSpeed or math.huge
        local omega = 2.0 / smoothTime
        local x = omega * dt
        local exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x)
        local change = current - target
        local maxChange = maxSpeed * smoothTime
        change = math.ext.clamp(change, -maxChange, maxChange)
        local temp = (velocity + omega * change) * dt
        local newVelocity = (velocity - omega * temp) * exp
        local result = (current - change) + (change + temp) * exp
        -- Prevent overshoot
        if (target - current > 0) == (result > target) then
            result = target
            newVelocity = (result - target) / dt
        end
        return result, newVelocity
    end
end

--- Calls an easing function by name.
--- Avoids storing a JS function reference in a local variable, which can
--- lose its callable status across the wasmoon Lua↔JS boundary.
--- Falls back to an inline smoothstep if the easing table or name is missing.
---@param name string  Easing function name (e.g. "quadOut", "sineOut").
---@param t    number  Normalised time value [0, 1].
---@return number
function math.ext.ease(name, t)
    local easings = math.ext.easing
    if easings then
        local fn = easings[name]
        if fn then return fn(t) end
        if easings.smoothstep then return easings.smoothstep(t) end
    end
    -- Inline smoothstep fallback
    return t * t * (3 - 2 * t)
end

-- Constructor function
math.vec3 = setmetatable({
    zero    = function() return math.vec3(0, 0, 0) end,
    one     = function() return math.vec3(1, 1, 1) end,
    up      = function() return math.vec3(0, 1, 0) end,
    down    = function() return math.vec3(0, -1, 0) end,
    left    = function() return math.vec3(-1, 0, 0) end,
    right   = function() return math.vec3(1, 0, 0) end,
    forward = function() return math.vec3(0, 0, -1) end,
    back    = function() return math.vec3(0, 0, 1) end
}, {
    __call = function(_, x, y, z)
        local t = { x = x or 0, y = y or 0, z = z or 0 }
        setmetatable(t, Vec3)
        return t
    end
})
`,
    "sandbox_hydration.lua": `-- ═══════════════════════════════════════════════════════════════════════
-- sandbox_hydration.lua — Property Hydration & Self Construction
-- ═══════════════════════════════════════════════════════════════════════
-- LOAD ORDER: 3 of 4 (after sandbox_metatables.lua)
--
-- PURPOSE:
--   Convert raw JS property values (strings, arrays, plain objects)
--   into rich Lua proxy objects (entity proxies, Vec3, etc.) and
--   construct the \`self\` object that every user script receives.
--
-- DEPENDS ON (from sandbox_metatables.lua):
--   __WrapEntity, __WrapComponent, __WrapPrefab  — proxy constructors
--   __SelfMT                                      — self metatable
--
-- ─────────────────────────────────────────────────────────────────────
-- PROPERTY HYDRATION EXPLAINED
-- ─────────────────────────────────────────────────────────────────────
-- Scripts declare typed properties in their \`schema\`:
--
--   schema = {
--       properties = {
--           target    = { type = "entity",      default = "" },
--           waypoints = { type = "entityArray",  default = {} },
--           offset    = { type = "vec3",         default = {0,0,0} },
--           skin      = { type = "prefab",       default = "" },
--       }
--   }
--
-- On the TypeScript side these are stored as raw primitives:
--   • entity     → string (entity ID, e.g. "npc1")
--   • entityArray → string[] (array of entity IDs)
--   • vec3       → [x,y,z] array or {x,y,z} object
--   • prefab     → string (prefab registry key)
--   • component  → string (entity ID, paired with componentType)
--
-- __WrapValue converts these TS-side representations into Lua proxies
-- so that script code can write:
--   self.properties.target:getPosition()   -- entity proxy
--   self.properties.offset:length()        -- Vec3 with methods
--   self.properties.skin:instantiate()     -- prefab proxy
-- ═══════════════════════════════════════════════════════════════════════


-- ── __WrapValue (GLOBAL) ─────────────────────────────────────────────
-- Converts a single raw JS property value into the appropriate Lua type,
-- guided by the property definition from the script's schema.
--
-- Declared as a global (not local) because sandbox_runtime.lua references
-- it from __UpdateProperty.  In Lua, \`local x = ...; x = x\` is a no-op
-- that does NOT promote the local to a global.
--
-- @param val     any        The raw value from JS (string, table, userdata, etc.)
-- @param propDef table|nil  The schema entry: { type = "entity"|"vec3"|... }
-- @return any               The hydrated Lua value (proxy, Vec3, array, or passthrough)

function __WrapValue(val, propDef)
    if not propDef then return val end

    if propDef.type == "entity" and type(val) == "string" and val ~= "" then
        -- Entity ID string → entity proxy with __EntityMT
        return __WrapEntity(val)

    elseif propDef.type == "component" and type(val) == "string" and val ~= "" then
        -- Entity ID + component type → component proxy with __ComponentMT
        return __WrapComponent(val, propDef.componentType)

    elseif propDef.type == "prefab" and type(val) == "string" and val ~= "" then
        -- Prefab key → prefab proxy with __PrefabMT
        return __WrapPrefab(val)

    elseif propDef.type == "vec3" and val ~= nil then
        -- Vec3 can arrive from JS in two formats:
        --   Array format:  [1, 2, 3]  →  val[1], val[2], val[3]
        --   Object format: {x:1, y:2, z:3}  →  val.x, val.y, val.z
        if val[1] ~= nil then
            return math.vec3(val[1], val[2], val[3])
        elseif val.x ~= nil then
            return math.vec3(val.x, val.y, val.z)
        end

    elseif propDef.type == "entityArray" and val ~= nil then
        -- Array of entity ID strings → array of entity proxies.
        -- Uses numeric index iteration (val is JS array → Lua userdata).
        local result = {}
        local i = 1
        while val[i] ~= nil do
            local entry = val[i]
            if type(entry) == "string" and entry ~= "" then
                result[#result + 1] = __WrapEntity(entry)
            end
            i = i + 1
        end
        return result
    end

    -- All other types (number, string, boolean) pass through unchanged.
    return val
end


-- ═══════════════════════════════════════════════════════════════════════
-- __WrapSelf — Construct the \`self\` object for a script instance
-- ═══════════════════════════════════════════════════════════════════════
-- Called once per script slot during compilation (in ScriptInstanceManager.
-- compileSlot → doStringSync).  Receives the raw JS context object
-- (LuaSelfInstance) and the script's schema, and returns a Lua table
-- with __SelfMT that the script will use as \`self\` in every hook call.
--
-- STRUCTURE OF THE RETURNED TABLE:
--   {
--       __jsCtx     = <userdata: JS LuaSelfInstance>,  -- hidden from scripts
--       id          = "entity-id",                     -- entity this script runs on
--       slotId      = "slot_entity_0",                 -- unique slot identifier
--       state       = {},                              -- private Lua-only state
--       properties  = {                                -- hydrated property values
--           speed = 5,
--           target = <entity proxy>,
--           offset = <Vec3>,
--           ...
--       }
--   }
--   metatable: __SelfMT
--
-- WHY state IS A PURE LUA TABLE:
--   wasmoon destroys metatables when serialising Lua tables across the
--   Lua↔JS boundary.  By keeping state as a raw Lua table (never
--   assigned to jsCtx), Vec3 values and other metatable-dependent
--   objects stored in state survive across frames.
--
-- WHY properties IS COPIED (not proxied):
--   Same reason as state — we copy JS property values into a plain
--   Lua table and hydrate them with __WrapValue once.  When properties
--   change on the TS side, syncProperties detects the diff and calls
--   __UpdateProperty to patch individual keys (see sandbox_runtime.lua).

function __WrapSelf(jsCtx, schema)
    local s = { __jsCtx = jsCtx }
    s.id     = jsCtx.id
    s.slotId = jsCtx.slotId
    s.state  = {}

    -- Hydrate properties from JS values → Lua proxies using schema types.
    local props = {}
    if schema and schema.properties then
        for k, propDef in pairs(schema.properties) do
            local val = jsCtx.properties[k]
            props[k] = __WrapValue(val, propDef)
        end
    end
    s.properties = props

    setmetatable(s, __SelfMT)
    return s
end
`,
    "sandbox_metatables.lua": `-- ═══════════════════════════════════════════════════════════════════════
-- sandbox_metatables.lua — Proxy Metatables for Entities, Components,
--                          Scripts, Prefabs, and the Script Self
-- ═══════════════════════════════════════════════════════════════════════
-- LOAD ORDER: 2 of 4 (after sandbox_security.lua)
--
-- PURPOSE:
--   Define all Lua metatables that power the engine's OOP-style API.
--   When a Lua script writes \`self:getPosition()\` or \`entity.transform.x\`,
--   it's really a plain table whose __index metatable calls into JS bridges.
--
-- ─────────────────────────────────────────────────────────────────────
-- PRIMER: HOW LUA METATABLES WORK
-- ─────────────────────────────────────────────────────────────────────
-- In Lua every table can have a "metatable" — a hidden companion table
-- that intercepts operations the table doesn't handle natively.
--
-- The two metamethods we use everywhere:
--
--   __index(table, key)
--     Called when \`table.key\` is nil (the key doesn't exist on the table).
--     Returns the value the caller should see.  This is how we intercept
--     property reads and route them to TypeScript bridges.
--
--   __newindex(table, key, value)
--     Called when assigning \`table.key = value\` and the key doesn't
--     already exist as a raw field.  This is how we intercept writes
--     and push them to TS bridges (e.g. setComponentProperty).
--
-- Example:
--   local proxy = { entityId = "npc1", type = "transform" }
--   setmetatable(proxy, {
--       __index = function(t, k)
--           return scene.getComponentProperty(t.entityId, t.type, k)
--       end
--   })
--   print(proxy.x)  -- triggers __index → calls scene.getComponentProperty
--
-- ─────────────────────────────────────────────────────────────────────
-- METATABLE MAP — VISUAL OVERVIEW
-- ─────────────────────────────────────────────────────────────────────
--
--   ┌────────────────────────────────────────────────────────────┐
--   │                     __SelfMT                               │
--   │  The "self" object inside every user script.               │
--   │  Lookup chain:                                             │
--   │    1. rawget (properties, id, slotId, state)               │
--   │    2. JS context (__jsCtx) — getComponent, etc.            │
--   │    3. Fallback to __EntityMT (transform, physics, scripts) │
--   └──────────────────────┬─────────────────────────────────────┘
--                          │ fallback
--   ┌──────────────────────▼─────────────────────────────────────┐
--   │                   __EntityMT                                │
--   │  Wraps any entity reference (self, scene.findEntity, etc.)  │
--   │  Lookup chain:                                              │
--   │    1. "scripts"  → __ScriptsProxyMT (cross-script access)   │
--   │    2. Helper methods (isValid, addComponent, destroy, ...)  │
--   │    3. Transform bridge (getPosition, setPosition, ...)      │
--   │    4. Physics bridge (applyForce, setVelocity, ...)         │
--   │    5. Scene bridge (findEntity, spawn, ...)                 │
--   │    6. Dynamic Component Access → __ComponentMT              │
--   └────────────────────────────────────────────────────────────┘
--
--   ┌────────────────────────────────────────────────────────────┐
--   │                  __ComponentMT                              │
--   │  Wraps a single component on an entity.                    │
--   │  proxy.x  → scene.getComponentProperty(entityId, type, x)  │
--   │  proxy.x = v → scene.setComponentProperty(...)             │
--   └────────────────────────────────────────────────────────────┘
--
--   ┌────────────────────────────────────────────────────────────┐
--   │  __ScriptsProxyMT → __ScriptSlotMT                         │
--   │  Two-level proxy for cross-script property access:          │
--   │    self.scripts[Script.MoveToPoint].targetPoint             │
--   │     └─ ScriptsProxy ──┘                └─ ScriptSlot ──┘   │
--   │  ScriptsProxy[scriptId] → ScriptSlot { entityId, scriptId } │
--   │  ScriptSlot.key → scene.getScriptSlotProperty(...)         │
--   │  ScriptSlot.key = v → scene.setScriptSlotProperty(...)     │
--   └────────────────────────────────────────────────────────────┘
--
--   ┌────────────────────────────────────────────────────────────┐
--   │                   __PrefabMT                                │
--   │  Wraps a prefab reference.  Only method: :instantiate()    │
--   └────────────────────────────────────────────────────────────┘
--
-- ═══════════════════════════════════════════════════════════════════════


-- ── Vec3 Auto-Wrapping (utility used by multiple metatables) ────────
-- Converts plain {x,y,z} tables/userdata returned by TS bridges into
-- proper Vec3 objects with metatables (operators, :clone(), :length()).
-- Safe to call on any value — non-vec3 values pass through unchanged.
--
-- NOTE: \`math.vec3\` is defined later by math_ext.lua (loaded after
-- all sandbox modules).  This function captures it lazily at call-time,
-- so it must ONLY be called during script hooks — never at load time.
local function __WrapVec3(val)
    if val ~= nil and type(val) ~= "number" and type(val) ~= "string"
       and type(val) ~= "boolean" and type(val) ~= "function" then
        local x, y, z = val.x, val.y, val.z
        if x ~= nil and y ~= nil and z ~= nil then
            return math.vec3(x, y, z)
        end
    end
    return val
end


-- ═══════════════════════════════════════════════════════════════════════
-- 1. __ComponentMT — Component Property Proxy
-- ═══════════════════════════════════════════════════════════════════════
-- Every time you access a component in Lua (e.g. \`self.transform.x\`),
-- you're actually reading/writing through this metatable, which calls
-- the scene bridge on the TypeScript side.
--
-- Internal table shape:
--   { entityId = "npc1", type = "transform" }

__ComponentMT = {
    __index = function(t, k)
        return scene.getComponentProperty(t.entityId, t.type, k)
    end,
    __newindex = function(t, k, v)
        scene.setComponentProperty(t.entityId, t.type, k, v)
    end
}

--- Create a component proxy for the given entity and component type.
--- @param entityId string  The entity's unique ID.
--- @param type     string  Component type name (e.g. "transform", "mesh").
--- @return table           Proxy table with __ComponentMT metatable.
function __WrapComponent(entityId, type)
    local c = { entityId = entityId, type = type }
    setmetatable(c, __ComponentMT)
    return c
end


-- ═══════════════════════════════════════════════════════════════════════
-- 2. Cross-Script Property Proxy (__ScriptsProxyMT + __ScriptSlotMT)
-- ═══════════════════════════════════════════════════════════════════════
-- Allows one script to read/write properties of another script on the
-- same entity (or any entity).
--
-- USAGE:
--   local mtp = self.scripts[Script.MoveToPoint]  -- returns ScriptSlot proxy
--   mtp.targetPoint = {1, 2, 3}                    -- calls setScriptSlotProperty
--   local dur = mtp.duration                       -- calls getScriptSlotProperty
--
-- HOW IT WORKS (two-level proxy):
--   self.scripts          → ScriptsProxy { entityId }      (__ScriptsProxyMT)
--   self.scripts[id]      → ScriptSlot   { entityId, id }  (__ScriptSlotMT)
--   self.scripts[id].key  → scene.getScriptSlotProperty(entityId, id, key)
--
-- Changes made via setScriptSlotProperty write directly to the target
-- slot's \`properties\` table on the TS side.  They are synced into the
-- target script's Lua context on the NEXT frame (during earlyUpdate),
-- which calls syncProperties → __UpdateProperty → onPropertyChanged.

__ScriptSlotMT = {
    __index = function(t, k)
        return scene.getScriptSlotProperty(t.entityId, t.scriptId, k)
    end,
    __newindex = function(t, k, v)
        scene.setScriptSlotProperty(t.entityId, t.scriptId, k, v)
    end
}

--- Create a script-slot proxy for reading/writing another script's properties.
--- @param entityId string  The entity that owns the target script.
--- @param scriptId string  The target script's URI (e.g. Script.MoveToPoint).
--- @return table           Proxy table with __ScriptSlotMT metatable.
function __WrapScriptSlot(entityId, scriptId)
    local s = { entityId = entityId, scriptId = scriptId }
    setmetatable(s, __ScriptSlotMT)
    return s
end

__ScriptsProxyMT = {
    __index = function(t, scriptId)
        return __WrapScriptSlot(t.entityId, scriptId)
    end
}

--- Create the top-level scripts proxy for an entity.
--- Indexing this with a script URI returns a ScriptSlot proxy.
--- @param entityId string
--- @return table  Proxy table with __ScriptsProxyMT metatable.
function __WrapScriptsProxy(entityId)
    local p = { entityId = entityId }
    setmetatable(p, __ScriptsProxyMT)
    return p
end


-- ═══════════════════════════════════════════════════════════════════════
-- 3. __PrefabMT — Prefab Reference Proxy
-- ═══════════════════════════════════════════════════════════════════════
-- Wraps a prefab key string so it can be instantiated:
--   local p = self.properties.myPrefab  -- returns a PrefabMT proxy
--   p:instantiate({ position = {1,2,3} })

__PrefabMT = {
    __index = {
        instantiate = function(t, overrides)
            return scene.instantiatePrefab(t.key, overrides)
        end
    }
}

--- Create a prefab proxy.
--- @param key string  The prefab registry key.
--- @return table      Proxy table with __PrefabMT metatable.
function __WrapPrefab(key)
    local p = { key = key }
    setmetatable(p, __PrefabMT)
    return p
end


-- ═══════════════════════════════════════════════════════════════════════
-- 4. __EntityMT — Entity Proxy
-- ═══════════════════════════════════════════════════════════════════════
-- The most complex metatable.  Any entity reference in Lua (from
-- scene.findEntity, self.properties.target, waypoint arrays, etc.)
-- is a plain table \`{ id = "entity-id" }\` with this metatable.
--
-- The __index function implements a priority chain:
--   0. "scripts"  → cross-script proxy (__ScriptsProxyMT)
--   1. Named helper methods (isValid, addComponent, destroy, ...)
--   2. Transform bridge functions (getPosition, setPosition, ...)
--   3. Physics bridge functions (applyForce, setVelocity, ...)
--   4. Scene bridge functions (findEntity, spawn, ...)
--   5. Fallback: Dynamic Component Access (UCA) → __ComponentMT
--
-- The fallback at step 5 means \`entity.mesh\` is equivalent to
-- calling \`entity:getComponent("mesh")\`.

__EntityMT = {
    __index = function(t, k)
        -- 0. Cross-script access: entity.scripts
        if k == "scripts" then
            return __WrapScriptsProxy(t.id)
        end

        -- 1. Helper methods
        if k == "isValid" then
            return function(self) return scene.__exists(self.id) end
        end
        if k == "addComponent" then
            return function(self, type, params) return scene.addComponent(self.id, type, params) end
        end
        if k == "removeComponent" then
            return function(self, type) return scene.removeComponent(self.id, type) end
        end
        if k == "hasComponent" then
            return function(self, type) return scene.hasComponent(self.id, type) end
        end
        if k == "getComponent" then
            return function(self, type)
                if scene.hasComponent(self.id, type) then
                    return __WrapComponent(self.id, type)
                end
                return nil
            end
        end
        if k == "applyMaterial" then
            return function(self, key, overrides)
                return scene.applyResource(self.id, key, "standardMaterial", overrides)
            end
        end
        if k == "applyGeometry" then
            return function(self, key, overrides)
                return scene.applyResource(self.id, key, nil, overrides)
            end
        end
        if k == "applyResource" then
            return function(self, key, overrides) return scene.applyResource(self.id, key, nil, overrides) end
        end
        if k == "destroy" then
            return function(self) scene.destroyEntity(self.id) end
        end

        -- 2. Transform / Physics / Scene bridge helpers
        --    Return values are auto-wrapped: plain {x,y,z} → Vec3 with metatables.
        if transform and transform[k] then
            return function(self, ...) return __WrapVec3(transform[k](self, ...)) end
        end
        if physics and physics[k] then
            return function(self, ...) return __WrapVec3(physics[k](self, ...)) end
        end
        if scene and scene[k] then
            return function(self, ...) return scene[k](self, ...) end
        end

        -- 3. Dynamic Component Access (UCA)
        --    entity.mesh  →  __WrapComponent(entity.id, "mesh")
        return __WrapComponent(t.id, k)
    end
}

--- Create an entity proxy from an entity ID string.
--- Returns nil for empty/nil IDs (safe to call with bad data).
--- @param id string|nil  The entity's unique ID.
--- @return table|nil     Proxy table with __EntityMT, or nil.
function __WrapEntity(id)
    if not id or id == "" then return nil end
    local e = { id = id }
    setmetatable(e, __EntityMT)
    return e
end


-- ═══════════════════════════════════════════════════════════════════════
-- 5. __SelfMT — Script Self Proxy
-- ═══════════════════════════════════════════════════════════════════════
-- This is the metatable set on the \`self\` object inside every user
-- script.  It is the FIRST metatable consulted when a script does
-- \`self.anything\`.
--
-- IMPORTANT DESIGN DECISION:
--   \`self\` is NOT just an entity proxy (__EntityMT).  It has extra
--   fields that don't exist on regular entities:
--     • self.properties  — the script's declared property values
--     • self.id          — shortcut to the entity ID
--     • self.slotId      — the script slot's unique ID
--     • self.state       — persistent state table (private to this script)
--     • self.__jsCtx     — hidden reference to the JS LuaSelfInstance
--
--   The lookup chain for self.X:
--     1. rawget: properties, id, slotId, state  → return immediately
--     2. JS context (__jsCtx): getComponent function, etc.
--        Values returned from JS are auto-wrapped (Vec3 hydration).
--     3. Fallback to __EntityMT.__index: scripts, transform helpers,
--        physics helpers, dynamic component access.
--
--   This means \`self:getPosition()\` and \`self.scripts[...]\` both work
--   even though they are NOT raw fields — they resolve via step 3.

__SelfMT = {
    __index = function(t, k)
        -- Step 1: Reserved raw fields — stored directly on the Lua table.
        if k == "properties" or k == "id" or k == "slotId" or k == "state" then
            return rawget(t, k)
        end

        -- Step 2: JS context properties (e.g. getComponent).
        -- Values from JS that look like {x,y,z} are auto-wrapped to Vec3.
        local jsCtx = rawget(t, "__jsCtx")
        local val = jsCtx and jsCtx[k]
        if val ~= nil then return __WrapVec3(val) end

        -- Step 3: Entity behavior fallback.
        -- This gives \`self\` the same API as any entity proxy:
        -- self.scripts, self:getPosition(), self:destroy(), etc.
        return __EntityMT.__index(t, k)
    end,

    -- Writes go to the JS context so TypeScript can observe them.
    __newindex = function(t, k, v)
        t.__jsCtx[k] = v
    end
}
`,
    "sandbox_runtime.lua": `-- ═══════════════════════════════════════════════════════════════════════
-- sandbox_runtime.lua — Slot Storage, Hook Execution & Property Sync
-- ═══════════════════════════════════════════════════════════════════════
-- LOAD ORDER: 4 of 4 (after sandbox_hydration.lua)
--
-- PURPOSE:
--   Manage the Lua-side storage of compiled script instances and
--   provide the entry points that TypeScript calls to execute hooks
--   and synchronise property changes.
--
-- DEPENDS ON (from previous modules):
--   __WrapValue  — property hydration (sandbox_hydration.lua)
--   __SelfMT     — self metatable (sandbox_metatables.lua)
--
-- ─────────────────────────────────────────────────────────────────────
-- WHY STORAGE LIVES IN LUA (NOT IN TYPESCRIPT)
-- ─────────────────────────────────────────────────────────────────────
-- wasmoon (the Lua↔JS bridge) serialises Lua tables to plain JS
-- objects when they cross the boundary.  This serialisation DESTROYS
-- all metatables — which means entity proxies, Vec3 objects, and the
-- self context would lose their __index/__newindex behaviour.
--
-- To avoid this, we keep two global dictionaries entirely in Lua:
--   __Contexts   — the \`self\` object for each compiled slot
--   __SlotHooks  — the hook function table for each compiled slot
--
-- TypeScript only passes opaque string keys (slotId) across the
-- boundary when it wants to invoke a hook or update a property.
-- ═══════════════════════════════════════════════════════════════════════


-- ── Global Storage ──────────────────────────────────────────────────
-- Keyed by slotId (e.g. "slot_player_0").

__Contexts  = {}   -- slotId → self table (with __SelfMT metatable)
__SlotHooks = {}   -- slotId → { init=fn, update=fn, onPropertyChanged=fn, ... }


-- ═══════════════════════════════════════════════════════════════════════
-- __StoreSlot — Save a compiled script's hooks and context
-- ═══════════════════════════════════════════════════════════════════════
-- Called from TypeScript (ScriptInstanceManager.compileSlot) via
-- doStringSync after a user script has been compiled and __WrapSelf
-- has built the self context.
--
-- @param slotId string  Unique slot identifier
-- @param hooks  table   The table returned by the user script (contains
--                        hook functions: init, update, onPropertyChanged, etc.)
-- @param ctx    table   The \`self\` object built by __WrapSelf

function __StoreSlot(slotId, hooks, ctx)
    __SlotHooks[slotId] = hooks
    __Contexts[slotId]  = ctx
end


-- ═══════════════════════════════════════════════════════════════════════
-- __CallHook — Execute a named hook for a slot
-- ═══════════════════════════════════════════════════════════════════════
-- Called from TypeScript (ScriptRuntime.callHook) every frame for
-- lifecycle hooks (init, earlyUpdate, update, lateUpdate, etc.) and
-- on events (onCollisionEnter, onPropertyChanged, etc.).
--
-- The hook function receives \`self\` (the context) as its first argument,
-- followed by any extra args (e.g. \`dt\` for update, collision data, etc.).
--
-- Always returns true — errors are caught on the TypeScript side by
-- the try/catch in ScriptRuntime.callHook.
--
-- @param slotId   string    Slot identifier
-- @param hookName string    Name of the hook ("update", "init", etc.)
-- @param ...      any       Extra arguments forwarded to the hook
-- @return boolean           Always true

function __CallHook(slotId, hookName, ...)
    local hooks = __SlotHooks[slotId]
    local ctx   = __Contexts[slotId]
    if not hooks or not ctx then return true end
    local fn = hooks[hookName]
    if not fn then return true end
    fn(ctx, ...)
    return true
end


-- ═══════════════════════════════════════════════════════════════════════
-- __RemoveSlot — Clean up a slot's data when it is destroyed
-- ═══════════════════════════════════════════════════════════════════════
-- Called when an entity is unregistered or a script component is removed.
-- Frees all Lua references so the garbage collector can reclaim memory.
--
-- @param slotId string

function __RemoveSlot(slotId)
    __SlotHooks[slotId] = nil
    __Contexts[slotId]  = nil
end


-- ═══════════════════════════════════════════════════════════════════════
-- __UpdateProperty — Patch a single property in an existing context
-- ═══════════════════════════════════════════════════════════════════════
-- Called from TypeScript (ScriptInstanceManager.syncProperties) when
-- it detects that a slot's properties have changed since the last frame.
--
-- syncProperties does a JSON.stringify diff on the TS side, and for
-- each changed key calls this function to update the Lua-side copy.
-- The value is hydrated through __WrapValue (entity IDs → proxies, etc.)
-- before being stored.
--
-- After all changed keys are updated, TS calls __CallHook with
-- "onPropertyChanged" so the script can react to the change.
--
-- @param slotId  string       Slot identifier
-- @param key     string       Property name
-- @param val     any          Raw JS value
-- @param propDef table|nil    Schema definition ({ type = "entity", ... })

function __UpdateProperty(slotId, key, val, propDef)
    local ctx = __Contexts[slotId]
    if ctx and ctx.properties then
        ctx.properties[key] = __WrapValue(val, propDef)
    end
end
`,
    "sandbox_security.lua": `-- ═══════════════════════════════════════════════════════════════════════
-- sandbox_security.lua — Environment Security & Script Constants
-- ═══════════════════════════════════════════════════════════════════════
-- LOAD ORDER: 1 of 4 (loaded first, before any other sandbox module)
--
-- PURPOSE:
--   1. Remove dangerous Lua standard-library globals so user scripts
--      cannot access the file system, debug hooks, or load arbitrary code.
--   2. Define the \`Script\` constant table that maps friendly names to
--      built-in script URIs (e.g. Script.MoveToPoint → "builtin://move_to_point.lua").
--
-- WHY A SEPARATE FILE:
--   Keeping security and constants isolated makes them easy to audit.
--   Nothing in this file depends on metatables, bridges, or Vec3.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. Clear Dangerous Globals ──────────────────────────────────────
-- Lua's default environment includes modules that give full access to
-- the host file system and process.  We nil them out so user scripts
-- (which run inside this same Lua engine) can never reach them.

os       = nil   -- os.execute, os.remove, etc.
io       = nil   -- io.open, io.read, etc.
debug    = nil   -- debug.getinfo, debug.sethook, etc.
loadfile = nil   -- Load arbitrary Lua files from disk
dofile   = nil   -- Execute arbitrary Lua files from disk


-- ── 2. Script Reference Constants ───────────────────────────────────
-- The \`Script\` table lets user Lua code refer to engine-provided
-- scripts by name instead of raw URI strings.
--
-- USAGE IN LUA SCRIPTS:
--   -- Access a sibling script on the same entity:
--   local mtp = self.scripts[Script.MoveToPoint]
--   mtp.targetPoint = { 1, 2, 3 }
--
--   -- Reference a script by custom path:
--   local s = self.scripts[Script.project("my_ai")]

Script = {
    -- ── Core Movement & Camera ──────────────────────────────────────
    FirstPersonMove        = "builtin://first_person_move.lua",
    FirstPersonPhysicsMove = "builtin://first_person_physics_move.lua",
    FollowEntity           = "builtin://follow_entity.lua",
    FollowEntityPhysics    = "builtin://follow_entity_physics.lua",
    LookAtEntity           = "builtin://look_at_entity.lua",
    LookAtPoint            = "builtin://look_at_point.lua",
    MouseLook              = "builtin://mouse_look.lua",
    MoveToPoint            = "builtin://move_to_point.lua",
    OrbitCamera            = "builtin://orbit_camera.lua",
    SmoothFollow           = "builtin://smooth_follow.lua",
    SmoothLookAt           = "builtin://smooth_look_at.lua",

    -- ── Utility ─────────────────────────────────────────────────────
    Billboard              = "builtin://billboard.lua",
    RotateContinuous       = "builtin://rotate_continuous.lua",
    Bounce                 = "builtin://bounce.lua",
    WaypointPath           = "builtin://waypoint_path.lua",
    SpawnOnInterval        = "builtin://spawn_on_interval.lua",
    DestroyAfter           = "builtin://destroy_after.lua",

    -- ── Path Helpers ────────────────────────────────────────────────
    -- Generate URIs for editor or project scripts by name:
    --   Script.editor("my_tool")   → "editor://my_tool.lua"
    --   Script.project("my_logic") → "project://my_logic.lua"
    editor  = function(name) return "editor://" .. name .. ".lua" end,
    project = function(name) return "project://" .. name .. ".lua" end
}
`,
};

export const EditorScripts: Record<string, string> = {
};
