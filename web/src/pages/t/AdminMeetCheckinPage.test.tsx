import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import AdminMeetCheckinPage from "../AdminMeetCheckinPage";

const checkin = vi.fn();
const useAdminMeetCheckin = vi.fn();

vi.mock("../../hooks/useAdminMeetCheckin", () => ({
  useAdminMeetCheckin: (...args: unknown[]) => useAdminMeetCheckin(...args),
}));

describe("AdminMeetCheckinPage", () => {
  beforeEach(() => {
    checkin.mockReset();
    useAdminMeetCheckin.mockReturnValue({
      query: {
        data: {
          meetName: "Sunrise Hike",
          attendees: [
            {
              id: "one",
              name: "Alex",
              status: "confirmed",
              tags: ["First aid"],
            },
            { id: "two", name: "Robin", status: "checked-in" },
          ],
        },
        isLoading: false,
        isError: false,
      },
      mutation: { mutate: checkin, isPending: false, isError: false },
    });
  });

  it("loads attendees with the admin code and checks in a selected person", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={["/meets/share-123/checkin?adminShareCode=secret"]}
      >
        <Routes>
          <Route
            path="/meets/:code/checkin"
            element={<AdminMeetCheckinPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(useAdminMeetCheckin).toHaveBeenCalledWith("share-123", "secret");
    expect(screen.getByText("First aid")).toBeInTheDocument();
    await user.click(screen.getByText("Alex"));
    expect(checkin).toHaveBeenCalledWith("one");
  });
});
