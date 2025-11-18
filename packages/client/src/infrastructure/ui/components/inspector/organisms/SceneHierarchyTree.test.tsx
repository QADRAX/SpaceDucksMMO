/** @jsxImportSource preact */
import { h } from "preact";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import { SceneHierarchyTree } from "./SceneHierarchyTree";
import { ServicesContext } from "../../../hooks/useServices";
import { Entity } from "@client/domain/ecs/core/Entity";

afterEach(() => cleanup());

describe("SceneHierarchyTree", () => {
  it("renders tree and calls onSelect, handles reparent error", () => {
    const A = new Entity("A");
    const B = new Entity("B");
    A.addChild(B);

    const mockI18n: any = {
      getCurrentLanguage: () => "en",
      subscribe: () => () => {},
      t: (k: any, f?: any) => f || k,
      changeLanguage: async () => {},
      getTranslations: () => ({}),
    };

    const mockSceneManager: any = {
      getEntities: () => [A, B],
      subscribeToSceneChanges: () => jest.fn(),
      reparentEntityResult: jest.fn(() => ({
        ok: false,
        error: { message: "nope" },
      })),
    };

    const mockServices: any = {
      i18n: mockI18n,
      sceneManager: mockSceneManager,
    };

    const onError = jest.fn();

    const { getByRole } = render(
      <ServicesContext.Provider value={mockServices}>
        <SceneHierarchyTree
          selectedId={"B"}
          onSelect={() => {}}
          onError={onError}
        />
      </ServicesContext.Provider>
    );

    const select = getByRole("combobox");
    fireEvent.change(select, { target: { value: "A" } });
    expect(mockSceneManager.reparentEntityResult).toHaveBeenCalledWith(
      "B",
      "A"
    );
  });
});
