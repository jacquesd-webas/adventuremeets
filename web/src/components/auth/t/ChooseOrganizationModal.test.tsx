import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChooseOrganizationModal } from "../ChooseOrganizationModal";

const setCurrentOrganizationId = vi.fn();
const onClose = vi.fn();

vi.mock("../../../context/organizationContext", () => ({
  useCurrentOrganization: () => ({
    organizationIds: ["org-1", "org-2"],
    currentOrganizationId: null,
    setCurrentOrganizationId,
  }),
}));

vi.mock("../../../hooks/useFetchOrganisations", () => ({
  useFetchOrganisations: () => ({
    data: [
      { id: "org-1", name: "Alpha Org" },
      { id: "org-2", name: "Beta Org" },
    ],
    isLoading: false,
  }),
}));

describe("ChooseOrganizationModal", () => {
  beforeEach(() => {
    setCurrentOrganizationId.mockClear();
    onClose.mockClear();
  });

  it("renders options and saves selection", async () => {
    render(<ChooseOrganizationModal open onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Choose" }));

    await waitFor(() => {
      expect(setCurrentOrganizationId).toHaveBeenCalledWith("org-1");
      expect(onClose).toHaveBeenCalled();
    });
  });
});
