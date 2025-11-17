/** @jsxImportSource preact */
import { h } from "preact";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import TransformEditor from "./TransformEditor";
import { Entity } from "@client/domain/ecs/core/Entity";
import { ServicesContext } from "../../hooks/useServices";

afterEach(() => cleanup());

describe("TransformEditor", () => {
  it("renders transform and updates entity transform on input", () => {
    const e = new Entity("E");
    e.transform.setPosition(0, 0, 0);

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

    const { getAllByRole } = render(
      <ServicesContext.Provider value={mockServices}>
        <TransformEditor entity={e} />
      </ServicesContext.Provider>
    );

    // there should be number inputs; change the first (X position)
    // find the position group and its X axis input
    const posLabel = document.querySelector(".transform-label");
    expect(posLabel).not.toBeNull();
    const group = posLabel?.closest(".transform-group") as Element | null;
    expect(group).not.toBeNull();
    const axisInputs = group?.querySelectorAll(".axis-input") || [];
    expect(axisInputs.length).toBeGreaterThanOrEqual(1);
    const xInput = axisInputs[0] as HTMLInputElement;
    fireEvent.change(xInput, { target: { value: "4.5" } });
    // the transform localPosition should be updated
    expect(Math.abs(e.transform.localPosition.x - 4.5)).toBeLessThan(1e-6);
  });
});
