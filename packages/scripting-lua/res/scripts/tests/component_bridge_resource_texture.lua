-- E2E test: Component bridge setResource for texture slot (albedo).
-- Requires entity with: boxGeometry + standardMaterial.
-- Verification: albedoSetOk, albedoKeyRead.

---@class ComponentBridgeResourceTexturePropsV2
---@field albedoSetOk boolean
---@field albedoKeyRead string

---@class ComponentBridgeResourceTextureScript : ScriptInstanceV2
---@field properties ComponentBridgeResourceTexturePropsV2

return {
  ---@param self ComponentBridgeResourceTextureScript
  init = function(self)
    local eid = tostring(self.entity.id)

    -- setResource(entityId, componentType, fieldKey, resourceKey)
    self.properties.albedoSetOk = self.Component.setResource(
      eid, 'standardMaterial', 'albedo', 'textures/floor_diffuse'
    )

    -- Read back the ResourceRef key to verify
    local albedoData = self.Component.getField(eid, 'standardMaterial', 'albedo')
    self.properties.albedoKeyRead = (albedoData and albedoData.key) or ''
  end,
}
