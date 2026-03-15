-- E2E test: Component bridge getField/setField for directionalLight shadow fields.
-- Requires entity with: directionalLight component.
-- Verification: biasSetOk, normalBiasSetOk, biasReadBack, normalBiasReadBack, intensityReadBack.

---@class ComponentBridgeLightFieldsPropsV2
---@field biasSetOk boolean
---@field normalBiasSetOk boolean
---@field biasReadBack number
---@field normalBiasReadBack number
---@field intensityReadBack number

---@class ComponentBridgeLightFieldsScript : ScriptInstanceV2
---@field properties ComponentBridgeLightFieldsPropsV2

return {
  ---@param self ComponentBridgeLightFieldsScript
  init = function(self)
    local eid = tostring(self.entity.id)

    -- setField for shadowBias and shadowNormalBias (Lua-friendly flat fields)
    self.properties.biasSetOk = self.Component.setField(eid, 'directionalLight', 'shadowBias', 0.002)
    self.properties.normalBiasSetOk = self.Component.setField(eid, 'directionalLight', 'shadowNormalBias', 0.02)

    -- Read back via getField
    local bias = self.Component.getField(eid, 'directionalLight', 'shadowBias')
    local normalBias = self.Component.getField(eid, 'directionalLight', 'shadowNormalBias')
    local intensity = self.Component.getField(eid, 'directionalLight', 'intensity')
    self.properties.biasReadBack = (type(bias) == 'number') and bias or 0
    self.properties.normalBiasReadBack = (type(normalBias) == 'number') and normalBias or 0
    self.properties.intensityReadBack = (type(intensity) == 'number') and intensity or 0
  end,
}
