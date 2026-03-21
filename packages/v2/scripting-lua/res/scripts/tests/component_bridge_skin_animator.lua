-- E2E test: Component bridge for skin (ResourceRef skeleton) and animator (playback fields).
-- Requires entity with: customGeometry, skin, animator (animator may include one clip ref from host).

---@class ComponentBridgeSkinAnimatorPropsV2
---@field meshSetOk boolean
---@field skeletonSetOk boolean
---@field skeletonKeyRead string
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

    self.properties.skeletonSetOk = self.Component.setResource(
      eid, 'skin', 'skeleton', 'rigs/test_skeleton', 'skeleton'
    )

    local sk = self.Component.getField(eid, 'skin', 'skeleton')
    self.properties.skeletonKeyRead = (sk and sk.key) or ''

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
