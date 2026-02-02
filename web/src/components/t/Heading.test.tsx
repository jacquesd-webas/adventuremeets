import { fireEvent, render, screen } from "@testing-library/react";
import { Heading } from "../Heading";

describe("Heading", () => {
  it("renders title and subtitle and triggers actions", () => {
    const onAction = vi.fn();
    const onSecondary = vi.fn();

    render(
      <Heading
        title="Test Title"
        subtitle="Subtext"
        actionComponent={<button>Primary</button>}
        secondaryActionComponent={<button>Secondary</button>}
        onAction={onAction}
        onSecondaryAction={onSecondary}
      />
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Subtext")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Primary"));
    fireEvent.click(screen.getByText("Secondary"));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });
});
