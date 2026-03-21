-- E2E test: Component bridge for skin (rigRootEntityId) and animator (playback fields).
-- Requires entity with: customGeometry, skin, animator (animator may include one clip ref from host).

---@class ComponentBridgeSkinAnimatorPropsV2
---@field meshSetOk boolean
---@field rigRootSetOk boolean
---@field rigRootRead string
---@field speedSetOk boolean
---@field playingSetOk boolean
---@field timeSetOk boolean
---@field activeIndexSetOk boolean
---@field speedReadBack number
---@field playingReadBack boolean
---@field timeReadBack number

---@class ComponentBridgeSkinAnimatorScript : ScriptInstanceV2
---@field properties ComponentBridgeSkinAnimatorPropsV2

return {
  ---@param self ComponentBridgeSkinAnimatorScript
  init = function(self)
    local eid = tostring(self.entity.id)

    self.properties.meshSetOk = self.Component.setResource(
      eid, 'customGeometry', 'mesh', 'meshes/test_cube'
    )

    -- Rig root = this entity (same id as script host) for the test harness
    self.properties.rigRootSetOk = self.Component.setField(eid, 'skin', 'rigRootEntityId', eid)

    local rr = self.Component.getField(eid, 'skin', 'rigRootEntityId')
    self.properties.rigRootRead = (type(rr) == 'string') and rr or ''

    self.properties.speedSetOk = self.Component.setField(eid, 'animator', 'speed', 2)
    self.properties.playingSetOk = self.Component.setField(eid, 'animator', 'playing', true)
    self.properties.timeSetOk = self.Component.setField(eid, 'animator', 'time', 0.25)
    self.properties.activeIndexSetOk = self.Component.setField(eid, 'animator', 'activeClipIndex', 0)

    local speed = self.Component.getField(eid, 'animator', 'speed')
    self.properties.speedReadBack = (type(speed) == 'number') and speed or 0

    local animData = self.Component.getData(eid, 'animator')
    self.properties.playingReadBack = animData ~= nil and animData.playing == true
    local t = animData and animData.time
    self.properties.timeReadBack = (type(t) == 'number') and t or 0
  end,
}
