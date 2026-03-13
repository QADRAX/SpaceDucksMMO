---@meta
-- ═══════════════════════════════════════════════════════════════════════
-- DuckEngine Lua API — Time
-- Global `time` table for frame timing and elapsed time.
-- ═══════════════════════════════════════════════════════════════════════

---@class TimeAPI
---The global time API. All values are in **seconds** unless noted.
time = {}

---Returns the time elapsed since the last frame in **seconds** (scaled by time scale).
---This is the same `dt` value passed to `update(self, dt)`, multiplied by the time scale.
---@return number dt Frame delta time in seconds (scaled).
function time.getDelta() end

---Returns the raw unscaled delta time since the last frame in **seconds**.
---Useful for UI or pause-menu logic that should ignore time scale.
---@return number dt Unscaled frame delta time in seconds.
function time.getUnscaledDelta() end

---Returns the total elapsed time since the scene started playing, in **seconds**.
---Accumulated each frame as `elapsed += dt * scale`.
---@return number elapsed Total elapsed time in seconds since scene start.
function time.getElapsed() end

---Returns the total number of frames since the scene started.
---@return number count Frame count (integer).
function time.getFrameCount() end

---Returns the current time scale (default 1.0). 0 = paused.
---@return number scale Current time scale.
function time.getScale() end

---Sets the time scale. 0 pauses time, 1 is normal speed, 2 is double speed.
---Affects `time.getDelta()` and `time.getElapsed()` accumulation.
---@param scale number New time scale (clamped to >= 0).
function time.setScale(scale) end

---Returns the current wall-clock time in seconds (Date.now() / 1000).
---@return number timestamp Current wall-clock time.
function time.getTime() end

---Alias for `time.getTime()`.
---@return number timestamp Current wall-clock time.
function time.now() end
