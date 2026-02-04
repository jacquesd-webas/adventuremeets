import { render, screen } from "@testing-library/react";
import { MeetNotFound } from "../MeetNotFound";

describe("MeetNotFound", () => {
  it("renders message and graphic", () => {
    render(<MeetNotFound />);
    expect(screen.getByText(/Meet not found/i)).toBeInTheDocument();
    expect(screen.getByText(/Double-check the link/i)).toBeInTheDocument();
  });
});
