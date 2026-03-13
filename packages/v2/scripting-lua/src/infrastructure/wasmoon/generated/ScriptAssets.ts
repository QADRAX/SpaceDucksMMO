// Auto-generated file. Do not edit directly.
// Run 'npm run build:scripts' to regenerate.

/** Script ID constants for schema keys only. Lua uses res/scripts/system/builtin_scripts.lua */
export const BuiltInScriptIds = {
  Billboard: "builtin://billboard.lua",
  Bounce: "builtin://bounce.lua",
  DestroyAfter: "builtin://destroy_after.lua",
  FirstPersonMove: "builtin://first_person_move.lua",
  FollowEntity: "builtin://follow_entity.lua",
  LookAtEntity: "builtin://look_at_entity.lua",
  LookAtPoint: "builtin://look_at_point.lua",
  MoveToPoint: "builtin://move_to_point.lua",
  OrbitCamera: "builtin://orbit_camera.lua",
  RotateContinuous: "builtin://rotate_continuous.lua",
  SmoothFollow: "builtin://smooth_follow.lua",
  SmoothLookAt: "builtin://smooth_look_at.lua",
  SpawnOnInterval: "builtin://spawn_on_interval.lua",
  WaypointPath: "builtin://waypoint_path.lua",
} as const;

/** Built-in script content map. Keys are script URIs. */
export const BuiltInScripts: Record<string, string> = {
  "builtin://billboard.lua": `-- =======================================================================
-- billboard.lua (V2)
-- Makes the entity always face the camera entity.
-- Optionally locks rotation to the Y axis only (cylindrical billboard).
-- =======================================================================

---@class BillboardPropsV2
---@field cameraEntity EntityWrapperV2 The camera entity to face (entityRef).
---@field lockY boolean Only rotate around the Y axis. Default: false.

---@class BillboardScript : ScriptInstanceV2
---@field properties BillboardPropsV2
local Billboard = {
    schema = {
        name = "Billboard (V2)",
        description = "Entity always faces the camera. Optionally Y-locked.",
        properties = {
            cameraEntity = { type = "entityRef", default = "", description = "The camera entity to face." },
            lockY        = { type = "boolean", default = false, description = "Only rotate around the Y axis." }
        }
    }
}

function Billboard:lateUpdate(_dt)
    local cam = self.references.cameraEntity
    if not cam or not self.Scene.exists(cam.id) then return end

    local myPosRaw  = self.entity.components.transform.getPosition()
    local camPosRaw = cam.components.transform.getPosition()

    local myPos  = math.vec3.new(myPosRaw.x, myPosRaw.y, myPosRaw.z)
    local camPos = math.vec3.new(camPosRaw.x, camPosRaw.y, camPosRaw.z)

    if self.properties.lockY then
        local dir = math.vec3.new(camPos.x - myPos.x, 0, camPos.z - myPos.z)
        if dir:length() < 1e-4 then return end
        local target = myPos + dir
        self.entity.components.transform.lookAt(target)
    else
        self.entity.components.transform.lookAt(camPos)
    end
end

return Billboard
`,
  "builtin://bounce.lua": `-- =======================================================================
-- bounce.lua (V2)
-- Sinusoidal hover/bounce on a single axis.
-- Uses Engine.Time.elapsed for smooth, consistent oscillation.
-- =======================================================================

---@class BouncePropsV2
---@field axis string Axis to bounce on: 'x', 'y', or 'z'. Default: "y".
---@field amplitude number Maximum displacement in world units. Default: 0.5.
---@field frequency number Oscillation frequency in Hz. Default: 1.

---@class BounceStateV2
---@field origin Vec3V2|table Starting position at init.

---@class BounceScript : ScriptInstanceV2
---@field properties BouncePropsV2
---@field state BounceStateV2
local Bounce = {
    schema = {
        name = "Bounce (V2)",
        description = "Oscillates the entity on a single axis using a sine wave.",
        properties = {
            axis      = { type = "string",  default = "y", description = "Axis to bounce on: 'x', 'y', or 'z'." },
            amplitude = { type = "number",  default = 0.5, description = "Maximum displacement in world units." },
            frequency = { type = "number",  default = 1,   description = "Oscillation frequency in Hz." }
        }
    }
}

function Bounce:init()
    local pos = self.entity.components.transform.getLocalPosition()
    self.state = {
        origin = pos
    }
end

function Bounce:update(_dt)
    local props  = self.properties
    local origin = self.state.origin
    if not origin then return end

    local t      = Engine.Time.getElapsed()
    local offset = math.sin(t * props.frequency * 2 * math.pi) * props.amplitude

    local pos = math.vec3.new(origin.x, origin.y, origin.z)
    local axis = props.axis
    if axis == "x" then
        pos.x = pos.x + offset
    elseif axis == "z" then
        pos.z = pos.z + offset
    else
        pos.y = pos.y + offset
    end
    self.entity.components.transform.setPosition(pos)
end

return Bounce
`,
  "builtin://destroy_after.lua": `-- =======================================================================
-- destroy_after.lua (V2)
-- Self-destructs the entity after a configurable lifetime.
-- Uses Scene.destroy(entityId) which is processed after frame hooks.
-- =======================================================================

---@class DestroyAfterPropsV2
---@field lifetime number Seconds until self-destruct. Default: 5.

---@class DestroyAfterStateV2
---@field timer number Elapsed time since init.

---@class DestroyAfterScript : ScriptInstanceV2
---@field properties DestroyAfterPropsV2
---@field state DestroyAfterStateV2
local DestroyAfter = {
    schema = {
        name = "Destroy After (V2)",
        description = "Automatically destroys this entity after a given number of seconds.",
        properties = {
            lifetime = { type = "number", default = 5, description = "Seconds until self-destruct." }
        }
    }
}

function DestroyAfter:init()
    self.state = {
        timer = 0
    }
end

function DestroyAfter:update(dt)
    self.state.timer = self.state.timer + dt
    if self.state.timer >= self.properties.lifetime then
        self.Scene.destroy(self.entity.id)
    end
end

return DestroyAfter
`,
  "builtin://first_person_move.lua": `-- =======================================================================
-- first_person_move.lua (V2)
-- Kinematic WASD movement for spectator cameras, ghosts, and editors.
-- Does NOT require a physics rigid body — directly sets entity position.
-- =======================================================================

---@class FirstPersonMovePropsV2
---@field moveSpeed number Base walking speed (units per second). Default: 5.
---@field sprintMultiplier number Speed multiplier when holding Shift. Default: 2.
---@field flyMode boolean If true, Space/Ctrl move vertically. Default: false.

---@class FirstPersonMoveScript : ScriptInstanceV2
---@field properties FirstPersonMovePropsV2
local FirstPersonMove = {
    schema = {
        name = "First Person Move (Kinematic) (V2)",
        description = "WASD movement and optional flying. Moves the entity directly without physics.",
        properties = {
            moveSpeed        = { type = "number", default = 5, description = "Base walking speed (units per second)." },
            sprintMultiplier = { type = "number", default = 2, description = "Speed multiplier when holding Shift." },
            flyMode          = { type = "boolean", default = false, description = "If true, Space/Ctrl move vertically." }
        }
    }
}

function FirstPersonMove:update(dt)
    local w     = Engine.Input.isKeyPressed("w")
    local s     = Engine.Input.isKeyPressed("s")
    local a     = Engine.Input.isKeyPressed("a")
    local d     = Engine.Input.isKeyPressed("d")
    local up    = Engine.Input.isKeyPressed("space")
    local down  = Engine.Input.isKeyPressed("leftcontrol") or Engine.Input.isKeyPressed("c")
    local shift = Engine.Input.isKeyPressed("leftshift")

    local flyMode = self.properties.flyMode

    local mv = math.vec3.new(0, 0, 0)
    if w then mv.z = -1 end
    if s then mv.z = 1 end
    if a then mv.x = -1 end
    if d then mv.x = 1 end

    if flyMode then
        if up then mv.y = 1 end
        if down then mv.y = -1 end
    end

    if mv:length() <= 0 then return end
    mv = mv:normalize()

    ---@type TransformV2
    local transform = self.entity.components.transform
    local forwardRaw = transform.getForward()
    local rightRaw   = transform.getRight()
    local forward = math.vec3.new(forwardRaw.x, forwardRaw.y, forwardRaw.z)
    local right   = math.vec3.new(rightRaw.x, rightRaw.y, rightRaw.z)

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

    if worldMove:length() == 0 then return end
    worldMove = worldMove:normalize()

    local speed = self.properties.moveSpeed * (shift and self.properties.sprintMultiplier or 1)
    local curRaw = transform.getPosition()
    local cur = math.vec3.new(curRaw.x, curRaw.y, curRaw.z)

    local newPos = cur + (worldMove * (speed * dt))
    transform.setPosition(newPos.x, newPos.y, newPos.z)
end

return FirstPersonMove
`,
  "builtin://follow_entity.lua": `-- =======================================================================
-- follow_entity.lua (V2)
-- Kinematic follow with time-delayed position buffering.
-- The entity trails behind the target by a configurable delay.
-- =======================================================================

---@class FollowEntityPropsV2
---@field targetEntityId EntityWrapperV2 Target entity to follow (entityRef).
---@field delay number How far behind (seconds) to trail the target. Default: 0.5.
---@field speed number Smoothing speed for position interpolation. Default: 5.
---@field offset Vec3V2|table World-space offset from the target. Default: {0,5,5}.

---@class FollowEntityStateV2
---@field history table[] Ring buffer of { t = timestamp, pos = {x,y,z} }

---@class FollowEntityScript : ScriptInstanceV2
---@field properties FollowEntityPropsV2
---@field state FollowEntityStateV2
local FollowEntity = {
    schema = {
        name = "Follow Entity (Kinematic) (V2)",
        description = "Follows a target entity with smoothing and optional time delay.",
        properties = {
            targetEntityId = { type = "entityRef", default = "", description = "Target entity to follow." },
            delay          = { type = "number", default = 0.5, description = "How far behind (seconds) to trail the target." },
            speed          = { type = "number", default = 5, description = "Smoothing speed for position interpolation." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from the target." }
        }
    }
}

function FollowEntity:init()
    self.state = {
        history = {}
    }
end

function FollowEntity:update(dt)
    local target = self.references.targetEntityId
    if not target or not target.components then return end

    local props  = self.properties
    local delay  = props.delay
    local speed  = props.speed
    local offset = props.offset
    if not offset then return end

    local tpRaw = target.components.transform.getPosition()
    if not tpRaw then return end

    local now = Engine.Time.getElapsed()
    table.insert(self.state.history, {
        t = now,
        pos = { x = tpRaw.x, y = tpRaw.y, z = tpRaw.z }
    })

    while #self.state.history > 1 and (now - self.state.history[2].t) > delay do
        table.remove(self.state.history, 1)
    end

    local targetPos = { x = tpRaw.x, y = tpRaw.y, z = tpRaw.z }
    if delay > 0 and #self.state.history > 0 then
        targetPos = self.state.history[1].pos
    end

    local desiredX = targetPos.x + (offset.x or offset[1] or 0)
    local desiredY = targetPos.y + (offset.y or offset[2] or 0)
    local desiredZ = targetPos.z + (offset.z or offset[3] or 0)

    local cur = self.entity.components.transform.getPosition()
    local t = math.min(1, speed * dt)

    self.entity.components.transform.setPosition(
        math.ext.lerp(cur.x, desiredX, t),
        math.ext.lerp(cur.y, desiredY, t),
        math.ext.lerp(cur.z, desiredZ, t)
    )
end

return FollowEntity
`,
  "builtin://look_at_entity.lua": `-- =======================================================================
-- look_at_entity.lua (V2)
-- Smoothly rotates the entity to face a target entity.
-- Only affects rotation — does NOT move the entity.
-- =======================================================================

---@class LookAtEntityPropsV2
---@field targetEntityId EntityWrapperV2 Target entity to look at (entityRef).
---@field speed number Rotation smoothing speed. Default: 5.
---@field lookAtOffset Vec3V2|table World-space offset applied to the target position. Default: {0,0,0}.

---@class LookAtEntityScript : ScriptInstanceV2
---@field properties LookAtEntityPropsV2
local LookAtEntity = {
    schema = {
        name = "Look at Entity (V2)",
        description = "Smoothly rotates this entity to face a target entity. Rotation only.",
        properties = {
            targetEntityId = { type = "entityRef", default = "", description = "Target entity to look at." },
            speed          = { type = "number", default = 5, description = "Rotation smoothing speed." },
            lookAtOffset   = { type = "vec3", default = { 0, 0, 0 }, description = "World-space offset applied to the target position." }
        }
    }
}

function LookAtEntity:update(_dt)
    local target = self.references.targetEntityId
    if not target or not target.components then return end

    local tpRaw = target.components.transform.getPosition()
    if not tpRaw then return end

    local offset = self.properties.lookAtOffset or { x = 0, y = 0, z = 0 }
    local targetPos = math.vec3.new(
        tpRaw.x + (offset.x or 0),
        tpRaw.y + (offset.y or 0),
        tpRaw.z + (offset.z or 0)
    )
    self.entity.components.transform.lookAt(targetPos)
end

return LookAtEntity
`,
  "builtin://look_at_point.lua": `-- =======================================================================
-- look_at_point.lua (V2)
-- Continuously rotates the entity to face a fixed world-space coordinate.
-- =======================================================================

---@class LookAtPointPropsV2
---@field targetPoint Vec3V2|table World [x, y, z] coordinate to look at.

---@class LookAtPointScript : ScriptInstanceV2
---@field properties LookAtPointPropsV2
local LookAtPoint = {
    schema = {
        name = "Look at Point (V2)",
        description = "Continuously rotates this entity to face a static 3D world coordinate.",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 }, description = "World [x, y, z] coordinate to look at." }
        }
    }
}

function LookAtPoint:update(_dt)
    local targetPoint = self.properties.targetPoint
    if not targetPoint then return end

    local target = math.vec3.new(targetPoint.x, targetPoint.y, targetPoint.z)
    self.entity.components.transform.lookAt(target)
end

return LookAtPoint
`,
  "builtin://move_to_point.lua": `-- =======================================================================
-- move_to_point.lua (V2)
-- Moves the entity to a target point over a fixed duration using easing.
-- =======================================================================

---@class MoveToPointPropsV2
---@field targetPoint Vec3V2|table Destination world coordinate.
---@field duration? number Travel time in seconds. Default: 2.0.
---@field easing? string Easing curve name. Default: "cubicInOut".
---@field delay? number Delay in seconds before starting movement. Default: 0.

---@class MoveToPointStateV2
---@field startPos Vec3V2 Starting position before movement.
---@field elapsed number Elapsed time since movement start.
---@field active boolean Whether the movement is currently active.

---@class MoveToPointScript : ScriptInstanceV2
---@field properties MoveToPointPropsV2
---@field state MoveToPointStateV2
local MoveToPoint = {
    schema = {
        name = "Move to Point (V2)",
        description = "Interpolates position towards a target point.",
        properties = {
            targetPoint = { type = "vec3", default = { 0, 0, 0 }, description = "Destination point." },
            duration    = { type = "number", default = 2.0, description = "Duration in seconds." },
            easing      = { type = "string", default = "cubicInOut", description = "Easing name." },
            delay       = { type = "number", default = 0, description = "Initial delay." }
        }
    }
}

function MoveToPoint:init()
    self.state = {
        startPos = self.entity.components.transform.getLocalPosition(),
        elapsed  = 0,
        active   = true
    }
end

--- Restart if target changes
--- @param _dt number (unused, 0 for property changes)
--- @param key string Property key that changed
--- @param value any New value
function MoveToPoint:onPropertyChanged(_dt, key, value)
    if key == "targetPoint" then
        self.state.startPos = self.entity.components.transform.getLocalPosition()
        self.state.elapsed  = 0
        self.state.active   = true
    end
end

function MoveToPoint:update(dt)
    if not self.state.active then return end

    local props   = self.properties
    local target  = props.targetPoint
    if not target then return end
    local state   = self.state
    local secs    = dt
    state.elapsed = state.elapsed + secs

    local delay   = props.delay or 0
    if state.elapsed < delay then return end

    local t = (state.elapsed - delay) / math.max(0.001, props.duration)
    if t >= 1 then
        t = 1
        state.active = false
    end

    local easedFn = math.ext.easing[props.easing] or math.ext.easing.linear
    local easedT  = easedFn(t)
    local start   = state.startPos

    -- Interpolate
    local nx      = math.ext.lerp(start.x, target.x, easedT)
    local ny      = math.ext.lerp(start.y, target.y, easedT)
    local nz      = math.ext.lerp(start.z, target.z, easedT)
    self.entity.components.transform.setPosition(math.vec3.new(nx, ny, nz))
end

return MoveToPoint
`,
  "builtin://orbit_camera.lua": `-- =======================================================================
-- orbit_camera.lua (V2)
-- Orbits the entity around a target entity on a configurable plane.
-- =======================================================================

---@class OrbitCameraPropsV2
---@field targetEntityId EntityWrapperV2 Central entity to orbit around (entityRef).
---@field altitudeFromSurface number Distance buffer from target center. Default: 0.
---@field speed number Orbit speed (radians per second). Default: 0.5.
---@field orbitPlane string Orbit plane: 'xz', 'xy', or 'yz'. Default: "xz".
---@field initialAngle number Starting angle in radians. Default: 0.

---@class OrbitCameraStateV2
---@field angle number

---@class OrbitCameraScript : ScriptInstanceV2
---@field properties OrbitCameraPropsV2
---@field state OrbitCameraStateV2
local OrbitCamera = {
    schema = {
        name = "Orbit Camera (V2)",
        description = "Orbits this entity around a target at a fixed distance and speed.",
        properties = {
            targetEntityId      = { type = "entityRef", default = "", description = "Central entity to orbit around." },
            altitudeFromSurface = { type = "number", default = 0, description = "Distance buffer from the target's center." },
            speed               = { type = "number", default = 0.5, description = "Orbit speed (radians per second)." },
            orbitPlane          = { type = "string", default = "xz", description = "Orbit plane: 'xz', 'xy', or 'yz'." },
            initialAngle        = { type = "number", default = 0, description = "Starting angle in radians." }
        }
    }
}

function OrbitCamera:init()
    self.state.angle = self.properties.initialAngle or 0
end

function OrbitCamera:update(dt)
    local target = self.references.targetEntityId
    if not target or not target.components then return end

    local props = self.properties
    local altitudeFromSurface = props.altitudeFromSurface
    local speed = props.speed
    local orbitPlane = props.orbitPlane

    if not self.state.angle then
        self.state.angle = props.initialAngle
    end

    local orbitDistance = 1 + altitudeFromSurface
    self.state.angle = self.state.angle + (speed * dt)

    local a = self.state.angle
    local tpRaw = target.components.transform.getPosition()
    if not tpRaw then return end

    local offsetX, offsetY, offsetZ = 0, 0, 0
    if orbitPlane == "xz" then
        offsetX = math.cos(a) * orbitDistance
        offsetZ = math.sin(a) * orbitDistance
    elseif orbitPlane == "xy" then
        offsetX = math.cos(a) * orbitDistance
        offsetY = math.sin(a) * orbitDistance
    elseif orbitPlane == "yz" then
        offsetY = math.cos(a) * orbitDistance
        offsetZ = math.sin(a) * orbitDistance
    end

    self.entity.components.transform.setPosition(
        tpRaw.x + offsetX,
        tpRaw.y + offsetY,
        tpRaw.z + offsetZ
    )
end

return OrbitCamera
`,
  "builtin://rotate_continuous.lua": `-- =======================================================================
-- rotate_continuous.lua (V2)
-- Continuously rotates the entity at a constant speed on each axis.
-- Speed is specified in degrees per second for each axis.
-- =======================================================================

---@class RotateContinuousPropsV2
---@field speedX number Rotation speed around X axis (degrees/sec). Default: 0.
---@field speedY number Rotation speed around Y axis (degrees/sec). Default: 45.
---@field speedZ number Rotation speed around Z axis (degrees/sec). Default: 0.

---@class RotateContinuousScript : ScriptInstanceV2
---@field properties RotateContinuousPropsV2
local RotateContinuous = {
    schema = {
        name = "Rotate Continuous (V2)",
        description = "Spins the entity at a constant rate in degrees per second.",
        properties = {
            speedX = { type = "number", default = 0,  description = "Rotation speed around the X axis (degrees/sec)." },
            speedY = { type = "number", default = 45, description = "Rotation speed around the Y axis (degrees/sec)." },
            speedZ = { type = "number", default = 0,  description = "Rotation speed around the Z axis (degrees/sec)." }
        }
    }
}

function RotateContinuous:update(dt)
    local props = self.properties
    local toRad = math.pi / 180
    local rot = self.entity.components.transform.getRotation()

    rot.x = rot.x + props.speedX * toRad * dt
    rot.y = rot.y + props.speedY * toRad * dt
    rot.z = rot.z + props.speedZ * toRad * dt

    self.entity.components.transform.setRotation(rot)
end

return RotateContinuous
`,
  "builtin://smooth_follow.lua": `-- =======================================================================
-- smooth_follow.lua (V2)
-- Eased follow with configurable curve and arrival behavior.
-- =======================================================================

---@class SmoothFollowPropsV2
---@field targetEntityId EntityWrapperV2 Target entity to follow (entityRef).
---@field duration number Time in seconds to reach the target. Default: 1.0.
---@field easing string Easing function: linear, quadOut, cubicInOut, etc. Default: "quadOut".
---@field offset Vec3V2|table World-space offset from target. Default: {0,5,5}.

---@class SmoothFollowStateV2
---@field startPos Vec3V2|table|nil
---@field elapsed number
---@field lastGoal Vec3V2|table|nil

---@class SmoothFollowScript : ScriptInstanceV2
---@field properties SmoothFollowPropsV2
---@field state SmoothFollowStateV2
local SmoothFollow = {
    schema = {
        name = "Smooth Follow (Eased) (V2)",
        description = "Follows a target using configurable easing curves for cinematic motion.",
        properties = {
            targetEntityId = { type = "entityRef", default = "", description = "Target entity to follow." },
            duration       = { type = "number", default = 1.0, description = "Time in seconds to reach the target." },
            easing         = { type = "string", default = "quadOut", description = "Easing function." },
            offset         = { type = "vec3", default = { 0, 5, 5 }, description = "World-space offset from target." }
        }
    }
}

function SmoothFollow:init()
    self.state = {
        startPos = nil,
        elapsed  = 0,
        lastGoal = nil
    }
end

function SmoothFollow:update(dt)
    local target = self.references.targetEntityId
    if not target or not target.components then return end

    local props    = self.properties
    local duration = math.max(0.01, props.duration)
    local offset   = props.offset
    if not offset then return end

    local tpRaw = target.components.transform.getPosition()
    if not tpRaw then return end

    local ox = offset.x or offset[1] or 0
    local oy = offset.y or offset[2] or 0
    local oz = offset.z or offset[3] or 0
    local goal = {
        x = tpRaw.x + ox,
        y = tpRaw.y + oy,
        z = tpRaw.z + oz
    }

    local last = self.state.lastGoal
    if not last or not self.state.startPos then
        self.state.startPos = self.entity.components.transform.getPosition()
        self.state.elapsed  = 0
        self.state.lastGoal = goal
    else
        local dist = math.sqrt(
            (goal.x - last.x) ^ 2 + (goal.y - last.y) ^ 2 + (goal.z - last.z) ^ 2
        )
        if dist > 0.01 then
            self.state.startPos = self.entity.components.transform.getPosition()
            self.state.elapsed  = 0
            self.state.lastGoal = goal
        end
    end

    self.state.elapsed = self.state.elapsed + dt

    local raw = math.ext.clamp(self.state.elapsed / duration, 0, 1)
    local t   = math.ext.ease(props.easing or "quadOut", raw)

    local sp = self.state.startPos
    if not sp then return end

    self.entity.components.transform.setPosition(
        math.ext.lerp(sp.x, goal.x, t),
        math.ext.lerp(sp.y, goal.y, t),
        math.ext.lerp(sp.z, goal.z, t)
    )
end

return SmoothFollow
`,
  "builtin://smooth_look_at.lua": `-- =======================================================================
-- smooth_look_at.lua (V2)
-- Eased rotation towards a target entity.
-- =======================================================================

---@param a number
---@param b number
---@param t number
---@return number
local function lerpAngle(a, b, t)
    local diff = b - a
    while diff > math.pi do diff = diff - 2 * math.pi end
    while diff < -math.pi do diff = diff + 2 * math.pi end
    return a + diff * t
end

---@class SmoothLookAtPropsV2
---@field targetEntityId EntityWrapperV2 Target entity to look at (entityRef).
---@field speed number Rotation speed. Default: 3.
---@field easing string Easing function. Default: "sineOut".
---@field offset Vec3V2|table Offset applied to target position. Default: {0,0,0}.

---@class SmoothLookAtScript : ScriptInstanceV2
---@field properties SmoothLookAtPropsV2
local SmoothLookAt = {
    schema = {
        name = "Smooth Look At (V2)",
        description = "Smoothly rotates to face a target using easing curves.",
        properties = {
            targetEntityId = { type = "entityRef", default = "", description = "Target entity to look at." },
            speed          = { type = "number", default = 3, description = "Rotation speed." },
            easing         = { type = "string", default = "sineOut", description = "Easing function." },
            offset         = { type = "vec3", default = { 0, 0, 0 }, description = "Offset applied to target position." }
        }
    }
}

function SmoothLookAt:update(dt)
    local target = self.references.targetEntityId
    if not target or not target.components then return end

    local props  = self.properties
    local speed  = props.speed or 3
    local offset = props.offset

    local tpRaw = target.components.transform.getPosition()
    if not tpRaw then return end

    local ox = offset and (offset.x or offset[1] or 0) or 0
    local oy = offset and (offset.y or offset[2] or 0) or 0
    local oz = offset and (offset.z or offset[3] or 0) or 0

    local desiredX = tpRaw.x + ox
    local desiredY = tpRaw.y + oy
    local desiredZ = tpRaw.z + oz

    local cur = self.entity.components.transform.getPosition()
    local dirX = desiredX - cur.x
    local dirY = desiredY - cur.y
    local dirZ = desiredZ - cur.z

    local desiredYaw     = math.atan(dirX, dirZ)
    local horizontalDist = math.sqrt(dirX * dirX + dirZ * dirZ)
    local desiredPitch   = -math.atan(dirY, horizontalDist)

    local rot = self.entity.components.transform.getRotation()

    local raw = math.ext.clamp(speed * dt, 0, 1)
    local t   = math.ext.ease(props.easing or "sineOut", raw)

    local newPitch = lerpAngle(rot.x, desiredPitch, t)
    local newYaw   = lerpAngle(rot.y, desiredYaw, t)

    self.entity.components.transform.setRotation(newPitch, newYaw, 0)
end

return SmoothLookAt
`,
  "builtin://spawn_on_interval.lua": `-- =======================================================================
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
`,
  "builtin://waypoint_path.lua": `-- =======================================================================
-- waypoint_path.lua (V2)
-- Follows a list of waypoint entities by driving a sibling move_to_point script.
-- =======================================================================

---@class WaypointPathPropsV2
---@field speed? number Movement speed in units/sec. Default: 3.
---@field loop? boolean If true, loops back to first waypoint. Default: true.
---@field waypoints? EntityWrapperV2[] Ordered list of waypoint entities.
---@field easing? string Easing curve forwarded to MoveToPoint. Default: "cubicInOut".
---@field arrivalThreshold? number Distance at which the waypoint is considered reached. Default: 0.15.

---@class WaypointPathStateV2
---@field index number Current target waypoint index (1-based).
---@field waiting boolean True when waiting for MoveToPoint to reach target.

---@class WaypointPathScript : ScriptInstanceV2
---@field properties WaypointPathPropsV2
---@field state WaypointPathStateV2
local WaypointPath = {
    schema = {
        name = "Waypoint Path (V2)",
        description = "Sequences movement through entity waypoints.",
        properties = {
            speed            = { type = "number", default = 3, description = "Units per second." },
            loop             = { type = "boolean", default = true, description = "Loop back to start." },
            waypoints        = { type = "entityRefArray", default = {}, description = "Entities to follow." },
            easing           = { type = "string", default = "cubicInOut", description = "Forwarded easing." },
            arrivalThreshold = { type = "number", default = 0.2, description = "Distance threshold." }
        }
    }
}

function WaypointPath:init()
    self.state = {
        index   = 1,
        waiting = false
    }
end

function WaypointPath:update(dt)
    local waypoints = self.references.waypoints
    if not waypoints or #waypoints == 0 then return end

    local state = self.state
    local targetEntity = waypoints[state.index]
    if not targetEntity then return end

    -- Check if we arrived at target
    -- Note: Waypoint Path uses WORLD position for distance check because waypoints might be parented elsewhere
    local posRaw = self.entity.components.transform.getPosition()
    local targetRaw = targetEntity.components.transform.getPosition()
    
    local pos = math.vec3.new(posRaw.x, posRaw.y, posRaw.z)
    local target = math.vec3.new(targetRaw.x, targetRaw.y, targetRaw.z)
    local dist = pos:distanceTo(target)

    local props  = self.properties

    if dist < (props.arrivalThreshold or 0.2) then
        -- Arrived! Advance index
        local nextIdx = state.index + 1
        if nextIdx > #waypoints then
            if props.loop then
                nextIdx = 1
            else
                return     -- finished
            end
        end
        state.index   = nextIdx
        state.waiting = false
        -- Re-fetch targetEntity for the new index before driving MoveToPoint
        targetEntity = waypoints[state.index]
        if not targetEntity then return end
        targetRaw = targetEntity.components.transform.getPosition()
        target = math.vec3.new(targetRaw.x, targetRaw.y, targetRaw.z)
        dist = pos:distanceTo(target)
    end

    -- Drive sibling move_to_point if not already moving towards CURRENT target
    if not state.waiting then
        -- We just changed target or just started
        local duration = dist / math.max(0.1, props.speed)

        -- Drive the sibling script
        -- IMPORTANT: MoveToPoint expects LOCAL coordinates if it's going to use setPosition
        -- However, Built-in scripts often assume they are at root OR they target world coords.
        -- If mover is not at root, we'd need to convert world target to local target.
        -- For simplicity, let's assume mover is at root for now or MoveToPoint handles world? 
        -- No, MoveToPoint uses setPosition (local).
        
        -- Logic: If we want to reach a world point via local movement:
        -- localTarget = moverParentInv * worldTarget
        
        -- For built-in simplicity, let's assume world==local for now or add a setWorldPosition bridge.
        self.entity.components.script.setProperty(BuiltInScripts.MoveToPoint, "targetPoint", target)
        self.entity.components.script.setProperty(BuiltInScripts.MoveToPoint, "duration", duration)
        self.entity.components.script.setProperty(BuiltInScripts.MoveToPoint, "easing",
            props.easing or "cubicInOut")

        state.waiting = true
    end
end

return WaypointPath
`,
};

export const SystemScripts: Record<string, string> = {
  "builtin_scripts": `-- Auto-generated. Run 'npm run build:scripts' to regenerate.
-- Built-in script ID constants. Lua source of truth (not injected from TS).

BuiltInScripts = {
    Billboard = "builtin://billboard.lua",
    Bounce = "builtin://bounce.lua",
    DestroyAfter = "builtin://destroy_after.lua",
    FirstPersonMove = "builtin://first_person_move.lua",
    FollowEntity = "builtin://follow_entity.lua",
    LookAtEntity = "builtin://look_at_entity.lua",
    LookAtPoint = "builtin://look_at_point.lua",
    MoveToPoint = "builtin://move_to_point.lua",
    OrbitCamera = "builtin://orbit_camera.lua",
    RotateContinuous = "builtin://rotate_continuous.lua",
    SmoothFollow = "builtin://smooth_follow.lua",
    SmoothLookAt = "builtin://smooth_look_at.lua",
    SpawnOnInterval = "builtin://spawn_on_interval.lua",
    WaypointPath = "builtin://waypoint_path.lua",
}
`,
  "math_ext": `-- Lua math extensions for the scripting sandbox.
-- Provides vec3 as a callable table with operator overloading + static helpers,
-- and math.ext utilities (lerp, clamp, easing functions, etc.).
---@diagnostic disable: duplicate-set-field


--- Vec3 metatable with arithmetic operators and methods.
local Vec3MT = {}
Vec3MT.__index = Vec3MT

function Vec3MT:length()
  return math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z)
end

function Vec3MT:normalize()
  local len = self:length()
  if len == 0 then return math3.vec3(0, 0, 0) end
  return math3.vec3(self.x / len, self.y / len, self.z / len)
end

function Vec3MT:dot(other)
  return self.x * other.x + self.y * other.y + self.z * other.z
end

function Vec3MT:cross(other)
  return math3.vec3(
    self.y * other.z - self.z * other.y,
    self.z * other.x - self.x * other.z,
    self.x * other.y - self.y * other.x
  )
end

function Vec3MT:distanceTo(other)
  local dx = self.x - other.x
  local dy = self.y - other.y
  local dz = self.z - other.z
  return math.sqrt(dx * dx + dy * dy + dz * dz)
end

function Vec3MT:clone()
  return math3.vec3(self.x, self.y, self.z)
end

function Vec3MT:lerp(other, t)
  return math3.vec3(
    self.x + (other.x - self.x) * t,
    self.y + (other.y - self.y) * t,
    self.z + (other.z - self.z) * t
  )
end

function Vec3MT:toArray()
  return { self.x, self.y, self.z }
end

Vec3MT.__add      = function(a, b) return math3.vec3(a.x + b.x, a.y + b.y, a.z + b.z) end
Vec3MT.__sub      = function(a, b) return math3.vec3(a.x - b.x, a.y - b.y, a.z - b.z) end
Vec3MT.__mul      = function(a, b)
  if type(a) == "number" then return math3.vec3(a * b.x, a * b.y, a * b.z) end
  if type(b) == "number" then return math3.vec3(a.x * b, a.y * b, a.z * b) end
  return math3.vec3(a.x * b.x, a.y * b.y, a.z * b.z)
end
Vec3MT.__unm      = function(a) return math3.vec3(-a.x, -a.y, -a.z) end
Vec3MT.__eq       = function(a, b) return a.x == b.x and a.y == b.y and a.z == b.z end
Vec3MT.__tostring = function(v)
  return string.format("vec3(%.4f, %.4f, %.4f)", v.x, v.y, v.z)
end

--- Internal constructor: creates a Vec3 instance.
local function newVec3(x, y, z)
  return setmetatable({ x = x or 0, y = y or 0, z = z or 0 }, Vec3MT)
end

--- Expose math.vec3 as a callable table so we can attach static helpers.
--- Scripts call \`math.vec3(x, y, z)\` via __call, and access statics like
--- \`math.vec3.zero()\` as regular table fields.
math3 = {
  vec3 = setmetatable({
    -- Static constructors
    new     = newVec3,
    zero    = function() return newVec3(0, 0, 0) end,
    one     = function() return newVec3(1, 1, 1) end,
    up      = function() return newVec3(0, 1, 0) end,
    forward = function() return newVec3(0, 0, -1) end,
    right   = function() return newVec3(1, 0, 0) end,
  }, {
    -- Calling math.vec3(x, y, z) creates a new Vec3
    __call = function(_, x, y, z) return newVec3(x, y, z) end,
  }),
}

-- Also alias on math table for backward compat (math.vec3 = math3.vec3)
math.vec3 = math3.vec3

--- Math extensions.
math.ext = {}

function math.ext.lerp(a, b, t) return a + (b - a) * t end

function math.ext.clamp(v, lo, hi) return math.max(lo, math.min(hi, v)) end

function math.ext.inverseLerp(a, b, v) return (v - a) / (b - a) end

function math.ext.sign(x) return x > 0 and 1 or (x < 0 and -1 or 0) end

function math.ext.remap(iLo, iHi, oLo, oHi, v)
  local t = math.ext.inverseLerp(iLo, iHi, v)
  return math.ext.lerp(oLo, oHi, t)
end

function math.ext.moveTowards(current, target, maxDelta)
  local diff = target - current
  if math.abs(diff) <= maxDelta then return target end
  return current + math.ext.sign(diff) * maxDelta
end

--- Easing functions.
math.ext.easing = {}

--- Generic easing helper.
--- @param name string  Easing function name (e.g. "cubicInOut").
--- @param t number     Normalized time [0, 1].
--- @return number      Eased value.
function math.ext.ease(name, t)
  local fn = math.ext.easing[name]
  if not fn then
    -- Fallback to linear if easing function not found
    return t
  end
  return fn(t)
end

function math.ext.easing.linear(t) return t end

function math.ext.easing.smoothstep(t) return t * t * (3 - 2 * t) end

function math.ext.easing.quadIn(t) return t * t end

function math.ext.easing.quadOut(t) return t * (2 - t) end

function math.ext.easing.cubicIn(t) return t * t * t end

function math.ext.easing.cubicOut(t)
  local u = 1 - t; return 1 - u * u * u
end

function math.ext.easing.sineIn(t) return 1 - math.cos(t * math.pi / 2) end

function math.ext.easing.sineOut(t) return math.sin(t * math.pi / 2) end

function math.ext.easing.sineInOut(t)
  return -(math.cos(math.pi * t) - 1) / 2
end

function math.ext.easing.cubicInOut(t)
  if t < 0.5 then
    return 4 * t * t * t
  else
    local f = ((2 * t) - 2)
    return 0.5 * f * f * f + 1
  end
end

function math.ext.easing.bounceOut(t)
  local n1 = 7.5625
  local d1 = 2.75

  if t < 1 / d1 then
    return n1 * t * t
  elseif t < 2 / d1 then
    t = t - 1.5 / d1
    return n1 * t * t + 0.75
  elseif t < 2.5 / d1 then
    t = t - 2.25 / d1
    return n1 * t * t + 0.9375
  else
    t = t - 2.625 / d1
    return n1 * t * t + 0.984375
  end
end
`,
  "sandbox_metatables": `--   self.<bridge>    → bridge API (e.g. self.Transform, self.Scene, …)

---@diagnostic disable: undefined-global
---@diagnostic disable: lowercase-global

-- Slot contexts keyed by slotKey → { id, self, bridges }
__Contexts = {}
-- Slot hooks keyed by slotKey → { init = fn, update = fn, ... }
__SlotHooks = {}
-- Dirty property keys keyed by slotKey → { key = true, ... }
__DirtyProperties = {}

-- Properties proxy metatable.
-- Forwards reads straight to the underlying raw table.
-- Tracks any write as a dirty key so TypeScript can flush it back to ECS.
__PropertiesMT = {
  __index = function(t, k)
    return rawget(t, '__raw')[k]
  end,
  __newindex = function(t, k, v)
    rawget(t, '__raw')[k] = v
    local slotKey = rawget(t, '__slotKey')
    if slotKey then
      if not __DirtyProperties[slotKey] then
        __DirtyProperties[slotKey] = {}
      end
      __DirtyProperties[slotKey][k] = v
    end
  end,
}

--- Creates a new properties proxy for a slot.
--- @param slotKey string
--- @param rawProps table  Raw properties table (ECS-synced values)
--- @return table  Proxy table; reads come from rawProps, writes mark dirty
function __MakePropertiesProxy(slotKey, rawProps)
  local proxy = {}
  rawset(proxy, '__raw', rawProps)
  rawset(proxy, '__slotKey', slotKey)
  setmetatable(proxy, __PropertiesMT)
  return proxy
end

__EntityComponentsMT = {
  __index = function(t, k)
    -- Normalize the key to match injected TypeScript bridge names (e.g. 'transform' -> 'Transform')
    local bridgeName = k:gsub("^%l", string.upper)
    if k == "script" then
      bridgeName = "Script" 
    end

    local slotKey = rawget(t, '__slotKey')
    local ctx = __Contexts[slotKey]
    if not ctx then return nil end
    
    local entityId = rawget(t, '__entityId')
    local cachedBridges = rawget(t, '__cachedBridges')
    if cachedBridges[bridgeName] then return cachedBridges[bridgeName] end

    local bridge = ctx.bridges[bridgeName]
    if not bridge then
      -- Fallback: Create a generic proxy that delegates to host generic getters/setters
      local genericProxy = {}
      setmetatable(genericProxy, {
        __index = function(_, propName)
          return __GetResourceProperty(entityId, k, propName)
        end,
        __newindex = function(_, propName, propValue)
          __SetResourceProperty(entityId, k, propName, propValue)
        end
      })
      cachedBridges[bridgeName] = genericProxy
      return genericProxy
    end

    -- Return scoped bridge from TypeScript (no Lua proxy). pairs(bridge) + Lua wrappers
    -- triggers wasmoon "Cannot read properties of null (reading 'then')" when crossing Lua↔JS.
    if ctx.getScopedBridge then
      local scoped = ctx.getScopedBridge(slotKey, tostring(entityId), bridgeName)
      if scoped then
        cachedBridges[bridgeName] = scoped
        return scoped
      end
    end

    -- Fallback: build proxy in Lua (may fail for some bridges)
    local bridgeProxy = {}
    for funcName, fn in pairs(bridge) do
      if type(fn) == "function" then
        bridgeProxy[funcName] = function(...)
          return fn(entityId, ...)
        end
      end
    end
    cachedBridges[bridgeName] = bridgeProxy
    return bridgeProxy
  end
}

__EntityMT = {
  __index = function(t, k)
    if k == 'id' then return rawget(t, '__id') end
    if k == 'components' then
      local proxy = rawget(t, '__componentsProxy')
      if not proxy then
        proxy = {
          __entityId = rawget(t, '__id'),
          __slotKey = rawget(t, '__slotKey'),
          __cachedBridges = {}
        }
        setmetatable(proxy, __EntityComponentsMT)
        rawset(t, '__componentsProxy', proxy)
      end
      return proxy
    end
    return nil
  end
}

function __WrapEntity(slotKey, entityId)
  local e = { __id = entityId, __slotKey = slotKey }
  setmetatable(e, __EntityMT)
  return e
end

__ReferencesMT = {
  __index = function(t, k)
    local ctx = __Contexts[rawget(t, '__slotKey')]
    if not ctx then return nil end
    
    local val = rawget(ctx.properties, '__raw')[k]
    if val == nil then return nil end
    
    local schemaType = ctx.schemaTypes[k]
    if not schemaType then return val end
    
    if schemaType == "entityRef" or schemaType == "prefabRef" then
      return __WrapEntity(rawget(t, '__slotKey'), val)
    elseif schemaType == "entityRefArray" then
      local arr = {}
      for i, id in ipairs(val) do
        arr[i] = __WrapEntity(rawget(t, '__slotKey'), id)
      end
      return arr
    elseif schemaType == "entityComponentRef" then
      local compType = ctx.schemaComponentTypes[k]
      local e = __WrapEntity(rawget(t, '__slotKey'), val)
      return e.components[compType]
    elseif schemaType == "entityComponentRefArray" then
      local compType = ctx.schemaComponentTypes[k]
      local arr = {}
      for i, id in ipairs(val) do
         local e = __WrapEntity(rawget(t, '__slotKey'), id)
         arr[i] = e.components[compType]
      end
      return arr
    end
    
    return val
  end
}

-- Self metatable: gives access to entity wrapper, references proxy, and context fields
__SelfMT = {
  __index = function(t, k)
    local slotKey = rawget(t, '__slotKey')
    local ctx = __Contexts[slotKey]
    if not ctx then return nil end

    if k == 'entity' then
      local ent = rawget(t, '__entityProxy')
      if not ent then
        ent = __WrapEntity(slotKey, ctx.id)
        rawset(t, '__entityProxy', ent)
      end
      return ent
    elseif k == 'references' then
      local refs = rawget(t, '__referencesProxy')
      if not refs then
        refs = { __slotKey = slotKey }
        setmetatable(refs, __ReferencesMT)
        rawset(t, '__referencesProxy', refs)
      end
      return refs
    end

    -- Bridge shortcuts (self.Transform, self.Scene, etc.) — use scoped bridge when available.
    -- Only call getScopedBridge for bridge names; returning null from JS can trigger wasmoon errors.
    local bridge = ctx.bridges[k]
    if bridge ~= nil and ctx.getScopedBridge then
      local scoped = ctx.getScopedBridge(slotKey, ctx.id, k)
      if scoped then return scoped end
    end
    if bridge ~= nil then return bridge end

    return ctx[k]
  end,
  __newindex = function(t, k, v)
    rawset(t, k, v)
  end,
}
`,
  "sandbox_runtime": `-- Lua sandbox runtime helpers.
-- Defines: __WrapSelf, __CallHook, __UpdateProperty,
--          __FlushDirtyProperties, __DestroySlot, __LoadSlot.
-- These are the core runtime functions called from TypeScript.
-- __ReportScriptError is injected by the TypeScript sandbox host.
---@diagnostic disable: undefined-global

--- Creates a self proxy for a script slot.
--- @param slotKey string  Unique slot identifier (entityId::scriptId)
--- @param id string       Entity ID
--- @param rawProps table  Raw properties table (values synced from ECS)
--- @param bridges table   Bridge API table (name → api object)
--- @param schemaTypes table?  Map of property keys to schema type strings
--- @param schemaComponentTypes table? Map of property keys to component type strings
--- @param getScopedBridge function? (slotKey, entityId, bridgeName) -> scoped bridge (JS object)
--- @return table  self proxy
function __WrapSelf(slotKey, id, rawProps, bridges, schemaTypes, schemaComponentTypes, getScopedBridge)
  local ctx = {
    id = id,
    state = {},
    properties = __MakePropertiesProxy(slotKey, rawProps),
    bridges = bridges or {},
    schemaTypes = schemaTypes or {},
    schemaComponentTypes = schemaComponentTypes or {},
    getScopedBridge = getScopedBridge or nil,
  }
  __Contexts[slotKey] = ctx

  local self = {}
  rawset(self, '__slotKey', slotKey)
  setmetatable(self, __SelfMT)

  ctx.self = self
  return self
end

--- Loads a user script, extracts its lifecycle hooks, and registers them.
---
--- Supports two hook declaration styles:
---   1. Return table:   \`return { init = function(self) ... end }\`
---   2. Top-level fns:  \`function init(self) ... end\`
---
--- Hooks are stored in \`__SlotHooks[slotKey]\`.
--- Globals declared by the script in style 2 are removed after capture.
---
--- @param slotKey string  Slot identifier
--- @param source string   Raw Lua source of the user script
--- @return boolean  true on success, false on compile/runtime error
function __LoadSlot(slotKey, source)
  local hookNames = {
    "init", "onEnable", "earlyUpdate", "update", "lateUpdate",
    "onDrawGizmos", "onCollisionEnter", "onCollisionExit",
    "onPropertyChanged", "onDisable", "onDestroy"
  }

  local fn, loadErr = load(source, "@" .. tostring(slotKey))
  if not fn then
    if __ReportScriptError then
      __ReportScriptError(tostring(slotKey), "compile", tostring(loadErr), nil)
    end
    return false
  end

  local ok, result = pcall(fn)
  if not ok then
    if __ReportScriptError then
      __ReportScriptError(tostring(slotKey), "load", tostring(result), nil)
    end
    return false
  end

  local hooks = {}
  if type(result) == "table" then
    -- Style 1: script returned { init = fn, update = fn, ... }
    for _, name in ipairs(hookNames) do
      if type(result[name]) == "function" then
        hooks[name] = result[name]
      end
    end
  else
    -- Style 2: script defined top-level named functions
    for _, name in ipairs(hookNames) do
      local g = _G[name]
      if type(g) == "function" then
        hooks[name] = g
        _G[name] = nil -- clean up to avoid polluting global namespace
      end
    end
  end

  __SlotHooks[slotKey] = hooks
  return true
end

--- Calls a lifecycle hook on a slot.
--- Returns true on success or if hook is not declared; false on Lua error.
--- @param slotKey string
--- @param hookName string
--- @param dt number
--- @return boolean
function __CallHook(slotKey, hookName, dt, ...)
  local hooks = __SlotHooks[slotKey]
  if not hooks then return true end

  local fn = hooks[hookName]
  if not fn then return true end

  local ctx = __Contexts[slotKey]
  if not ctx then return false end

  local ok, errMsg = pcall(fn, ctx.self, dt, ...)
  if not ok then
    if __ReportScriptError then
      __ReportScriptError(tostring(slotKey), "hook", tostring(errMsg), hookName)
    end
    return false
  end
  return true
end

--- Pushes a single updated property into a slot.
--- Writes directly to the raw table, bypassing dirty tracking (ECS → Lua direction).
--- @param slotKey string
--- @param key string
--- @param value any
function __UpdateProperty(slotKey, key, value)
  local ctx = __Contexts[slotKey]
  if not ctx then return end
  rawget(ctx.properties, '__raw')[key] = value
end

--- Returns and clears the dirty property keys for a slot.
--- @param slotKey string
--- @return table|nil  { key = true, … } or nil if nothing is dirty
function __FlushDirtyProperties(slotKey)
  local dirty = __DirtyProperties[slotKey]
  __DirtyProperties[slotKey] = nil
  return dirty
end

--- Destroys a slot's context, hooks and dirty state.
--- @param slotKey string
function __DestroySlot(slotKey)
  __Contexts[slotKey] = nil
  __SlotHooks[slotKey] = nil
  __DirtyProperties[slotKey] = nil
end
`,
  "sandbox_security": `-- Lua sandbox security module.
-- Removes dangerous globals (os, io, debug, loadfile, dofile, etc.)
-- to prevent scripts from accessing the host filesystem or process.
--
-- NOTE: rawget / rawset / rawequal / rawlen are intentionally KEPT.
-- They are used in the scripting runtime's metatable infrastructure
-- (property proxy, __SelfMT, etc.) and are not dangerous in this context.

os = nil
io = nil
debug = nil
loadfile = nil
dofile = nil
collectgarbage = nil
`,
};
