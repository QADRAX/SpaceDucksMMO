-- E2E test: Component bridge setResource for material field.
-- Requires entity with: boxGeometry + standardMaterial.
-- Verification: materialSetOk, materialKeyRead.

---@class ComponentBridgeResourcesPropsV2
---@field materialSetOk boolean
---@field materialKeyRead string

---@class ComponentBridgeResourcesScript : ScriptInstanceV2
---@field properties ComponentBridgeResourcesPropsV2

return {
  ---@param self ComponentBridgeResourcesScript
  init = function(self)
    local eid = tostring(self.entity.id)

    -- setResource(entityId, componentType, fieldKey, resourceKey)
    self.properties.materialSetOk = self.Component.setResource(
      eid, 'standardMaterial', 'material', 'materials/test_red'
    )

    -- Read back the ResourceRef key to verify
    local matData = self.Component.getField(eid, 'standardMaterial', 'material')
    self.properties.materialKeyRead = (matData and matData.key) or ''
  end,
}
