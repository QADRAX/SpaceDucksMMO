---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Time
-- Global `time` table for frame timing and elapsed time.
-- ═══════════════════════════════════════════════════════════════════════

---@class TimeAPI
---The global time API. All values are in **milliseconds**.
time = {}

---Returns the time elapsed since the last frame in **milliseconds**.
---This is the same `dt` value passed to `update(self, dt)`.
---
---Typical usage for time-based movement:
---```lua
---local secs = time.dt() / 1000
---local distance = speed * secs
---```
---@return number dt Frame delta time in milliseconds.
function time.dt() end

---Returns the total elapsed time since the scene started playing, in **milliseconds**.
---Useful for time-based animations, delays, and periodic effects.
---
---Example:
---```lua
---local elapsed = time.now()
---if elapsed > 3000 then -- 3 seconds have passed
---    scene.fireEvent("GameStarted")
---end
---```
---@return number elapsed Total elapsed time in milliseconds since scene start.
function time.now() end
