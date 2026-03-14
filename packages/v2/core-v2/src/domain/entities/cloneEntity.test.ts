import { createEntity, addComponent, addChild, getComponent, hasComponent, getChildren } from './entity';
import { cloneEntitySubtree } from './cloneEntity';
import { createEntityId } from '../ids';
import { createComponent } from '../components';

describe('cloneEntitySubtree', () => {
  it('clones a single entity with components', () => {
    const template = createEntity(createEntityId('t1'), 'Template');
    addComponent(template, createComponent('name', { value: 'TestName' }));
    addComponent(template, createComponent('boxGeometry', { width: 2, height: 3, depth: 4 }));

    let nextId = 0;
    const gen = () => createEntityId(`clone-${++nextId}`);

    const clone = cloneEntitySubtree(template, gen);

    expect(clone.id).toBe(createEntityId('clone-1'));
    expect(clone.displayName).toBe('Template');
    expect(clone.children).toHaveLength(0);

    expect(hasComponent(clone, 'name')).toBe(true);
    expect(hasComponent(clone, 'boxGeometry')).toBe(true);

    const nameComp = getComponent(clone, 'name') as { value?: string };
    const boxComp = getComponent(clone, 'boxGeometry') as { width?: number; height?: number; depth?: number };
    expect(nameComp?.value).toBe('TestName');
    expect(boxComp?.width).toBe(2);
    expect(boxComp?.height).toBe(3);
    expect(boxComp?.depth).toBe(4);
  });

  it('clones entity hierarchy with parent-child', () => {
    const parent = createEntity(createEntityId('p1'), 'Parent');
    const child = createEntity(createEntityId('c1'), 'Child');
    addChild(parent, child);
    addComponent(parent, createComponent('name', { value: 'P' }));
    addComponent(child, createComponent('name', { value: 'C' }));

    let nextId = 0;
    const gen = () => createEntityId(`c-${++nextId}`);

    const clone = cloneEntitySubtree(parent, gen);

    expect(clone.id).toBe(createEntityId('c-1'));
    expect(getChildren(clone)).toHaveLength(1);

    const cloneChild = getChildren(clone)[0];
    expect(cloneChild.id).toBe(createEntityId('c-2'));
    expect(cloneChild.parent).toBe(clone);

    const pName = getComponent(clone, 'name') as { value?: string };
    const cName = getComponent(cloneChild, 'name') as { value?: string };
    expect(pName?.value).toBe('P');
    expect(cName?.value).toBe('C');
  });

  it('clone is independent from template', () => {
    const template = createEntity(createEntityId('t1'));
    addComponent(template, createComponent('name', { value: 'Original' }));

    const gen = () => createEntityId('clone-1');
    const clone = cloneEntitySubtree(template, gen);

    const cloneName = getComponent(clone, 'name') as { value?: string };
    cloneName!.value = 'Modified';

    const templateName = getComponent(template, 'name') as { value?: string };
    expect(templateName?.value).toBe('Original');
    expect(cloneName?.value).toBe('Modified');
  });

  it('preserves component enabled state', () => {
    const template = createEntity(createEntityId('t1'));
    const comp = createComponent('name', { value: 'X' });
    comp.enabled = false;
    addComponent(template, comp);

    const gen = () => createEntityId('clone-1');
    const clone = cloneEntitySubtree(template, gen);

    const cloneComp = getComponent(clone, 'name') as { enabled?: boolean };
    expect(cloneComp?.enabled).toBe(false);
  });
});
