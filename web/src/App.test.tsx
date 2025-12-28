import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

describe("App", () => {
  it("renders next steps", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Plan smarter meetings/i)).toBeInTheDocument();
    expect(screen.getByText(/Next steps/i)).toBeInTheDocument();
  });
});
