/**
 * E2E scenario: Component bridge (getField, setField, setResource, getData, has).
 *
 * Verifies that Lua scripts can read/write component PropertyValues and ResourceRef
 * fields via self.Component, and that changes persist to the ECS.
 */
/** @jest-environment node */
jest.unmock('wasmoon');

import { createSceneId, createEntityId, createComponent } from '@duckengine/core-v2';
import { setupScriptingIntegrationTest } from '../setup';
import {
  addSceneWithEntity,
  addEntityWithScripts,
  waitForSlotInit,
  runFrames,
} from '../testHelpers';
import { getScriptProperties } from '../testUtils';

const MAIN_SCENE = createSceneId('main');
const ENTITY_E1 = createEntityId('e1');
const ENTITY_E2 = createEntityId('e2');
const ENTITY_E3 = createEntityId('e3');
const ENTITY_E4 = createEntityId('e4');
const ENTITY_E5 = createEntityId('e5');
const ENTITY_E6 = createEntityId('e6');

describe('Scenario: Component bridge E2E', () => {
  it('component_bridge_properties: getField/setField for name and boxGeometry', async () => {
    const { api } = await setupScriptingIntegrationTest();

    addSceneWithEntity(api, MAIN_SCENE, ENTITY_E1);

    // Add name + boxGeometry before script
    const scene = api.scene(MAIN_SCENE);
    scene.entity(ENTITY_E1).addComponent({
      component: createComponent('name', { value: 'OriginalName' }),
    });
    scene.entity(ENTITY_E1).addComponent({
      component: createComponent('boxGeometry', { width: 1, height: 1, depth: 1 }),
    });

    addEntityWithScripts(api, MAIN_SCENE, ENTITY_E1, [
      {
        scriptId: 'test://component_bridge_properties.lua',
        properties: {
          nameValue: '',
          boxWidth: 0,
          boxHeight: 0,
          boxDepth: 0,
          nameSetOk: false,
          boxSetOk: false,
        },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(100);
    runFrames(api, 1);

    const props = getScriptProperties(
      scene.entity(ENTITY_E1).component('script').snapshot(),
    );
    expect(props).not.toBeNull();
    expect(props!.nameValue).toBe('OriginalName');
    expect(props!.boxWidth).toBe(1);
    expect(props!.boxHeight).toBe(1);
    expect(props!.boxDepth).toBe(1);
    expect(props!.nameSetOk).toBe(true);
    expect(props!.boxSetOk).toBe(true);

    // Verify ECS was updated by setField
    const nameSnap = scene.entity(ENTITY_E1).component('name').snapshot();
    expect(nameSnap.ok).toBe(true);
    expect((nameSnap as { ok: true; value: unknown }).value).toMatchObject({ value: 'LuaRenamed' });

    const boxSnap = scene.entity(ENTITY_E1).component('boxGeometry').snapshot();
    expect(boxSnap.ok).toBe(true);
    const box = (boxSnap as { ok: true; value: unknown }).value as {
      width?: number;
      height?: number;
      depth?: number;
    };
    expect(box.width).toBe(2.5);
    expect(box.height).toBe(1.5);
    expect(box.depth).toBe(3);
  });

  it('component_bridge_has_getdata: has() and getData()', async () => {
    const { api } = await setupScriptingIntegrationTest();

    addSceneWithEntity(api, MAIN_SCENE, ENTITY_E2);

    const scene = api.scene(MAIN_SCENE);
    scene.entity(ENTITY_E2).addComponent({
      component: createComponent('name', { value: 'HasGetDataTest' }),
    });
    scene.entity(ENTITY_E2).addComponent({
      component: createComponent('boxGeometry', { width: 5, height: 5, depth: 5 }),
    });

    addEntityWithScripts(api, MAIN_SCENE, ENTITY_E2, [
      {
        scriptId: 'test://component_bridge_has_getdata.lua',
        properties: {
          hasName: false,
          hasBox: false,
          hasScript: false,
          hasNonexistent: true,
          nameDataValue: '',
          boxDataWidth: 0,
        },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(100);
    runFrames(api, 1);

    const props = getScriptProperties(
      scene.entity(ENTITY_E2).component('script').snapshot(),
    );
    expect(props).not.toBeNull();
    expect(props!.hasName).toBe(true);
    expect(props!.hasBox).toBe(true);
    expect(props!.hasScript).toBe(true);
    expect(props!.hasNonexistent).toBe(false);
    expect(props!.nameDataValue).toBe('HasGetDataTest');
    expect(props!.boxDataWidth).toBe(5);
  });

  it('component_bridge_resources: setResource for material field', async () => {
    const { api } = await setupScriptingIntegrationTest();

    addSceneWithEntity(api, MAIN_SCENE, ENTITY_E3);

    const scene = api.scene(MAIN_SCENE);
    scene.entity(ENTITY_E3).addComponent({
      component: createComponent('boxGeometry'),
    });
    scene.entity(ENTITY_E3).addComponent({
      component: createComponent('standardMaterial'),
    });

    addEntityWithScripts(api, MAIN_SCENE, ENTITY_E3, [
      {
        scriptId: 'test://component_bridge_resources.lua',
        properties: {
          materialSetOk: false,
          materialKeyRead: '',
        },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(100);
    runFrames(api, 1);

    const props = getScriptProperties(
      scene.entity(ENTITY_E3).component('script').snapshot(),
    );
    expect(props).not.toBeNull();
    expect(props!.materialSetOk).toBe(true);
    expect(props!.materialKeyRead).toBe('materials/test_red');

    // Verify ECS has ResourceRef
    const matSnap = scene.entity(ENTITY_E3).component('standardMaterial').snapshot();
    expect(matSnap.ok).toBe(true);
    const mat = (matSnap as { ok: true; value: unknown }).value as {
      material?: { key: string; kind: string };
    };
    expect(mat.material?.key).toBe('materials/test_red');
    expect(mat.material?.kind).toBe('standardMaterial');
  });

  it('component_bridge_resource_mesh: setResource for mesh field', async () => {
    const { api } = await setupScriptingIntegrationTest();

    addSceneWithEntity(api, MAIN_SCENE, ENTITY_E4);

    const scene = api.scene(MAIN_SCENE);
    scene.entity(ENTITY_E4).addComponent({
      component: createComponent('customGeometry'),
    });

    addEntityWithScripts(api, MAIN_SCENE, ENTITY_E4, [
      {
        scriptId: 'test://component_bridge_resource_mesh.lua',
        properties: {
          meshSetOk: false,
          meshKeyRead: '',
        },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(100);
    runFrames(api, 1);

    const props = getScriptProperties(
      scene.entity(ENTITY_E4).component('script').snapshot(),
    );
    expect(props).not.toBeNull();
    expect(props!.meshSetOk).toBe(true);
    expect(props!.meshKeyRead).toBe('meshes/test_cube');

    const meshSnap = scene.entity(ENTITY_E4).component('customGeometry').snapshot();
    expect(meshSnap.ok).toBe(true);
    const mesh = (meshSnap as { ok: true; value: unknown }).value as {
      mesh?: { key: string; kind: string };
    };
    expect(mesh.mesh?.key).toBe('meshes/test_cube');
    expect(mesh.mesh?.kind).toBe('mesh');
  });

  it('component_bridge_resource_texture: setResource for albedo texture', async () => {
    const { api } = await setupScriptingIntegrationTest();

    addSceneWithEntity(api, MAIN_SCENE, ENTITY_E5);

    const scene = api.scene(MAIN_SCENE);
    scene.entity(ENTITY_E5).addComponent({
      component: createComponent('boxGeometry'),
    });
    scene.entity(ENTITY_E5).addComponent({
      component: createComponent('standardMaterial'),
    });

    addEntityWithScripts(api, MAIN_SCENE, ENTITY_E5, [
      {
        scriptId: 'test://component_bridge_resource_texture.lua',
        properties: {
          albedoSetOk: false,
          albedoKeyRead: '',
        },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(100);
    runFrames(api, 1);

    const props = getScriptProperties(
      scene.entity(ENTITY_E5).component('script').snapshot(),
    );
    expect(props).not.toBeNull();
    expect(props!.albedoSetOk).toBe(true);
    expect(props!.albedoKeyRead).toBe('textures/concrete-muddy_diffuse');

    const matSnap = scene.entity(ENTITY_E5).component('standardMaterial').snapshot();
    expect(matSnap.ok).toBe(true);
    const mat = (matSnap as { ok: true; value: unknown }).value as {
      albedo?: { key: string; kind: string };
    };
    expect(mat.albedo?.key).toBe('textures/concrete-muddy_diffuse');
    expect(mat.albedo?.kind).toBe('texture');
  });

  it('component_bridge_light_fields: getField/setField for directionalLight shadow', async () => {
    const { api } = await setupScriptingIntegrationTest();

    addSceneWithEntity(api, MAIN_SCENE, ENTITY_E6);

    const scene = api.scene(MAIN_SCENE);
    scene.entity(ENTITY_E6).addComponent({
      component: createComponent('directionalLight', {
        castShadow: true,
        shadowBias: 0,
        shadowNormalBias: 0.01,
      }),
    });

    addEntityWithScripts(api, MAIN_SCENE, ENTITY_E6, [
      {
        scriptId: 'test://component_bridge_light_fields.lua',
        properties: {
          biasSetOk: false,
          normalBiasSetOk: false,
          biasReadBack: 0,
          normalBiasReadBack: 0,
          intensityReadBack: 0,
        },
      },
    ]);

    api.update({ dt: 0 });
    await waitForSlotInit(100);
    runFrames(api, 1);

    const props = getScriptProperties(
      scene.entity(ENTITY_E6).component('script').snapshot(),
    );
    expect(props).not.toBeNull();
    expect(props!.biasSetOk).toBe(true);
    expect(props!.normalBiasSetOk).toBe(true);
    expect(props!.biasReadBack).toBe(0.002);
    expect(props!.normalBiasReadBack).toBe(0.02);
    expect(props!.intensityReadBack).toBe(1);

    const lightSnap = scene.entity(ENTITY_E6).component('directionalLight').snapshot();
    expect(lightSnap.ok).toBe(true);
    const light = (lightSnap as { ok: true; value: unknown }).value as {
      shadowBias?: number;
      shadowNormalBias?: number;
    };
    expect(light.shadowBias).toBe(0.002);
    expect(light.shadowNormalBias).toBe(0.02);
  });
});
