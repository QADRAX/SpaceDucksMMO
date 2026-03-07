/**
 * Lua sandbox security module.
 *
 * Removes dangerous globals (os, io, debug, loadfile, dofile, etc.)
 * to prevent scripts from accessing the host filesystem or process.
 */
export const SANDBOX_SECURITY_LUA = `
-- Remove dangerous globals
os = nil
io = nil
debug = nil
loadfile = nil
dofile = nil
rawget = nil
rawset = nil
rawequal = nil
rawlen = nil
collectgarbage = nil
`;
