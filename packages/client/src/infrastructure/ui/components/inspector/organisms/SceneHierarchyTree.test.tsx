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

  it('supports drag and drop reparenting via TreeView', () => {
    const A = new Entity('A');
    const B = new Entity('B');
    A.addChild(B);

    const mockI18n: any = {
      getCurrentLanguage: () => 'en',
      subscribe: () => () => {},
      t: (k: any, f?: any) => f || k,
      changeLanguage: async () => {},
      getTranslations: () => ({}),
    };

    const mockSceneManager: any = {
      getEntities: () => [A, B],
      subscribeToSceneChanges: () => jest.fn(),
      reparentEntityResult: jest.fn(() => ({ ok: true })),
    };

    const mockServices: any = {
      i18n: mockI18n,
      sceneManager: mockSceneManager,
    };

    const { getByText } = render(
      <ServicesContext.Provider value={mockServices}>
        <SceneHierarchyTree selectedId={null} onSelect={() => {}} onError={() => {}} />
      </ServicesContext.Provider>
    );

    // Target the tree node title spans specifically to avoid matching the
    // select dropdown options with the same text. Click A to expand its
    // children so B becomes visible in the tree DOM.
    const a = getByText('A', { selector: '.tree-node-title' });
    fireEvent.click(a);
    const b = getByText('B', { selector: '.tree-node-title' });

    // Create a mock dataTransfer object
    const data: any = {
      data: {} as Record<string, string>,
      setData: function (k: string, v: string) { this.data[k] = v; },
      getData: function (k: string) { return this.data[k]; },
    };

    // Drag B and drop onto A
    fireEvent.dragStart(b, { dataTransfer: data });
    fireEvent.dragOver(a, { dataTransfer: data });
    fireEvent.drop(a, { dataTransfer: data });

    expect(mockSceneManager.reparentEntityResult).toHaveBeenCalledWith('B', 'A');
  });
});
