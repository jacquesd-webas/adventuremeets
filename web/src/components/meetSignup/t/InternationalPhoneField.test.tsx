import { fireEvent, render, screen } from "@testing-library/react";
import { InternationalPhoneField } from "../InternationalPhoneField";

describe("InternationalPhoneField", () => {
  it("updates local phone and country", () => {
    const onCountryChange = vi.fn();
    const onLocalChange = vi.fn();
    render(
      <InternationalPhoneField
        country="ZA"
        local="123"
        onCountryChange={onCountryChange}
        onLocalChange={onLocalChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "555" },
    });
    expect(onLocalChange).toHaveBeenCalledWith("555");

    fireEvent.change(screen.getByTestId("country-select"), {
      target: { value: "US" },
    });
    expect(onCountryChange).toHaveBeenCalledWith("US");
  });
});
