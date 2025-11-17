/** @jsxImportSource preact */
import { h } from "preact";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import ReferenceField from "./ReferenceField";
import { ServicesContext } from "../../hooks/useServices";

afterEach(() => cleanup());

describe("ReferenceField", () => {
  it("marks invalid reference and calls onChange when selecting entity", () => {
    const mockI18n: any = {
      getCurrentLanguage: () => "en",
      subscribe: () => () => {},
      t: (k: any, f?: any) => f || k,
      changeLanguage: async () => {},
      getTranslations: () => ({}),
    };
    const mockServices: any = {
      i18n: mockI18n,
      sceneManager: {
        getEntities: () => [{ id: "A" }, { id: "B" }],
      },
    };

    const onChange = jest.fn();
    const { getByRole, getByText } = render(
      <ServicesContext.Provider value={mockServices}>
        <ReferenceField value={"X"} onChange={onChange} />
      </ServicesContext.Provider>
    );

    // invalid-ref label should be present
    expect(getByText(/Invalid reference/i)).toBeDefined();

    const select = getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "A" } });
    expect(onChange).toHaveBeenCalledWith("A");
  });
});
