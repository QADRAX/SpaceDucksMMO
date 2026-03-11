-- E2E test: Component bridge getField/setField for PropertyValues.
-- Requires entity with: name, boxGeometry components.
-- Verification: properties.nameValue, boxWidth/Height/Depth (read), nameSetOk, boxSetOk (write).

---@class ComponentBridgePropertiesPropsV2
---@field nameValue string
---@field boxWidth number
---@field boxHeight number
---@field boxDepth number
---@field nameSetOk boolean
---@field boxSetOk boolean

---@class ComponentBridgePropertiesScript : ScriptInstanceV2
---@field properties ComponentBridgePropertiesPropsV2

return {
  ---@param self ComponentBridgePropertiesScript
  init = function(self)
    local eid = tostring(self.entity.id)

    -- Read name.value
    local nameVal = self.Component.getField(eid, 'name', 'value')
    self.properties.nameValue = nameVal or ''

    -- Read boxGeometry (scalar fields)
    local w = self.Component.getField(eid, 'boxGeometry', 'width')
    local h = self.Component.getField(eid, 'boxGeometry', 'height')
    local d = self.Component.getField(eid, 'boxGeometry', 'depth')
    self.properties.boxWidth = (type(w) == 'number') and w or 0
    self.properties.boxHeight = (type(h) == 'number') and h or 0
    self.properties.boxDepth = (type(d) == 'number') and d or 0

    -- Write name.value
    self.properties.nameSetOk = self.Component.setField(eid, 'name', 'value', 'LuaRenamed')

    -- Write boxGeometry dimensions
    self.properties.boxSetOk = self.Component.setField(eid, 'boxGeometry', 'width', 2.5)
      and self.Component.setField(eid, 'boxGeometry', 'height', 1.5)
      and self.Component.setField(eid, 'boxGeometry', 'depth', 3.0)
  end,
}
