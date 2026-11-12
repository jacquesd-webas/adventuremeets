import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AttendeeNotesAndTags } from "../AttendeeNotesAndTags";

const mutateAsync = vi.fn();
const reset = vi.fn();
let attendeeData = { notes: "Bring a spare map", tags: ["First aid"] };

vi.mock("../../../hooks/useAttendeeTags", () => ({
  useAttendeeTags: () => ({
    data: attendeeData,
    isLoading: false,
    isError: false,
  }),
  useMeetAttendeeTags: () => ({
    data: { tags: ["First aid", "Transport"] },
    isError: false,
  }),
  useSaveAttendeeNotesAndTags: () => ({
    mutateAsync,
    reset,
    isPending: false,
    isError: false,
  }),
}));

describe("AttendeeNotesAndTags", () => {
  beforeEach(() => {
    attendeeData = { notes: "Bring a spare map", tags: ["First aid"] };
    mutateAsync.mockReset().mockResolvedValue({
      notes: "Updated note",
      tags: ["First aid", "Medical"],
    });
    reset.mockReset();
  });

  it("shows saved values and opens fields only from the edit icon", () => {
    render(
      <AttendeeNotesAndTags
        meetId="meet-1"
        attendeeId="attendee-1"
        canManageMeet
      />,
    );

    expect(screen.getByText("Notes and Tags:")).toBeInTheDocument();
    expect(screen.getByText("Bring a spare map")).toBeInTheDocument();
    expect(screen.getByText("First aid")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Notes" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Edit notes and tags" }),
    );
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue(
      "Bring a spare map",
    );
    expect(screen.getByRole("combobox", { name: "Tags" })).toBeInTheDocument();
  });

  it("saves edited notes and newly created tags", async () => {
    render(
      <AttendeeNotesAndTags
        meetId="meet-1"
        attendeeId="attendee-1"
        canManageMeet
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Edit notes and tags" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Notes" }), {
      target: { value: "Updated note" },
    });
    const tagInput = screen.getByRole("combobox", { name: "Tags" });
    fireEvent.change(tagInput, { target: { value: "Medical" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        notes: "Updated note",
        tags: ["First aid", "Medical"],
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("textbox", { name: "Notes" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("saves text left in the tag input as a new tag", async () => {
    render(
      <AttendeeNotesAndTags
        meetId="meet-1"
        attendeeId="attendee-1"
        canManageMeet
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Edit notes and tags" }),
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Tags" }), {
      target: { value: "  Medical  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        notes: "Bring a spare map",
        tags: ["First aid", "Medical"],
      }),
    );
  });

  it("opens the editor in a bottom drawer on mobile", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;

    try {
      render(
        <AttendeeNotesAndTags
          meetId="meet-1"
          attendeeId="attendee-1"
          canManageMeet
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: "Edit notes and tags" }),
      );
      expect(screen.getByTestId("notes-tags-drawer")).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue(
        "Bring a spare map",
      );
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it("lets the user remove tags before saving", async () => {
    render(
      <AttendeeNotesAndTags
        meetId="meet-1"
        attendeeId="attendee-1"
        canManageMeet
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Edit notes and tags" }),
    );
    fireEvent.click(screen.getByTestId("CancelIcon"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        notes: "Bring a spare map",
        tags: [],
      }),
    );
  });

  it("hides the section without meet management permission", () => {
    render(
      <AttendeeNotesAndTags
        meetId="meet-1"
        attendeeId="attendee-1"
        canManageMeet={false}
      />,
    );
    expect(screen.queryByText("Notes and Tags:")).not.toBeInTheDocument();
  });
});
