import { render, screen } from "@testing-library/react";
import { MeetSignupSubmitted } from "../MeetSignupSubmitted";

describe("MeetSignupSubmitted", () => {
  it("renders confirmation content and CTA", () => {
    render(<MeetSignupSubmitted />);
    expect(screen.getByText(/Application submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/Your application has been submitted/i)).toBeInTheDocument();
  });
});
