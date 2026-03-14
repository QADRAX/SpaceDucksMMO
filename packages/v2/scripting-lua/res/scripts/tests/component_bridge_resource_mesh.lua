-- E2E test: Component bridge setResource for mesh field.
-- Requires entity with: customGeometry (mesh field).
-- Verification: meshSetOk, meshKeyRead.

---@class ComponentBridgeResourceMeshPropsV2
---@field meshSetOk boolean
---@field meshKeyRead string

---@class ComponentBridgeResourceMeshScript : ScriptInstanceV2
---@field properties ComponentBridgeResourceMeshPropsV2

return {
  ---@param self ComponentBridgeResourceMeshScript
  init = function(self)
    local eid = tostring(self.entity.id)

    -- setResource(entityId, componentType, fieldKey, resourceKey)
    self.properties.meshSetOk = self.Component.setResource(
      eid, 'customGeometry', 'mesh', 'meshes/test_cube'
    )

    -- Read back the ResourceRef key to verify
    local meshData = self.Component.getField(eid, 'customGeometry', 'mesh')
    self.properties.meshKeyRead = (meshData and meshData.key) or ''
  end,
}
