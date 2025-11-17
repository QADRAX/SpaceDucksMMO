/** @jsxImportSource preact */
import { h } from "preact";
import { render, cleanup, fireEvent } from "@testing-library/preact";
import TextureSelector from "./TextureSelector";
import { ServicesContext } from "../../hooks/useServices";

afterEach(() => cleanup());

describe("TextureSelector", () => {
  it("shows invalid texture and allows selection", () => {
    const catalog = {
      getCatalog: async () => ({ variants: [{ id: "t1" }, { id: "t2" }] }),
      subscribe: (fn: any) => {
        fn({ variants: [{ id: "t1" }, { id: "t2" }] });
        return () => {};
      },
    };
    const mockI18n: any = {
      getCurrentLanguage: () => "en",
      subscribe: () => () => {},
      t: (k: any, f?: any) => f || k,
      changeLanguage: async () => {},
      getTranslations: () => ({}),
    };
    const mockServices: any = { i18n: mockI18n, textureCatalog: catalog };

    const onChange = jest.fn();
    const { getByRole, getByText } = render(
      <ServicesContext.Provider value={mockServices}>
        <TextureSelector value={"missing"} onChange={onChange} />
      </ServicesContext.Provider>
    );

    expect(getByText(/Texture not found/i)).toBeDefined();

    const select = getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "t1" } });
    expect(onChange).toHaveBeenCalledWith("t1");
  });
});
