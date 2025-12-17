import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders next steps", () => {
    render(<App />);
    expect(screen.getByText(/Plan smarter meetings/i)).toBeInTheDocument();
    expect(screen.getByText(/Next steps/i)).toBeInTheDocument();
  });
});
