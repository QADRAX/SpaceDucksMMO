// Auto-generated file. Do not edit directly.
// Run 'npm run build:scripts' to regenerate.
// Test scripts only — separate from production ScriptAssets.

/** Integration test scripts. Keys are test:// URIs. */
export const TestScripts: Record<string, string> = {
  "test://component_bridge_has_getdata.lua": `-- E2E test: Component bridge has() and getData().
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
    self.properties.hasNonexistent = self.Component.has(eid, 'cameraPerspective')  -- not on entity

    -- getData(entityId, componentType) - full snapshot
    local nameData = self.Component.getData(eid, 'name')
    self.properties.nameDataValue = (nameData and nameData.value) or ''

    local boxData = self.Component.getData(eid, 'boxGeometry')
    self.properties.boxDataWidth = (boxData and type(boxData.width) == 'number') and boxData.width or 0
  end,
}
`,
  "test://component_bridge_light_fields.lua": `-- E2E test: Component bridge getField/setField for directionalLight shadow fields.
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
`,
  "test://component_bridge_properties.lua": `-- E2E test: Component bridge getField/setField for PropertyValues.
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
`,
  "test://component_bridge_resource_mesh.lua": `-- E2E test: Component bridge setResource for mesh field.
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
`,
  "test://component_bridge_resource_texture.lua": `-- E2E test: Component bridge setResource for texture slot (albedo).
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
      eid, 'standardMaterial', 'albedo', 'textures/concrete-muddy_diffuse'
    )

    -- Read back the ResourceRef key to verify
    local albedoData = self.Component.getField(eid, 'standardMaterial', 'albedo')
    self.properties.albedoKeyRead = (albedoData and albedoData.key) or ''
  end,
}
`,
  "test://component_bridge_resources.lua": `-- E2E test: Component bridge setResource for material field.
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
`,
  "test://component_bridge_skin_animator.lua": `-- E2E test: Component bridge for skin (rigRootEntityId) and animator (playback fields).
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
`,
  "test://minimal_engine_ports.lua": `-- Minimal test: init calls engine_ports (custom port).
-- Isolates: engine_ports injection, port resolution.
-- Verification: properties.greeting set from port.hello() result.

---@class MinimalEnginePortsPropsV2
---@field portKey string
---@field greeting string

---@class MinimalEnginePortsScript : ScriptInstanceV2
---@field properties MinimalEnginePortsPropsV2

return {
    ---@param self MinimalEnginePortsScript
    init = function(self)
        local portKey = self.properties.portKey or "io:test-custom"
        local port = engine_ports and engine_ports[portKey]
        if port and port.hello then
            self.properties.greeting = port.hello("Test")
        else
            self.properties.greeting = "no-port"
        end
    end
}
`,
  "test://minimal_init.lua": `-- Minimal test: init only, no bridges, no self.entity.
-- Isolates: slot creation, __LoadSlot, __WrapSelf, init hook.
-- Verification: properties.initCalled = true (readable from ECS snapshot).

---@class MinimalInitPropsV2
---@field initCalled boolean

---@class MinimalInitScript : ScriptInstanceV2
---@field properties MinimalInitPropsV2

return {
    ---@param self MinimalInitScript
    init = function(self)
        self.properties.initCalled = true
    end
}
`,
  "test://minimal_properties.lua": `-- Minimal test: init writes to self.properties.
-- Isolates: properties proxy, dirty tracking, flush to ECS.

---@class MinimalPropertiesPropsV2
---@field foo string

---@class MinimalPropertiesScript : ScriptInstanceV2
---@field properties MinimalPropertiesPropsV2

return {
    ---@param self MinimalPropertiesScript
    init = function(self)
        self.properties.foo = "bar"
    end
}
`,
  "test://minimal_transform.lua": `-- Minimal test: init calls self.entity.components.transform.getLocalPosition().
-- Isolates: entity proxy, components proxy, transform bridge.
-- Verification: properties.initCalled = true, properties.startX/Y/Z from position.

---@class MinimalTransformPropsV2
---@field initCalled boolean
---@field startX number
---@field startY number
---@field startZ number

---@class MinimalTransformScript : ScriptInstanceV2
---@field properties MinimalTransformPropsV2

return {
    ---@param self MinimalTransformScript
    init = function(self)
        local pos = self.entity.components.transform.getLocalPosition()
        self.properties.startX = pos.x
        self.properties.startY = pos.y
        self.properties.startZ = pos.z
        self.properties.initCalled = true
    end
}
`,
  "test://minimal_transform_global.lua": `-- Minimal test: init calls self.Transform.getLocalPosition() (bridge shortcut).
-- Uses self.Transform instead of self.entity.components.transform — same scoped bridge.

---@class MinimalTransformGlobalPropsV2
---@field initCalled boolean
---@field startX number
---@field startY number
---@field startZ number

---@class MinimalTransformGlobalScript : ScriptInstanceV2
---@field properties MinimalTransformGlobalPropsV2

return {
    ---@param self MinimalTransformGlobalScript
    init = function(self)
        local pos = self.Transform and self.Transform.getLocalPosition()
        if pos then
            self.properties.startX = pos.x
            self.properties.startY = pos.y
            self.properties.startZ = pos.z
        end
        self.properties.initCalled = true
    end
}
`,
  "test://minimal_update.lua": `-- Minimal test: update hook only, no bridges.
-- Isolates: runFrameHooks, update pipeline, dt passing.
-- Verification: properties.updateCount incremented each frame.

---@class MinimalUpdatePropsV2
---@field updateCount number

---@class MinimalUpdateScript : ScriptInstanceV2
---@field properties MinimalUpdatePropsV2

return {
    ---@param self MinimalUpdateScript
    init = function(self)
        self.properties.updateCount = 0
    end,
    ---@param self MinimalUpdateScript
    ---@param dt number
    update = function(self, dt)
        self.properties.updateCount = (self.properties.updateCount or 0) + 1
    end
}
`,
};
