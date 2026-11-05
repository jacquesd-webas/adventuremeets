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

  return (
    <>
      <QuestionsStep state={state} setState={setState} />
      <output data-testid="select-options">
        {JSON.stringify(
          state.questions.find((question) => question.type === "select")
            ?.options ?? [],
        )}
      </output>
    </>
  );
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

it("adds display-only text after the question controls", async () => {
  render(<TestStep />);
  const user = userEvent.setup();

  expect(
    screen.queryByRole("button", { name: "Textfield" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Field" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Check" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /^Text$/ }));

  expect(
    screen.getByText("Text", { selector: ".MuiTypography-root" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Text" })).toBeInTheDocument();
  expect(screen.getAllByText("Required")).toHaveLength(2);
  expect(screen.getAllByText("Include in reports")).toHaveLength(2);
});

it("uses semicolons for select options when present, otherwise commas", async () => {
  render(<TestStep />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Select" }));
  const options = screen.getByRole("textbox", {
    name: "Options (comma or semicolon separated)",
  });

  await user.type(options, "Cape Town, South Africa; Durban, South Africa");
  expect(screen.getByTestId("select-options")).toHaveTextContent(
    '["Cape Town, South Africa","Durban, South Africa"]',
  );

  await user.clear(options);
  await user.type(options, "Red, Blue");
  expect(screen.getByTestId("select-options")).toHaveTextContent(
    '["Red","Blue"]',
  );
});
