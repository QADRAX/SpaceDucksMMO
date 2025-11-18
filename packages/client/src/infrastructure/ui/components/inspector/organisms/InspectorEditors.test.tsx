/** @jsxImportSource preact */
import { h } from "preact";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import { ComponentInspector } from "./ComponentInspector";
import { Entity } from "@client/domain/ecs/core/Entity";
import { BoxGeometryComponent } from "@client/domain/ecs/components/BoxGeometryComponent";
import { StandardMaterialComponent } from "@client/domain/ecs/components/StandardMaterialComponent";
import { ServicesContext } from "../../../hooks/useServices";
import DefaultEcsComponentFactory from "@client/domain/ecs/core/ComponentFactory";

afterEach(() => cleanup());

describe("Inspector editors", () => {
  it('renders geometry fields for BoxGeometryComponent', () => {
    const e = new Entity('E');
    e.safeAddComponent(new BoxGeometryComponent({ width: 1, height: 1, depth: 1 }));

    const mockI18n: any = { getCurrentLanguage: () => 'en', subscribe: () => () => {}, t: (k: any, f?: any) => f || k, changeLanguage: async () => {}, getTranslations: () => ({}) };
    const services: any = { i18n: mockI18n, sceneManager: { subscribeToSceneChanges: () => jest.fn() }, ecsComponentFactory: new DefaultEcsComponentFactory() };

    render(
      <ServicesContext.Provider value={services}>
        <ComponentInspector entity={e} />
      </ServicesContext.Provider>
    );

    const sections = document.querySelectorAll('.component-section');
    let geomSection: Element | null = null;
    sections.forEach((s) => {
      if (s.textContent && s.textContent.toLowerCase().indexOf('boxgeometry') >= 0) geomSection = s;
      if (!geomSection && s.textContent && s.textContent.toLowerCase().indexOf('geometry') >= 0) geomSection = s;
    });
    expect(geomSection).not.toBeNull();

    expect(geomSection!.textContent).toContain('Width');
    expect(geomSection!.textContent).toContain('Height');
    expect(geomSection!.textContent).toContain('Depth');

    const numberInput = geomSection!.querySelector('input[type="number"]') as HTMLInputElement | null;
    expect(numberInput).not.toBeNull();
    fireEvent.input(numberInput!, { target: { value: '2' } });

    const boxComp = e.getComponent('boxGeometry') as any;
    expect(boxComp.width).toBe(2);
  });

  it("material color setter via inspector updates MaterialComponent.color", () => {
    const e = new Entity('E');
    e.safeAddComponent(new BoxGeometryComponent({ width: 1, height: 1, depth: 1 }));
    const mat = new StandardMaterialComponent({ color: 0xffffff });
    e.safeAddComponent(mat);

    const mockI18n: any = { getCurrentLanguage: () => 'en', subscribe: () => () => {}, t: (k: any, f?: any) => f || k, changeLanguage: async () => {}, getTranslations: () => ({}) };
    const services: any = { i18n: mockI18n, sceneManager: { subscribeToSceneChanges: () => jest.fn() } };

    render(
      <ServicesContext.Provider value={services}>
        <ComponentInspector entity={e} />
      </ServicesContext.Provider>
    );

    const colorInputGlobal = document.querySelector('input[type="color"]') as HTMLInputElement | null;
    expect(colorInputGlobal).not.toBeNull();
    const matSection = colorInputGlobal!.closest('.component-section');
    expect(matSection).not.toBeNull();

    fireEvent.input(colorInputGlobal!, { target: { value: '#ff0000' } });

    expect(mat.color).toBe(0xff0000);
  });

  it('color picker conversion numeric/string behavior', () => {
    const e = new Entity('E');
    e.safeAddComponent(new BoxGeometryComponent({ width: 1, height: 1, depth: 1 }));
    const mat = new StandardMaterialComponent({ color: '#00ff00' as any });
    e.safeAddComponent(mat);

    const mockI18n: any = { getCurrentLanguage: () => 'en', subscribe: () => () => {}, t: (k: any, f?: any) => f || k, changeLanguage: async () => {}, getTranslations: () => ({}) };
    const services: any = { i18n: mockI18n, sceneManager: { subscribeToSceneChanges: () => jest.fn() } };

    render(
      <ServicesContext.Provider value={services}>
        <ComponentInspector entity={e} />
      </ServicesContext.Provider>
    );

    const colorInputGlobal2 = document.querySelector('input[type="color"]') as HTMLInputElement | null;
    expect(colorInputGlobal2).not.toBeNull();
    fireEvent.input(colorInputGlobal2!, { target: { value: '#0000ff' } });
    expect(mat.color).toBe(0x0000ff);
  });
});
