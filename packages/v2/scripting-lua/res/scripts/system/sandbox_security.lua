-- Lua sandbox security module.
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
