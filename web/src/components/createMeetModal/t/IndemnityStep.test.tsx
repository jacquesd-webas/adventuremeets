import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IndemnityStep } from "../IndemnityStep";
import { initialState } from "../CreateMeetState";

vi.mock("../SelectTemplate", () => ({
  SelectTemplate: ({ disabled }: { disabled?: boolean }) => (
    <button disabled={disabled}>Import</button>
  ),
}));
vi.mock("../../../hooks/useIndemnityTemplate", () => ({
  useIndemnityTemplate: () => ({
    template: null,
    isLoading: false,
    upload: { isPending: false, isError: false },
    remove: { isPending: false, mutateAsync: vi.fn() },
  }),
}));

function TestStep() {
  const [state, setState] = useState({
    ...initialState,
    indemnityAccepted: true,
  });
  return <IndemnityStep state={state} setState={setState} meetId="meet-1" />;
}

it("replaces indemnity text with a PDF upload when selected", async () => {
  render(<TestStep />);
  const user = userEvent.setup();
  const pdfSwitch = screen.getByRole("checkbox", {
    name: "Use PDF indemnity form",
  });
  const requireSwitch = screen.getByRole("checkbox", {
    name: "Require attendees to accept indemnity",
  });
  const pdfHelp = screen.getByText(
    /Instead of electronic indemnity you may upload a fillable PDF/,
  );

  expect(
    screen.getByPlaceholderText(
      "Paste or write indemnity text attendees must accept",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Indemnity Form" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Import" })).toBeEnabled();
  expect(
    Boolean(
      requireSwitch.compareDocumentPosition(pdfSwitch) &
      Node.DOCUMENT_POSITION_FOLLOWING,
    ),
  ).toBe(true);
  expect(
    Boolean(
      pdfSwitch.compareDocumentPosition(pdfHelp) &
      Node.DOCUMENT_POSITION_FOLLOWING,
    ),
  ).toBe(true);
  expect(pdfHelp).toHaveClass("MuiTypography-caption");
  await user.click(pdfSwitch);
  expect(
    screen.queryByPlaceholderText(
      "Paste or write indemnity text attendees must accept",
    ),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Indemnity Form" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Upload PDF" }),
  ).toBeInTheDocument();

  await user.click(pdfSwitch);
  await waitFor(() => {
    expect(
      screen.getByPlaceholderText(
        "Paste or write indemnity text attendees must accept",
      ),
    ).toBeInTheDocument();
  });
});
