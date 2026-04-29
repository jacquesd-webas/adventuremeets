import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetInfoSummary } from "../MeetInfoSummary";

vi.mock("../../../context/authContext", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

vi.mock("../MeetInfoDeets", () => ({
  MeetInfoDeets: () => <div>Meet details</div>,
}));

describe("MeetInfoSummary", () => {
  it("opens an image carousel when the preview image is clicked", async () => {
    const user = userEvent.setup();

    render(
      <MeetInfoSummary
        meet={{
          id: "meet-1",
          name: "Mountain Hike",
          imageUrl: "https://cdn.example.com/primary.jpg",
          images: [
            {
              id: "image-1",
              meetId: "meet-1",
              url: "https://cdn.example.com/primary.jpg",
              isPrimary: true,
              aspect: "W",
            },
            {
              id: "image-2",
              meetId: "meet-1",
              url: "https://cdn.example.com/secondary.jpg",
              isPrimary: false,
              aspect: "O",
            },
          ],
        }}
        isPreview={false}
      />,
    );

    expect(screen.getByText("+1")).toBeInTheDocument();

    await user.click(screen.getByAltText("Meet preview"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByAltText("Mountain Hike image 1")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Next image"));

    expect(screen.getByAltText("Mountain Hike image 2")).toBeInTheDocument();
  });
});
