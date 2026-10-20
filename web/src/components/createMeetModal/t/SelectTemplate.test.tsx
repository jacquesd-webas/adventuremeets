import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectTemplate } from "../SelectTemplate";

const queries = vi.hoisted(() => ({
  list: vi.fn(),
  detail: vi.fn(),
}));

vi.mock("../../../context/authContext", () => ({
  useAuth: () => ({ user: null }),
}));
vi.mock("../../../context/organizationContext", () => ({
  useCurrentOrganization: () => ({ currentOrganizationId: "org-1" }),
}));
vi.mock("../../../hooks/useFetchOrganizationTemplates", () => ({
  useFetchOrganizationTemplates: queries.list,
}));
vi.mock("../../../hooks/useFetchOrganizationTemplate", () => ({
  useFetchOrganizationTemplate: queries.detail,
}));

it("labels the clickable template dropdown and applies a selection", async () => {
  const template = {
    id: "template-1",
    name: "Template A",
    metaDefinitions: [],
  };
  const onApplyTemplate = vi.fn();
  queries.list.mockReturnValue({
    data: [template],
    isLoading: false,
    error: null,
  });
  queries.detail.mockImplementation((_orgId, templateId) => ({
    data: templateId ? template : null,
    isLoading: false,
    error: null,
  }));

  render(<SelectTemplate onApplyTemplate={onApplyTemplate} />);
  const importSelect = screen.getByRole("combobox", { name: "Template" });
  expect(screen.getByText("Import...")).toBeInTheDocument();

  const user = userEvent.setup();
  await user.click(importSelect);
  await user.click(screen.getByRole("option", { name: "Template A" }));
  await waitFor(() => expect(onApplyTemplate).toHaveBeenCalledWith(template));
});
