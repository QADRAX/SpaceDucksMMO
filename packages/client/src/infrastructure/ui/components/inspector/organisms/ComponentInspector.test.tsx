/** @jsxImportSource preact */
import { h } from "preact";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import { ComponentInspector } from "./ComponentInspector";
import { Entity, Component } from "@duckengine/rendering-three/ecs";
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
});
