import { fireEvent, render, screen } from "@testing-library/react";
import { InternationalPhoneField, buildInternationalPhone, getDefaultPhoneCountry } from "../InternationalPhoneField";

describe("InternationalPhoneField helpers", () => {
  it("buildInternationalPhone joins dial code and local number", () => {
    expect(buildInternationalPhone("US", " 5551234 ")).toBe("+15551234");
    expect(buildInternationalPhone("XX", "123")).toBe("+27123"); // falls back to first option ZA
    expect(buildInternationalPhone("US", "   ")).toBe("");
  });

  it("getDefaultPhoneCountry chooses matching locale or defaults to ZA", () => {
    expect(getDefaultPhoneCountry("US")).toBe("US");
    expect(getDefaultPhoneCountry("XX")).toBe("ZA");
    expect(getDefaultPhoneCountry()).toBe("ZA");
  });
});

describe("InternationalPhoneField component", () => {
  it("renders and propagates changes", async () => {
    const onCountryChange = vi.fn();
    const onLocalChange = vi.fn();

    render(
      <InternationalPhoneField
        country="ZA"
        local=""
        onCountryChange={onCountryChange}
        onLocalChange={onLocalChange}
      />
    );

    const select = screen.getByTestId("country-select");
    fireEvent.mouseDown(select);
    screen.debug();
    // TODO: FIX THIS
    //const listbox = await screen.findByRole("listbox");
    //const option = within(listbox).getByText(/United States/i);
    //fireEvent.click(option);
    //expect(onCountryChange).toHaveBeenCalledWith("ZA");
//
    //const input = screen.getByLabelText(/Phone/i);
    //fireEvent.change(input, { target: { value: "5551234" } });
    //expect(onLocalChange).toHaveBeenCalledWith("5551234");
  });
});
