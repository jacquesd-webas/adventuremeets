import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionsStep } from "../QuestionsStep";
import { CreateMeetState, initialState } from "../CreateMeetState";

vi.mock("../SelectTemplate", () => ({
  SelectTemplate: () => null,
}));
vi.mock("../../../hooks/useFetchOrganization", () => ({
  useFetchOrganization: () => ({ data: null }),
}));

function TestStep() {
  const [state, setState] = useState<CreateMeetState>({
    ...initialState,
    questions: [
      {
        id: "regular",
        type: "text",
        label: "Transport details",
        category: "T",
      },
      {
        id: "pdf",
        type: "text",
        label: "Parent name",
        category: "P",
        pdfFormFieldId: "ParentName",
      },
    ],
  });

  return <QuestionsStep state={state} setState={setState} />;
}

it("lets organisers change both regular and PDF question categories", async () => {
  render(<TestStep />);
  const user = userEvent.setup();
  const category = screen.getByRole("button", {
    name: "Category for Transport details: Transport",
  });

  expect(category).toHaveTextContent("Transport");
  const pdfCategory = screen.getByRole("button", {
    name: "Category for Parent name: PDF",
  });
  expect(pdfCategory).toHaveTextContent("PDF");

  await user.click(category);
  expect(
    window.getComputedStyle(
      screen.getByRole("menu").closest(".MuiPopover-root")!,
    ).zIndex,
  ).toBe("1501");
  await user.click(screen.getByRole("menuitem", { name: "Medical" }));
  expect(category).toHaveTextContent("Medical");
  expect(category).toHaveAccessibleName(
    "Category for Transport details: Medical",
  );
  await user.click(category);
  await user.click(screen.getByRole("menuitem", { name: "None" }));
  expect(category).toHaveTextContent("None");

  await user.click(pdfCategory);
  await user.click(screen.getByRole("menuitem", { name: "Indemnity" }));
  expect(pdfCategory).toHaveTextContent("Indemnity");
  await user.click(pdfCategory);
  await user.click(screen.getByRole("menuitem", { name: "PDF" }));
  expect(pdfCategory).toHaveTextContent("PDF");
});
