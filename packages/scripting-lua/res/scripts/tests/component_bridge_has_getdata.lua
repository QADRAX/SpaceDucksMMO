-- E2E test: Component bridge has() and getData().
-- Requires entity with: name, boxGeometry, script.
-- Verification: hasName, hasBox, hasScript, hasNonexistent, nameDataValue, boxDataWidth.

---@class ComponentBridgeHasGetdataPropsV2
---@field hasName boolean
---@field hasBox boolean
---@field hasScript boolean
---@field hasNonexistent boolean
---@field nameDataValue string
---@field boxDataWidth number

---@class ComponentBridgeHasGetdataScript : ScriptInstanceV2
---@field properties ComponentBridgeHasGetdataPropsV2

return {
  ---@param self ComponentBridgeHasGetdataScript
  init = function(self)
    local eid = tostring(self.entity.id)

    -- has(entityId, componentType)
    self.properties.hasName = self.Component.has(eid, 'name')
    self.properties.hasBox = self.Component.has(eid, 'boxGeometry')
    self.properties.hasScript = self.Component.has(eid, 'script')
    self.properties.hasNonexistent = self.Component.has(eid, 'cameraView')  -- not on entity

    -- getData(entityId, componentType) - full snapshot
    local nameData = self.Component.getData(eid, 'name')
    self.properties.nameDataValue = (nameData and nameData.value) or ''

    local boxData = self.Component.getData(eid, 'boxGeometry')
    self.properties.boxDataWidth = (boxData and type(boxData.width) == 'number') and boxData.width or 0
  end,
}
