---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Built-in Script Types
-- Strongly typed property definitions for all built-in scripts.
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- First Person Movement
-- ───────────────────────────────────────────────────────────────────────

---@class FirstPersonMoveProps
---@field moveSpeed number Base walking speed (units per second). Default: 5.
---@field sprintMultiplier number Speed multiplier when holding Shift. Default: 2.
---@field flyMode boolean If true, Space/Ctrl move vertically. Default: false.

---@class FirstPersonPhysicsMoveProps
---@field moveSpeed number Target linear velocity (units/s). Default: 6.
---@field sprintMultiplier number Speed multiplier when holding Shift. Default: 1.75.
---@field maxAcceleration number Max acceleration impulse per frame. Default: 30.
---@field brakeDeceleration number Deceleration when no input. Default: 40.
---@field flyMode boolean If true, Space/Ctrl controls Y velocity. Default: false.

-- ───────────────────────────────────────────────────────────────────────
-- Following
-- ───────────────────────────────────────────────────────────────────────

---@class FollowEntityProps
---@field targetEntityId DuckEntity Target entity to follow.
---@field delay number How far behind (seconds) to trail the target. Default: 0.5.
---@field speed number Smoothing speed for position interpolation. Default: 5.
---@field offset Vec3 World-space offset from the target. Default: {0, 5, 5}.

---@class FollowEntityPhysicsProps
---@field targetEntityId DuckEntity Target entity to follow.
---@field strength number Force multiplier for the attraction. Default: 10.
---@field damping number Velocity damping factor (0..1). Lower = more damping. Default: 0.9.
---@field offset Vec3 World-space offset from the target. Default: {0, 5, 5}.

---@class SmoothFollowProps
---@field targetEntityId DuckEntity Target entity to follow.
---@field duration number Time in seconds to reach the target. Default: 1.0.
---@field easing EasingName Easing function name. Default: "quadOut".
---@field offset Vec3 World-space offset from target. Default: {0, 5, 5}.

-- ───────────────────────────────────────────────────────────────────────
-- Looking / Rotation
-- ───────────────────────────────────────────────────────────────────────

---@class LookAtEntityProps
---@field targetEntityId DuckEntity Target entity to look at.
---@field speed number Rotation smoothing speed. Default: 5.
---@field lookAtOffset Vec3 World-space offset applied to the target position. Default: {0, 0, 0}.

---@class LookAtPointProps
---@field targetPoint Vec3 World [x, y, z] coordinate to look at.

---@class SmoothLookAtProps
---@field targetEntityId DuckEntity Target entity to look at.
---@field speed number Rotation speed (higher = faster convergence). Default: 3.
---@field easing EasingName Easing function name. Default: "sineOut".
---@field offset Vec3 Offset applied to target position. Default: {0, 0, 0}.

---@class MouseLookProps
---@field sensitivityX number Horizontal mouse sensitivity. Default: 0.002.
---@field sensitivityY number Vertical mouse sensitivity. Default: 0.002.
---@field invertY boolean Invert vertical look axis. Default: false.

-- ───────────────────────────────────────────────────────────────────────
-- Movement / Utilities
-- ───────────────────────────────────────────────────────────────────────

---@class MoveToPointProps
---@field targetPoint Vec3 Destination world coordinate.
---@field duration number Travel time in seconds. Default: 2.0.
---@field easing EasingName Easing curve name. Default: "cubicInOut".
---@field delay number Delay in seconds before starting movement. Default: 0.

---@class OrbitCameraProps
---@field targetEntityId DuckEntity Central entity to orbit around.
---@field altitudeFromSurface number Distance buffer from the target's center. Default: 0.
---@field speed number Orbit speed (radians per second). Default: 0.5.
---@field orbitPlane OrbitPlane Orbit plane: "xz", "xy", or "yz". Default: "xz".
---@field initialAngle number Starting angle in radians. Default: 0.
