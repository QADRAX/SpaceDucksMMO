/** @jsxImportSource preact */
import { h } from "preact";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import { ComponentInspector } from "./ComponentInspector";
import { Entity } from "@client/domain/ecs/core/Entity";
import { Component } from "@client/domain/ecs/core/Component";
import { ServicesContext } from "../../../hooks/useServices";

afterEach(() => cleanup());

class TestComp extends Component {
  readonly type = "TestComp";
  readonly metadata = { type: "TestComp" } as any;
  someNumber = 5;
  someBool = true;
  someVec = [1, 2, 3];
}

describe("ComponentInspector", () => {
  it("renders components, toggles enabled and removes component", () => {
    const e = new Entity("E");
    const c = new TestComp();
    e.addComponent(c as any);

    const mockI18n: any = {
      getCurrentLanguage: () => "en",
      subscribe: () => () => {},
      t: (k: any, f?: any) => f || k,
      changeLanguage: async () => {},
      getTranslations: () => ({}),
    };
    const mockServices: any = {
      i18n: mockI18n,
      sceneManager: { subscribeToSceneChanges: () => jest.fn() },
      ecsComponentFactory: {
        listCreatableComponents: () => [],
        create: () => ({}),
      },
    };

    const { getByText, getByLabelText } = render(
      <ServicesContext.Provider value={mockServices}>
        <ComponentInspector entity={e} />
      </ServicesContext.Provider>
    );

    expect(getByText("TestComp")).toBeDefined();

    const checkbox = getByLabelText("Enabled") as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(c.enabled).toBe(false);

    const btn = getByText("Remove");
    fireEvent.click(btn);
    expect(e.getComponent("TestComp")).toBeUndefined();
  });

  it("can add components via objectFactory", () => {
    const e = new Entity("E2");
    const mockI18n: any = {
      getCurrentLanguage: () => "en",
      subscribe: () => () => {},
      t: (k: any, f?: any) => f || k,
      changeLanguage: async () => {},
      getTranslations: () => ({}),
    };
    const mockServices: any = {
      i18n: mockI18n,
      sceneManager: { subscribeToSceneChanges: () => jest.fn() },
      ecsComponentFactory: {
        listCreatableComponents: () => [{ type: "orbit", label: "Orbit" }],
        create: (t: any) => {
          class MockComp {
            type = t;
            metadata = { type: t } as any;
            setEntityId(_id: string) {}
            notifyChanged() {}
          }
          return new MockComp() as any;
        },
      },
    };
    const { container } = render(
      <ServicesContext.Provider value={mockServices}>
        <ComponentInspector entity={e} />
      </ServicesContext.Provider>
    );

    const selects = Array.from(
      container.querySelectorAll("select")
    ) as HTMLSelectElement[];
    const addSelect = selects.find((s) =>
      Array.from(s.options).some((o) => o.value === "orbit")
    );
    expect(addSelect).toBeDefined();
    if (addSelect) fireEvent.change(addSelect, { target: { value: "orbit" } });
    expect(e.getComponent("orbit")).toBeDefined();
  });
});
