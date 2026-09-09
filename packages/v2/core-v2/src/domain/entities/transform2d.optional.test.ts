import { createEntityId } from '../ids';
import {
  addChild,
  addComponent,
  createEntity,
  getTransform2d,
  hasTransform2d,
  reconcileTransform2dSubtree,
  removeComponent,
  setComponentEnabled,
} from './index';
import { createComponent } from '../components/factory';

describe('optional transform2d', () => {
  it('createEntity has no transform2d', () => {
    const e = createEntity(createEntityId('ui'));
    expect(hasTransform2d(e)).toBe(false);
    expect(getTransform2d(e)).toBeUndefined();
  });

  it('getTransform2d is undefined when disabled', () => {
    const e = createEntity(createEntityId('hud'));
    addComponent(e, createComponent('transform2d', { position: { x: 0.1, y: 0.2 } }));
    expect(getTransform2d(e)?.localPosition).toEqual({ x: 0.1, y: 0.2 });
    setComponentEnabled(e, 'transform2d', false);
    expect(hasTransform2d(e)).toBe(true);
    expect(getTransform2d(e)).toBeUndefined();
  });

  it('uiView requires transform2d and conflicts with uiCustom', () => {
    const e = createEntity(createEntityId('panel'));
    const withoutPose = addComponent(e, createComponent('uiView'));
    expect(withoutPose.ok).toBe(false);

    addComponent(e, createComponent('transform2d'));
    expect(addComponent(e, createComponent('uiView')).ok).toBe(true);
    expect(addComponent(e, createComponent('uiCustom')).ok).toBe(false);
  });

  it('reconciles transform2d parent across hierarchy', () => {
    const parent = createEntity(createEntityId('parent'));
    const child = createEntity(createEntityId('child'));
    addComponent(parent, createComponent('transform2d'));
    addComponent(child, createComponent('transform2d', { position: { x: 0.5, y: 0.5 } }));
    addChild(parent, child);
    expect(getTransform2d(child)?.parent).toBe(getTransform2d(parent));

    setComponentEnabled(parent, 'transform2d', false);
    reconcileTransform2dSubtree(parent);
    expect(getTransform2d(child)?.parent).toBeNull();

    removeComponent(parent, 'transform2d');
    expect(getTransform2d(child)?.parent).toBeNull();
  });
});
