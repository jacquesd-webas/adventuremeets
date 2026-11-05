import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EmailTemplateVariablesHelp } from "../../EmailTemplateVariablesHelp";

describe("EmailTemplateVariablesHelp", () => {
  it("shows the available email variables when clicked", async () => {
    const user = userEvent.setup();
    render(<EmailTemplateVariablesHelp />);

    const trigger = screen.getByRole("button", { name: "click here" });
    expect(trigger).toBeVisible();
    await user.click(trigger);

    for (const variable of [
      "{{name}}",
      "{{meet}}",
      "{{organiser}}",
      "{{start_date}}",
      "{{end_date}}",
      "{{start_time}}",
      "{{end_time}}",
      "{{location}}",
    ]) {
      expect(screen.getByText(variable)).toBeVisible();
    }

    const popover = screen.getByText("{{meet}}").closest(".MuiPopover-root");
    expect(popover).not.toBeNull();
    expect(window.getComputedStyle(popover!).zIndex).toBe("1401");
  });
});
